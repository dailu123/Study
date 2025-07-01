Of course. Here is the complete, final source code for the entire production-grade project, laid out file by file. You can copy and paste these into your IDE to create the project.

---

### 1. `pom.xml` (Maven Project Dependencies)

This file defines all necessary dependencies, including Spring Boot starters for Web (for Actuator), Kafka, JDBC, Cache, AOP (for transactions), and monitoring tools.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version> <!-- Use a recent Spring Boot version -->
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.example</groupId>
    <artifactId>flow-state-aggregator-pro</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>flow-state-aggregator-pro</name>
    <description>Production-Grade Kafka Flow State Aggregator</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <!-- Core Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>
        
        <!-- Kafka -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>

        <!-- Database Driver -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        
        <!-- Observability & Monitoring -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Utilities -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- Jackson for JSON processing -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.datatype</groupId>
            <artifactId>jackson-datatype-jsr310</artifactId>
        </dependency>

        <!-- Test Dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

---

### 2. `src/main/resources/application.yml` (Configuration)

This file centralizes all application settings, making it easy to tune performance, change database credentials, and configure operational tasks.

```yaml
server:
  port: 8080

# Application-specific custom properties
app:
  kafka:
    topics: topic1,topic2
    # For testing, you can create these topics automatically on startup.
    # In production, topics are usually managed by an administrator.
    # To enable automatic creation, add a KafkaTopicConfig bean.
  archival:
    cron: "0 0 2 * * ?" # Run at 2 AM every day
    retention-days: 7    # Archive records older than 7 days

spring:
  # Database connection configuration
  datasource:
    url: jdbc:mysql://localhost:3306/flow_db?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_mysql_password # <-- IMPORTANT: Change to your MySQL password
    driver-class-name: com.mysql.cj.jdbc.Driver

  # Kafka configuration
  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: flow-state-aggregator-group
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      # Controls the maximum number of records returned in a single call to poll().
      max-poll-records: 500 # Tune this based on message size and memory
    listener:
      # Listener type is set in the KafkaConfig bean, not here.
      # ack-mode is also handled programmatically for better control.
      concurrency: 4 # Number of consumer threads. Should be <= number of partitions.

# Spring Actuator configuration for observability
management:
  endpoints:
    web:
      exposure:
        include: "health,info,prometheus,metrics" # Expose these endpoints
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      application: ${spring.application.name}

# Set the application name for metrics tagging
spring.application.name: flow-state-aggregator
```

---

### 3. `src/main/resources/schema.sql` (Database Schema)

This SQL script sets up the necessary tables for data storage, archiving, and idempotency.

```sql
-- This schema is designed for high-performance, idempotent, and concurrent stream alignment.
CREATE DATABASE IF NOT EXISTS `flow_db`;
USE `flow_db`;

DROP TABLE IF EXISTS `aligned_data`;
DROP TABLE IF EXISTS `aligned_data_archive`;

-- The primary table for storing aligned data.
-- It serves as both the final result and the intermediate state store.
CREATE TABLE `aligned_data` (
  `id`                    bigint unsigned NOT NULL AUTO_INCREMENT,
  `join_key`              varchar(500) NOT NULL COMMENT 'The business key for pairing',

  -- Topic 1 Data & Idempotency Key
  `topic1_msg_id`         varchar(100) DEFAULT NULL COMMENT 'Unique ID of the Topic 1 message for idempotency',
  `topic1_pk_value`       varchar(500) DEFAULT NULL,
  `topic1_payload`        json DEFAULT NULL,

  -- Topic 2 Data & Idempotency Key
  `topic2_msg_id`         varchar(100) DEFAULT NULL COMMENT 'Unique ID of the Topic 2 message for idempotency',
  `topic2_pk_value`       varchar(500) DEFAULT NULL,
  `topic2_status`         varchar(50) DEFAULT NULL,
  `topic2_payload`        json DEFAULT NULL,

  -- Concurrency Control
  `version`               int unsigned NOT NULL DEFAULT '0' COMMENT 'Version for optimistic locking',

  `created_at`            datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  -- UNIQUE keys are CRITICAL for idempotency. They prevent processing the same message twice.
  UNIQUE KEY `uq_topic1_msg_id` (`topic1_msg_id`),
  UNIQUE KEY `uq_topic2_msg_id` (`topic2_msg_id`),
  -- This composite index is crucial for performance when finding available "slots" to fill.
  KEY `idx_find_slot` (`join_key`,`topic1_pk_value`,`topic2_pk_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table to archive old, unpaired records to keep the main table clean.
CREATE TABLE `aligned_data_archive` LIKE `aligned_data`;
ALTER TABLE `aligned_data_archive` DROP INDEX `uq_topic1_msg_id`;
ALTER TABLE `aligned_data_archive` DROP INDEX `uq_topic2_msg_id`;
ALTER TABLE `aligned_data_archive` ADD COLUMN `archived_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

---

### 4. Java Source Code

#### `src/main/java/com/example/flowstate/FlowStateApplication.java` (Main Entry Point)
```java
package com.example.flowstate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
@EnableScheduling
public class FlowStateApplication {

    public static void main(String[] args) {
        SpringApplication.run(FlowStateApplication.class, args);
    }
}
```

#### `src/main/java/com/example/flowstate/config/KafkaConfig.java` (Kafka Configuration)
```java
package com.example.flowstate.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * Configures Kafka listeners, including batch processing and Dead Letter Queues (DLQ).
 */
@Configuration
@EnableKafka
public class KafkaConfig {

    /**
     * Creates a factory for Kafka listeners that process messages in batches.
     * It also configures a robust error handling strategy with retries and a DLQ.
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> batchContainerFactory(
        ConsumerFactory<String, String> consumerFactory,
        KafkaTemplate<String, String> kafkaTemplate
    ) {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setBatchListener(true); // Enable batch consumption

        // ** CRITICAL: Configure Dead Letter Queue (DLQ) for error handling **
        // 1. Create a recoverer that publishes failed messages to a DLQ topic.
        // The topic will be the original topic name + ".DLT" (e.g., "topic1.DLT").
        var recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate);

        // 2. Create an error handler that retries a few times and then uses the recoverer.
        // A backoff of 1 second is applied between retries. Retries = 2 means 3 total attempts.
        var errorHandler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 2));

        factory.setCommonErrorHandler(errorHandler);
        return factory;
    }

    // -- Optional: Beans to auto-create topics on startup for local development --
    @Bean
    public NewTopic topic1() { return TopicBuilder.name("topic1").partitions(4).build(); }
    @Bean
    public NewTopic topic2() { return TopicBuilder.name("topic2").partitions(4).build(); }
    @Bean
    public NewTopic topic1Dlt() { return TopicBuilder.name("topic1.DLT").partitions(1).build(); }
    @Bean
    public NewTopic topic2Dlt() { return TopicBuilder.name("topic2.DLT").partitions(1).build(); }
}
```

#### `src/main/java/com/example/flowstate/dto/*.java` (Data Transfer Objects)

`StepRecord.java`:
```java
package com.example.flowstate.dto;

/**
 * A record representing a single, parsed message from Kafka.
 * It's an immutable data carrier.
 * @param msgId A unique identifier for the message (e.g., "topic-partition-offset").
 * @param joinKey The business key used for pairing (e.g., "aaa").
 * @param payload The original, raw JSON payload of the message.
 */
public record StepRecord(String msgId, String joinKey, String payload) {}
```

`AlignedRow.java`:
```java
package com.example.flowstate.dto;

import lombok.Builder;
import lombok.Data;

/**
 * A mutable Data Transfer Object representing a single row in the `aligned_data` table.
 * It's used to collect all necessary information before performing a batch INSERT or UPDATE.
 */
@Data
@Builder
public class AlignedRow {
    private Long id;       // Only used for UPDATE operations
    private Integer version; // Only used for UPDATE operations

    private String joinKey;

    // Topic 1 data
    private String topic1MsgId;
    private String topic1PkValue;
    private String topic1Payload;

    // Topic 2 data
    private String topic2MsgId;
    private String topic2PkValue;
    private String topic2Status;
    private String topic2Payload;
}
```

`Slot.java`:
```java
package com.example.flowstate.dto;

/**
 * Represents an available "slot" in the database that can be filled.
 * @param id The primary key of the row with the empty slot.
 * @param version The current version of the row, for optimistic locking.
 */
public record Slot(long id, int version) {}
```

#### `src/main/java/com/example/flowstate/kafka/FlowStateListener.java` (Kafka Consumer)
```java
package com.example.flowstate.kafka;

import com.example.flowstate.dto.StepRecord;
import com.example.flowstate.service.BatchAlignmentService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class FlowStateListener {

    private final BatchAlignmentService alignmentService;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;

    public FlowStateListener(BatchAlignmentService alignmentService, ObjectMapper objectMapper, MeterRegistry meterRegistry) {
        this.alignmentService = alignmentService;
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
    }

    /**
     * This single listener consumes from all relevant topics and processes them as one large batch.
     * It uses the custom 'batchContainerFactory' which is configured with DLQ support.
     */
    @KafkaListener(topics = "${app.kafka.topics}",
                   groupId = "${spring.kafka.consumer.group-id}",
                   containerFactory = "batchContainerFactory")
    public void onBatchMessage(List<ConsumerRecord<String, String>> records, Acknowledgment ack) {
        if (records.isEmpty()) {
            ack.acknowledge();
            return;
        }
        log.info("Received a batch of {} records.", records.size());
        meterRegistry.counter("alignment.kafka.batch.received").increment(records.size());

        List<StepRecord> topic1Records = new ArrayList<>();
        List<StepRecord> topic2Records = new ArrayList<>();

        // First, segregate the batch by topic and parse them into StepRecord DTOs.
        for (ConsumerRecord<String, String> record : records) {
            try {
                StepRecord stepRecord = parse(record);
                if ("topic1".equals(record.topic())) {
                    topic1Records.add(stepRecord);
                } else {
                    topic2Records.add(stepRecord);
                }
            } catch (Exception e) {
                // This is a "poison pill" message (e.g., malformed JSON).
                // We log it and throw an exception to trigger the DLQ mechanism.
                log.error("Unrecoverable parsing error for record. It will be sent to DLQ. Record: {}", record, e);
                // Throwing the exception is what triggers the DefaultErrorHandler.
                throw new RuntimeException("Unrecoverable parsing error", e);
            }
        }

        try {
            // Process the entire segregated batch in one transactional service call.
            alignmentService.processBatch(topic1Records, topic2Records);
            ack.acknowledge(); // Acknowledge the entire batch on success
            log.info("Successfully processed batch of {} records.", records.size());
        } catch (Exception e) {
            log.error("A critical error occurred during batch processing. The batch will be retried.", e);
            // We do NOT acknowledge here. The error handler will take over,
            // leading to retries and eventually DLQ for the single problematic message.
            throw e; // Re-throw to let the error handler do its job.
        }
    }

    /**
     * Parses a raw Kafka record into a structured StepRecord.
     * @return A StepRecord containing essential information.
     * @throws JsonProcessingException if the payload is not valid JSON.
     */
    private StepRecord parse(ConsumerRecord<String, String> record) throws JsonProcessingException {
        JsonNode json = objectMapper.readTree(record.value());

        // Assumption: The join key is in a field named "pk" in the JSON payload of BOTH topics.
        String joinKey = json.has("pk") ? json.get("pk").asText() : "unknown";

        // Generate a unique ID for this message. Kafka's coordinates are perfect for this.
        String msgId = String.format("%s-%d-%d", record.topic(), record.partition(), record.offset());

        return new StepRecord(msgId, joinKey, record.value());
    }
}
```

#### `src/main/java/com/example/flowstate/repository/BatchAlignmentRepository.java` (Database Operations)
```java
package com.example.flowstate.repository;

// ... (code is the same as the previous response, but here it is again for completeness)
import com.example.flowstate.dto.AlignedRow;
import com.example.flowstate.dto.Slot;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Repository
@RequiredArgsConstructor
public class BatchAlignmentRepository {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    private final RowMapper<Slot> slotRowMapper = (rs, rowNum) -> new Slot(rs.getLong("id"), rs.getInt("version"));

    public Map<String, List<Slot>> findAvailableSlots(String targetTopic, Collection<String> joinKeys) {
        if (joinKeys.isEmpty()) {
            return Map.of();
        }
        String slotColumn = "topic1".equals(targetTopic) ? "topic2_pk_value" : "topic1_pk_value";
        String inClause = joinKeys.stream().map(k -> "?").collect(Collectors.joining(","));

        String sql = String.format(
            "SELECT id, version, join_key FROM aligned_data WHERE %s IS NULL AND join_key IN (%s)",
            slotColumn, inClause
        );

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, joinKeys.toArray());

        return rows.stream().collect(Collectors.groupingBy(
            row -> (String) row.get("join_key"),
            Collectors.mapping(row -> new Slot((Long) row.get("id"), (Integer) row.get("version")), Collectors.toList())
        ));
    }

    public void batchInsert(List<AlignedRow> rows) {
        if (rows.isEmpty()) return;
        String sql = """
            INSERT IGNORE INTO aligned_data
            (join_key, topic1_msg_id, topic1_pk_value, topic1_payload, topic2_msg_id, topic2_pk_value, topic2_status, topic2_payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """;
        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                AlignedRow row = rows.get(i);
                ps.setString(1, row.getJoinKey());
                ps.setString(2, row.getTopic1MsgId());
                ps.setString(3, row.getTopic1PkValue());
                ps.setString(4, row.getTopic1Payload());
                ps.setString(5, row.getTopic2MsgId());
                ps.setString(6, row.getTopic2PkValue());
                ps.setString(7, row.getTopic2Status());
                ps.setString(8, row.getTopic2Payload());
            }
            @Override
            public int getBatchSize() { return rows.size(); }
        });
    }

    public int[] batchUpdateWithOptimisticLock(String sourceTopic, List<AlignedRow> rows) {
        if (rows.isEmpty()) return;
        String sql;
        if ("topic1".equals(sourceTopic)) {
            sql = "UPDATE aligned_data SET topic1_msg_id = ?, topic1_pk_value = ?, topic1_payload = ?, version = version + 1 WHERE id = ? AND version = ?";
        } else {
            sql = "UPDATE aligned_data SET topic2_msg_id = ?, topic2_pk_value = ?, topic2_status = ?, topic2_payload = ?, version = version + 1 WHERE id = ? AND version = ?";
        }
        return jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                AlignedRow row = rows.get(i);
                if ("topic1".equals(sourceTopic)) {
                    ps.setString(1, row.getTopic1MsgId());
                    ps.setString(2, row.getTopic1PkValue());
                    ps.setString(3, row.getTopic1Payload());
                    ps.setLong(4, row.getId());
                    ps.setInt(5, row.getVersion());
                } else {
                    ps.setString(1, row.getTopic2MsgId());
                    ps.setString(2, row.getTopic2PkValue());
                    ps.setString(3, row.getTopic2Status());
                    ps.setString(4, row.getTopic2Payload());
                    ps.setLong(5, row.getId());
                    ps.setInt(6, row.getVersion());
                }
            }
            @Override
            public int getBatchSize() { return rows.size(); }
        });
    }

    public int archiveAndPruneStaleRecords(int retentionDays) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        String insertSql = "INSERT INTO aligned_data_archive SELECT *, NOW() FROM aligned_data WHERE created_at < ? AND (topic1_pk_value IS NULL OR topic2_pk_value IS NULL)";
        jdbcTemplate.update(insertSql, cutoff);

        String deleteSql = "DELETE FROM aligned_data WHERE created_at < ? AND (topic1_pk_value IS NULL OR topic2_pk_value IS NULL)";
        return jdbcTemplate.update(deleteSql, cutoff);
    }
}
```

#### `src/main/java/com/example/flowstate/service/BatchAlignmentService.java` (Core Business Logic)
```java
package com.example.flowstate.service;

// ... (code is the same as the previous response, but here it is again for completeness)
import com.example.flowstate.dto.AlignedRow;
import com.example.flowstate.dto.Slot;
import com.example.flowstate.dto.StepRecord;
import com.example.flowstate.repository.BatchAlignmentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BatchAlignmentService {

    private final BatchAlignmentRepository repository;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;

    @Transactional
    public void processBatch(List<StepRecord> topic1Records, List<StepRecord> topic2Records) {
        // Step 1: In-memory pairing
        Map<String, Deque<StepRecord>> t1Grouped = groupRecords(topic1Records);
        Map<String, Deque<StepRecord>> t2Grouped = groupRecords(topic2Records);

        List<AlignedRow> completelyPaired = new ArrayList<>();
        Set<String> allKeys = new HashSet<>(t1Grouped.keySet());
        allKeys.addAll(t2Grouped.keySet());

        for (String key : allKeys) {
            Deque<StepRecord> t1q = t1Grouped.getOrDefault(key, new LinkedList<>());
            Deque<StepRecord> t2q = t2Grouped.getOrDefault(key, new LinkedList<>());

            while (!t1q.isEmpty() && !t2q.isEmpty()) {
                completelyPaired.add(createPairedRow(key, t1q.poll(), t2q.poll()));
            }
        }
        
        log.info("In-memory pairing complete. {} fully paired rows produced.", completelyPaired.size());
        meterRegistry.counter("alignment.inmemory.pairs").increment(completelyPaired.size());

        repository.batchInsert(completelyPaired);

        handleLeftovers("topic1", t1Grouped);
        handleLeftovers("topic2", t2Grouped);
    }

    private void handleLeftovers(String sourceTopic, Map<String, Deque<StepRecord>> leftovers) {
        Map<String, Deque<StepRecord>> remaining = leftovers.entrySet().stream()
                .filter(e -> !e.getValue().isEmpty())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        if (remaining.isEmpty()) return;
        
        log.info("Handling {} keys with leftover records from {}.", remaining.keySet().size(), sourceTopic);

        Map<String, List<Slot>> availableSlots = repository.findAvailableSlots(sourceTopic.equals("topic1") ? "topic2" : "topic1", remaining.keySet());

        List<AlignedRow> toUpdate = new ArrayList<>();
        List<AlignedRow> toInsert = new ArrayList<>();

        for (Map.Entry<String, Deque<StepRecord>> entry : remaining.entrySet()) {
            String key = entry.getKey();
            Deque<StepRecord> records = entry.getValue();
            List<Slot> slots = availableSlots.getOrDefault(key, Collections.emptyList());
            int slotIdx = 0;

            while (!records.isEmpty()) {
                StepRecord record = records.poll();
                if (slotIdx < slots.size()) {
                    toUpdate.add(createRowForUpdate(sourceTopic, record, slots.get(slotIdx++)));
                } else {
                    toInsert.add(createRowForInsert(sourceTopic, record));
                }
            }
        }
        
        if (!toUpdate.isEmpty()) {
            log.info("Attempting to batch update {} existing slots for {}.", toUpdate.size(), sourceTopic);
            int[] updateResults = repository.batchUpdateWithOptimisticLock(sourceTopic, toUpdate);
            
            List<AlignedRow> failedUpdates = new ArrayList<>();
            for (int i = 0; i < updateResults.length; i++) {
                if (updateResults[i] == 0) {
                    failedUpdates.add(toUpdate.get(i));
                    meterRegistry.counter("alignment.optimistic.lock.failures", "topic", sourceTopic).increment();
                }
            }

            if (!failedUpdates.isEmpty()) {
                log.warn("{} records from {} failed optimistic lock. Will attempt to insert them as new rows.", failedUpdates.size(), sourceTopic);
                failedUpdates.forEach(failedRow -> toInsert.add(rebuildInsertFromFailedUpdate(sourceTopic, failedRow)));
            }
        }
        
        if (!toInsert.isEmpty()) {
            log.info("Attempting to batch insert {} new rows for {}.", toInsert.size(), sourceTopic);
            repository.batchInsert(toInsert);
        }
    }

    private Map<String, Deque<StepRecord>> groupRecords(List<StepRecord> records) {
        return records.stream().collect(Collectors.groupingBy(
            StepRecord::joinKey,
            Collectors.toCollection(LinkedList::new)
        ));
    }

    private AlignedRow createRowForInsert(String topic, StepRecord rec) {
        AlignedRow.AlignedRowBuilder builder = AlignedRow.builder().joinKey(rec.joinKey());
        try {
            JsonNode json = objectMapper.readTree(rec.payload());
            if ("topic1".equals(topic)) {
                builder.topic1MsgId(rec.msgId()).topic1PkValue(json.get("pk").asText()).topic1Payload(rec.payload());
            } else {
                builder.topic2MsgId(rec.msgId()).topic2PkValue(json.get("pk").asText()).topic2Status(json.get("status").asText()).topic2Payload(rec.payload());
            }
        } catch (JsonProcessingException e) { throw new RuntimeException(e); }
        return builder.build();
    }
    
    private AlignedRow createRowForUpdate(String topic, StepRecord rec, Slot slot) {
        AlignedRow row = createRowForInsert(topic, rec);
        row.setId(slot.id());
        row.setVersion(slot.version());
        return row;
    }
    
    private AlignedRow rebuildInsertFromFailedUpdate(String topic, AlignedRow failedRow) {
        failedRow.setId(null);
        failedRow.setVersion(null);
        return failedRow;
    }

    private AlignedRow createPairedRow(String key, StepRecord s1, StepRecord s2) {
        AlignedRow row1 = createRowForInsert("topic1", s1);
        AlignedRow row2 = createRowForInsert("topic2", s2);
        return AlignedRow.builder()
            .joinKey(key)
            .topic1MsgId(row1.getTopic1MsgId()).topic1PkValue(row1.getTopic1PkValue()).topic1Payload(row1.getTopic1Payload())
            .topic2MsgId(row2.getTopic2MsgId()).topic2PkValue(row2.getTopic2PkValue()).topic2Status(row2.getTopic2Status()).topic2Payload(row2.getTopic2Payload())
            .build();
    }
}
```

#### `src/main/java/com/example/flowstate/tasks/ArchivalTask.java` (Scheduled Job)
```java
package com.example.flowstate.tasks;

import com.example.flowstate.repository.BatchAlignmentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * A scheduled task to perform regular maintenance on the data tables.
 */
@Slf4j
@Component
public class ArchivalTask {

    private final BatchAlignmentRepository repository;
    private final int retentionDays;

    public ArchivalTask(BatchAlignmentRepository repository, @Value("${app.archival.retention-days}") int retentionDays) {
        this.repository = repository;
        this.retentionDays = retentionDays;
    }

    /**
     * This task runs based on the cron expression in application.yml.
     * It finds old, incomplete (unpaired) records and moves them to an archive table,
     * then deletes them from the primary table to keep it clean and fast.
     */
    @Scheduled(cron = "${app.archival.cron}")
    public void archiveStaleRecords() {
        log.info("Starting archival task for records older than {} days...", retentionDays);
        try {
            int archivedCount = repository.archiveAndPruneStaleRecords(retentionDays);
            if (archivedCount > 0) {
                log.info("Successfully archived and pruned {} stale records.", archivedCount);
            } else {
                log.info("No stale records found to archive.");
            }
        } catch (Exception e) {
            log.error("Archival task failed.", e);
        }
    }
}
```
