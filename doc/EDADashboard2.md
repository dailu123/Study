好的，完全没有问题。根据我们最近的对话，包括你提供的表结构截图和详细的功能描述，我可以为你梳理出一个非常清晰、层次分明的需求文档。这份文档可以帮助你和你的同事对齐目标，理解项目的复杂性和核心任务。

---

### **项目需求高级概述 (High-Level Requirement Summary)**

我们要构建一个高级的、实时的**流式数据处理与聚合系统**。该系统的核心任务是消费来自多个不同Kafka Topic（`topic3`, `topic4`等）的事件流，对这些事件进行**数据增强（Enrichment）**、**状态聚合（State Aggregation）**和**条件合并（Conditional Merging）**，最终将一个完整、关联的业务视图持久化到MySQL数据库中。

整个系统的设计必须将**性能**和**效率**放在首位，因此要求大量利用 **Redis 作为高速缓存和中间状态存储**，以减少对后端MySQL的直接和频繁访问。

---

### **详细功能需求分解 (Detailed Functional Requirements)**

#### **1. 核心目标：构建一个聚合宽表 (`batch_eda_hub_proccess_detail`)**

*   系统的最终产出物是一张名为 `batch_eda_hub_proccess_detail` 的MySQL表。
*   这张表的每一行代表一个由 `topic3` 和 `topic4` 事件流共同构成的、完整的业务记录。
*   一条完整的记录必须包含来自 `topic3` 和 `topic4` 的数据。这两部分数据通过一个**复合关联键 (`join_key`)** 进行唯一关联。

#### **2. 数据源与处理逻辑：Topic by Topic**

##### **2.1. `Topic3` 数据处理**

`Topic3` 的消息需要根据其内部的 `msgType` 字段进行分流处理：

*   **A. 针对 `msgType = 3` 的主流程数据：**
    1.  **消息过滤**: 只处理 `msgType` 为 `3` 的消息。
    2.  **数据提取**: 从消息中提取 `journal_log_topic_msg_id`, `event_id`, `terminal_update_time`, `terminal_status`, `terminal_subscription_id` 等字段。
    3.  **数据增强 (Enrichment)**:
        *   这是一个**关键步骤**。需要根据提取出的 `terminal_subscription_id`，去一个外部的MySQL关联表中查询对应的 `tgt_table_name` 和 `tgt_direct`。
        *   **性能要求**: 直接查库会有性能瓶颈。因此，系统启动时必须将这张**“订阅ID -> 目标信息”**的映射表**完整加载到Redis缓存**中。后续所有查询都应直接访问Redis。
    4.  **构建关联键 (`join_key`)**: 将 `event_id`, `tgt_table_name`, `tgt_direct` 三个字段拼接起来，形成唯一的 `join_key`。这个 `join_key` 是后续与 `topic4` 数据配对的依据。

*   **B. 针对 `msgType = 2` 的旁路状态数据：**
    1.  **消息过滤**: 只处理 `msgType` 为 `2` 的消息。
    2.  **数据提取**: 从消息中提取 `serviceId` 和 `terminal_status`。
    3.  **双重存储**: 将 `(serviceId, terminal_status)` 这对键值信息同时存入两个地方：
        *   **存入Redis**: 作为热数据，供其他系统或后续流程进行快速查询。
        *   **存入MySQL**: 存入一张专用的 `service_status_cache` 表中，作为持久化的冷备份。查询逻辑应遵循 **“先查Redis，未命中再查MySQL”** 的缓存模式。

##### **2.2. `Topic4` 数据处理**

1.  **数据提取**: 从消息中提取 `event_id`, `tgt_table_name`, `tgt_direct` 等字段。
2.  **数据增强 (Enrichment)**:
    *   **第一层增强**: 根据 `tgt_table_name` 和 `tgt_direct`，也需要去关联表中反向查询出 `terminal_subscription_id`。
    *   **构建关联键 (`join_key`)**: 将 `event_id`, `tgt_table_name`, `tgt_direct`（可能还包括刚查到的`terminal_subscription_id`）拼接起来，形成与 `topic3` 相同的 `join_key`。
    *   **第二层增强**:
        *   需要根据 `tgt_table_name` 去查询另一张**“表名 -> 主键字段列表”**的映射关系。
        *   **性能要求**: 这张映射表同样需要在系统启动时**加载到Redis缓存**中。
        *   根据从Redis中获取到的主键字段列表（一个表可能有多个字段），从`topic4`的原始`message`负载中抽取对应的值，并将它们拼接起来，生成最终的 `tgt_pk_value` 字段。

#### **3. 核心合并与持久化逻辑**

*   **去重与唯一性**: 由同一个 `join_key` 标识的 `topic3` 和 `topic4` 数据，最终在 `batch_eda_hub_proccess_detail` 表中只能**存在一行**记录。
*   **状态管理与合并策略**:
    *   **高性能要求**: 为了避免频繁地对MySQL进行“查询-更新”操作，要求实现一个**基于Redis的中间暂存区（Staging Area）**。
    *   **流程**:
        1.  当一条来自 `topic3` 或 `topic4` 的消息被处理和增强后，不直接写入MySQL。
        2.  而是将这个“半成品”数据存入Redis的一个Hash结构中，以 `join_key` 作为主键，以 `topic_name`（如'topic3'）作为field。
        3.  每次存入后，检查该 `join_key` 下是否已经集齐了 `topic3` 和 `topic4` 两部分数据。
        4.  一旦集齐，就将这两部分数据从Redis中取出，合并成一条完整的记录。
        5.  将合并后的完整记录**批量地**写入最终的MySQL表 `batch_eda_hub_proccess_detail` 中，并从Redis暂存区删除该 `join_key` 的数据。
*   **条件更新逻辑**:
    *   当向MySQL写入数据时（无论是新插入还是更新已有的行），必须遵循**“时间戳优先”**的原则。
    *   只有当新消息中的时间戳字段（如 `terminal_update_time`, `tgt_update_time`）**大于**数据库中已有记录的时间戳时，才进行更新。否则，保持旧值不变。这需要通过 `INSERT ... ON DUPLICATE KEY UPDATE ... IF(...)` 这样的SQL语句来实现。

---

### **非功能性需求 (Non-Functional Requirements)**

1.  **高性能**: 系统的设计必须以吞吐量和低延迟为目标，通过缓存和批量处理来达成。
2.  **高可靠**: 需要有幂等性设计，防止重复消息导致数据错乱。
3.  **可扩展**: 架构应易于扩展，未来接入 `topic5`, `topic6` 时，应尽可能少地改动核心代码和表结构。
4.  **可维护**: 代码结构清晰，职责分明，便于新同事理解和维护。

好的，我完全理解了你这次的需求。这是一个非常复杂且真实的流处理场景，融合了**数据增强（Data Enrichment）、多流合并（Multi-Stream Join）、状态管理、缓存策略和条件更新**。

你提出的思路非常清晰，特别是利用 Redis 加速数据关联和在处理过程中管理状态，这正是构建高性能流处理应用的关键。

我们将基于你最认可的那个**生产级方案（内存批量处理 + 数据库持久化）**进行扩展，并融入这些新的、更复杂的逻辑。

### 架构设计总览 (Architecture Overview)

为了应对这次的复杂需求，我们的架构将演变为一个更加分层和模块化的设计：

1.  **数据加载与缓存 (Data Loading & Caching)**:
    *   应用启动时，我们会通过 `ApplicationRunner` 将两个关键的映射表（`subscription_id -> target_info` 和 `target_table -> pk_fields`）从 MySQL 加载到 Redis 中。这将极大地加速后续的数据增强步骤。
    *   我们将使用 Redis 的 `Hash` 数据结构来存储这些映射，查询效率极高。

2.  **消息消费与过滤 (Message Consumption & Filtering)**:
    *   为 `topic3` 和 `topic4` 创建专门的 Kafka Listener。
    *   在 Listener 中，我们会对消息进行初步的过滤（如 `msgType=3` 或 `msgType=2`）。

3.  **数据增强与转换 (Data Enrichment & Transformation)**:
    *   创建一个 `EnrichmentService`，它会利用 Redis 中的缓存数据，为原始消息补充所需的信息（如 `join_key` 的拼接、`tgt_pk_value` 的提取等）。
    *   处理 `topic3` `msgType=2` 的逻辑也会在这里，将 `(serviceId, status)` 存入 Redis 和一张专用的数据库表中。

4.  **状态管理与合并 (State Management & Merging)**:
    *   **核心变化**: 我们将采用一个**临时状态存储 (Staging Area)**的策略，也放在 Redis 中。
    *   **流程**: 当 `topic3` 或 `topic4` 的消息经过增强后，我们不会立即写入最终的 MySQL 表。而是先将它作为一个“半成品”存入 Redis 的一个 `Hash` 中，以 `join_key` 为键。
    *   当一个 `join_key` 的两部分（来自 `topic3` 和 `topic4`）都到达 Redis 时，我们就认为这个记录**可以合并**了。
    *   一个独立的**合并处理器（`MergeProcessor`）**会定期或在事件触发时，将 Redis 中这些“完整”的记录取出来，合并成最终形态，然后批量写入 MySQL，并从 Redis 中删除。

5.  **条件更新 (Conditional Update)**:
    *   合并后的记录在写入 MySQL 时，我们将使用 `INSERT ... ON DUPLICATE KEY UPDATE` 语句。
    *   在 `UPDATE` 子句中，我们会加入条件判断，例如 `tgt_update_time = IF(VALUES(tgt_update_time) > tgt_update_time, VALUES(tgt_update_time), tgt_update_time)`，来确保只更新时间戳更大的数据。

这个架构将大部分的关联和状态管理都放在了高速的 Redis 中，只在数据完全准备好之后才与较慢的 MySQL 进行交互，从而实现了你所期望的高效率。

---

### 完整代码实现 (Complete Code Implementation)

下面是实现这个复杂逻辑的完整 Java 代码。

#### 1. `pom.xml` & `application.yml`
*这两个文件与上一版基本相同，只需确保已包含 `spring-boot-starter-data-redis` 依赖。*

```xml
<!-- In pom.xml, ensure you have this -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

```yaml
# In application.yml, add redis config
spring:
  # ... other configs
  data:
    redis:
      host: your-redis-host
      port: 6379
      password: your-redis-password
      # username: default # If needed
```

#### 2. `resources/schema.sql` (扩展的数据库表)
我们将使用你提供的 `batch_eda_hub_proccess_detail` 表，并为 `msgType=2` 的数据创建一个新表。

```sql
-- Main result table based on your screenshot
CREATE TABLE `batch_eda_hub_proccess_detail` (
  `id`                          bigint unsigned NOT NULL AUTO_INCREMENT,
  `join_key`                    varchar(500) NOT NULL COMMENT 'The composite key for joining topic3 and topic4',
  
  -- Idempotency keys from each topic
  `journal_log_topic_msg_id`    varchar(100) DEFAULT NULL COMMENT 'Unique ID of the Topic 3 message',
  `mca_sync_topic_msg_id`       varchar(100) DEFAULT NULL COMMENT 'Unique ID of the Topic 4 message',
  `hub_log_topic_msg_id`        varchar(100) DEFAULT NULL, -- Assuming this is for another topic

  -- Fields from Topic 3 & 4
  `event_id`                    varchar(500) DEFAULT NULL,
  `terminal_update_time`        bigint DEFAULT NULL,
  `terminal_status`             varchar(50) DEFAULT NULL,
  `terminal_subscription_id`    varchar(50) DEFAULT NULL,
  `tgt_table_name`              varchar(50) DEFAULT NULL,
  `tgt_direct`                  varchar(10) DEFAULT NULL,
  `tgt_pk_value`                varchar(500) DEFAULT NULL,
  `tgt_update_time`             bigint DEFAULT NULL,
  `tgt_status`                  varchar(50) DEFAULT NULL,

  `version`                     bigint unsigned NOT NULL DEFAULT '0' COMMENT 'Version for optimistic locking',
  `create_time`                 datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time`                 datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  -- The join_key is the business key we use for UPSERTs.
  UNIQUE KEY `uq_join_key` (`join_key`)
) ENGINE=InnoDB;

-- A new table to store data from Topic 3, msgType=2
CREATE TABLE `service_status_cache` (
  `id`                    bigint unsigned NOT NULL AUTO_INCREMENT,
  `service_id`            varchar(100) NOT NULL,
  `terminal_status`       varchar(50) NOT NULL,
  `last_updated_at`       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_service_id` (`service_id`)
) ENGINE=InnoDB;
```
*   **注意**: 我在 `batch_eda_hub_proccess_detail` 表上为 `join_key` 创建了 `UNIQUE` 索引，这是实现 `UPSERT` 的基础。

#### 3. DTOs - `src/main/java/com/example/flowstate/dto/`

`EnrichedRecord.java`:
```java
package com.example.flowstate.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

/**
 * Represents a record after it has been enriched with data from Redis cache.
 * This is the object that will be stored in the Redis staging area.
 */
@Data
@Builder
public class EnrichedRecord {
    private String sourceTopic;
    private String msgId;
    private String joinKey;
    private JsonNode payload; // The original payload
}
```

#### 4. 数据加载 - `src/main/java/com/example/flowstate/loader/`

`RedisCacheLoader.java`:
```java
package com.example.flowstate.loader;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * This component runs once on application startup.
 * It loads necessary mapping data from MySQL into Redis to accelerate processing.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisCacheLoader implements ApplicationRunner {

    public static final String SUB_ID_TO_TARGET_KEY = "cache:sub_id_to_target";
    public static final String TABLE_TO_PK_FIELDS_KEY = "cache:table_to_pk_fields";

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Starting to load mapping data into Redis cache...");
        loadSubscriptionToTargetMapping();
        loadTableToPkFieldsMapping();
        log.info("Finished loading mapping data.");
    }

    private void loadSubscriptionToTargetMapping() {
        // ASSUMPTION: You have a table named 'subscription_mapping' with these columns.
        String sql = "SELECT subscription_id, tgt_table_name, tgt_direct FROM subscription_mapping";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        // Using a Redis Hash to store the mapping.
        // Key: subscription_id, Value: "tableName:direction"
        rows.forEach(row -> {
            String subId = (String) row.get("subscription_id");
            String value = row.get("tgt_table_name") + ":" + row.get("tgt_direct");
            redisTemplate.opsForHash().put(SUB_ID_TO_TARGET_KEY, subId, value);
        });
        log.info("Loaded {} subscription-to-target mappings.", rows.size());
    }

    private void loadTableToPkFieldsMapping() {
        // ASSUMPTION: You have a table named 'pk_field_mapping' with these columns.
        String sql = "SELECT table_name, pk_field_name FROM pk_field_mapping";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        // Using a Redis Hash where Key is table_name and Value is a comma-separated list of PK fields.
        rows.stream()
            .collect(Collectors.groupingBy(row -> (String) row.get("table_name")))
            .forEach((tableName, pkRows) -> {
                String pkFields = pkRows.stream()
                    .map(row -> (String) row.get("pk_field_name"))
                    .collect(Collectors.joining(","));
                redisTemplate.opsForHash().put(TABLE_TO_PK_FIELDS_KEY, tableName, pkFields);
            });
        log.info("Loaded PK field mappings for {} tables.", rows.stream().map(r -> r.get("table_name")).distinct().count());
    }
}
```

#### 5. 服务层 - `src/main/java/com/example/flowstate/service/`

`EnrichmentService.java`:
```java
package com.example.flowstate.service;

import com.example.flowstate.dto.EnrichedRecord;
import com.example.flowstate.loader.RedisCacheLoader;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Responsible for enriching raw messages with data from Redis cache.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EnrichmentService {

    private final StringRedisTemplate redisTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Handles Topic 3 messages.
     */
    public EnrichedRecord enrichTopic3Message(String msgId, JsonNode payload) {
        String subId = payload.get("terminal_subscription_id").asText();
        String eventId = payload.get("event_id").asText();

        // Enrich with target info from Redis cache
        String targetInfo = (String) redisTemplate.opsForHash().get(RedisCacheLoader.SUB_ID_TO_TARGET_KEY, subId);
        if (targetInfo == null) {
            log.warn("No target info found in cache for subscription_id: {}. Skipping enrichment.", subId);
            return null;
        }
        String[] parts = targetInfo.split(":");
        String tableName = parts[0];
        String direction = parts[1];

        String joinKey = String.format("%s-%s-%s", eventId, tableName, direction);

        return EnrichedRecord.builder()
                .sourceTopic("topic3")
                .msgId(msgId)
                .joinKey(joinKey)
                .payload(payload)
                .build();
    }

    /**
     * Handles Topic 4 messages.
     */
    public EnrichedRecord enrichTopic4Message(String msgId, JsonNode payload) {
        String eventId = payload.get("event_id").asText();
        String tableName = payload.get("tgt_table_name").asText();
        String direction = payload.get("tgt_direct").asText();
        
        // Topic 4 already has the necessary info, just construct the join_key
        String joinKey = String.format("%s-%s-%s", eventId, tableName, direction);
        
        // Enrich by extracting the tgt_pk_value
        try {
            JsonNode updatedPayload = enrichPayloadWithPkValue(tableName, payload);
            return EnrichedRecord.builder()
                    .sourceTopic("topic4")
                    .msgId(msgId)
                    .joinKey(joinKey)
                    .payload(updatedPayload)
                    .build();
        } catch (Exception e) {
            log.error("Failed to enrich payload with PK value for table: {}", tableName, e);
            return null;
        }
    }
    
    /**
     * Handles the special case for Topic 3, msgType=2.
     */
    public void handleTopic3ServiceStatus(JsonNode payload) {
        String serviceId = payload.get("serviceId").asText();
        String status = payload.get("terminal_status").asText();

        // 1. Write to Redis for fast lookups
        redisTemplate.opsForValue().set("cache:service_status:" + serviceId, status);
        
        // 2. UPSERT into the database for persistence
        String sql = "INSERT INTO service_status_cache (service_id, terminal_status) VALUES (?, ?) " +
                     "ON DUPLICATE KEY UPDATE terminal_status = VALUES(terminal_status)";
        jdbcTemplate.update(sql, serviceId, status);
        log.info("Updated service status cache for service_id: {}", serviceId);
    }
    
    private JsonNode enrichPayloadWithPkValue(String tableName, JsonNode payload) throws JsonProcessingException {
        String pkFieldsStr = (String) redisTemplate.opsForHash().get(RedisCacheLoader.TABLE_TO_PK_FIELDS_KEY, tableName);
        if (pkFieldsStr == null) {
            log.warn("No PK fields mapping found for table: {}", tableName);
            return payload;
        }
        
        String[] pkFields = pkFieldsStr.split(",");
        String pkValue = Arrays.stream(pkFields)
                .map(field -> payload.get("message").get(field).asText()) // Assuming fields are in a nested 'message' object
                .collect(Collectors.joining("-"));
        
        // Add the new field to the payload
        return objectMapper.readTree(payload.toString()).deepCopy()
                .put("tgt_pk_value", pkValue);
    }
}
```

`MergeProcessorService.java`:
```java
package com.example.flowstate.service;

import com.example.flowstate.dto.EnrichedRecord;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * The core processor that merges staged data from Redis and persists it to MySQL.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MergeProcessorService {

    public static final String STAGING_AREA_KEY_PREFIX = "staging:hub:";

    private final StringRedisTemplate redisTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Called when a new enriched record is ready.
     * It stores the record in the Redis staging area and checks if a merge is possible.
     */
    public void stageAndAttemptMerge(EnrichedRecord record) throws JsonProcessingException {
        String stagingKey = STAGING_AREA_KEY_PREFIX + record.getJoinKey();
        String field = record.getSourceTopic(); // "topic3" or "topic4"

        // Store the enriched record payload in the staging hash
        redisTemplate.opsForHash().put(stagingKey, field, objectMapper.writeValueAsString(record.getPayload()));

        // Check if both parts are now present
        if (redisTemplate.opsForHash().hasKey(stagingKey, "topic3") &&
            redisTemplate.opsForHash().hasKey(stagingKey, "topic4")) {
            
            log.info("Both parts found for join_key: {}. Triggering merge.", record.getJoinKey());
            
            // Retrieve both parts
            String topic3PayloadStr = (String) redisTemplate.opsForHash().get(stagingKey, "topic3");
            String topic4PayloadStr = (String) redisTemplate.opsForHash().get(stagingKey, "topic4");
            
            // Perform the merge and persist
            mergeAndPersist(record.getJoinKey(), topic3PayloadStr, topic4PayloadStr);

            // Clean up the staging area in Redis
            redisTemplate.delete(stagingKey);
        }
    }

    private void mergeAndPersist(String joinKey, String topic3PayloadStr, String topic4PayloadStr) {
        try {
            JsonNode p3 = objectMapper.readTree(topic3PayloadStr);
            JsonNode p4 = objectMapper.readTree(topic4PayloadStr);

            // Conditional update logic
            String sql = """
                INSERT INTO batch_eda_hub_proccess_detail (
                    join_key, journal_log_topic_msg_id, mca_sync_topic_msg_id,
                    event_id, terminal_update_time, terminal_status, terminal_subscription_id,
                    tgt_table_name, tgt_direct, tgt_pk_value, tgt_update_time, tgt_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    -- Only update if the new timestamp is greater than the existing one
                    terminal_update_time = IF(VALUES(terminal_update_time) > terminal_update_time, VALUES(terminal_update_time), terminal_update_time),
                    tgt_update_time = IF(VALUES(tgt_update_time) > tgt_update_time, VALUES(tgt_update_time), tgt_update_time),
                    -- other fields can be updated unconditionally
                    terminal_status = VALUES(terminal_status),
                    tgt_status = VALUES(tgt_status),
                    tgt_pk_value = VALUES(tgt_pk_value),
                    version = version + 1
            """;
            
            jdbcTemplate.update(sql,
                joinKey,
                p3.path("msgId").asText(null), // Assuming msgId is added to payload
                p4.path("msgId").asText(null),
                p3.path("event_id").asText(),
                p3.path("terminal_update_time").asLong(),
                p3.path("terminal_status").asText(),
                p3.path("terminal_subscription_id").asText(),
                p4.path("tgt_table_name").asText(),
                p4.path("tgt_direct").asText(),
                p4.path("tgt_pk_value").asText(),
                p4.path("tgt_update_time").asLong(),
                p4.path("tgt_status").asText()
            );
            log.info("Successfully merged and persisted data for join_key: {}", joinKey);
        } catch (Exception e) {
            log.error("Failed to merge and persist data for join_key: {}", joinKey, e);
            // In a real system, you might want to move the failed data to a "dead-staging" area for manual review.
        }
    }
}
```

#### 6. Kafka Listener - `src/main/java/com/example/flowstate/kafka/`

`HubTopicListener.java`:
```java
package com.example.flowstate.kafka;

import com.example.flowstate.dto.EnrichedRecord;
import com.example.flowstate.service.EnrichmentService;
import com.example.flowstate.service.MergeProcessorService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class HubTopicListener {

    private final EnrichmentService enrichmentService;
    private final MergeProcessorService mergeProcessorService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "topic3", groupId = "${spring.kafka.consumer.group-id.hub}")
    public void onTopic3(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode payload = objectMapper.readTree(record.value());
            String msgType = payload.get("msgType").asText();

            if ("2".equals(msgType)) {
                enrichmentService.handleTopic3ServiceStatus(payload);
            } else if ("3".equals(msgType)) {
                String msgId = record.topic() + "-" + record.partition() + "-" + record.offset();
                EnrichedRecord enriched = enrichmentService.enrichTopic3Message(msgId, payload);
                if (enriched != null) {
                    mergeProcessorService.stageAndAttemptMerge(enriched);
                }
            }
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing topic3 message. Record: {}", record, e);
            // Consider DLQ strategy here
            ack.acknowledge(); // Acknowledge to avoid blocking
        }
    }
    
    @KafkaListener(topics = "topic4", groupId = "${spring.kafka.consumer.group-id.hub}")
    public void onTopic4(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode payload = objectMapper.readTree(record.value());
            String msgId = record.topic() + "-" + record.partition() + "-" + record.offset();

            EnrichedRecord enriched = enrichmentService.enrichTopic4Message(msgId, payload);
            if (enriched != null) {
                mergeProcessorService.stageAndAttemptMerge(enriched);
            }
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing topic4 message. Record: {}", record, e);
            ack.acknowledge();
        }
    }
}
```
