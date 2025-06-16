<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>rocketmq-cleanup</artifactId>
  <version>1.0.0</version>

  <dependencies>
    <!-- 阿里云 OpenAPI Core SDK，用于签名和请求分发 -->
    <dependency>
      <groupId>com.aliyun</groupId>
      <artifactId>aliyun-java-sdk-core</artifactId>
      <version>4.7.6</version>
      <optional>true</optional>
    </dependency> <!-- :contentReference[oaicite:0]{index=0} -->

    <!-- 阿里云 MQ RocketMQ（ONS）4.x 版 OpenAPI SDK -->
    <dependency>
      <groupId>com.aliyun</groupId>
      <artifactId>aliyun-java-sdk-ons</artifactId>
      <version>2.0.0</version>
    </dependency> <!-- :contentReference[oaicite:1]{index=1} -->

    <!-- 用于解析 API 返回的 JSON 字符串 -->
    <dependency>
      <groupId>com.google.code.gson</groupId>
      <artifactId>gson</artifactId>
      <version>2.8.9</version>
    </dependency> <!-- :contentReference[oaicite:2]{index=2} -->

    <!-- 日志 -->
    <dependency>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-api</artifactId>
      <version>1.7.36</version>
    </dependency>
    <dependency>
      <groupId>ch.qos.logback</groupId>
      <artifactId>logback-classic</artifactId>
      <version>1.2.11</version>
    </dependency>
  </dependencies>
</project>


package com.example.rocketmqcleanup;

import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.IAcsClient;
import com.aliyuncs.exceptions.ClientException;
import com.aliyuncs.ons.model.v20190214.*;
import com.aliyuncs.profile.DefaultProfile;
import com.google.gson.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * 清理指定实例下的所有 Topic 和 Consumer Group
 */
public class RocketMQCleanup {
    private static final Logger logger = LoggerFactory.getLogger(RocketMQCleanup.class);
    private final IAcsClient client;
    private final String instanceId;
    private final Gson gson = new Gson();

    public RocketMQCleanup(String regionId,
                           String accessKeyId, String accessKeySecret,
                           String endpoint, String instanceId) throws ClientException {
        // 1. 创建 DefaultProfile，并指定 Region、AK
        DefaultProfile profile = DefaultProfile.getProfile(regionId, accessKeyId, accessKeySecret);

        // 2. 如果指定了自定义 Endpoint（可用于 VPC 私有链路），则添加：
        if (endpoint != null && !endpoint.isEmpty()) {
            // product = "Ons"，domain = endpoint
            DefaultProfile.addEndpoint(regionId, regionId, "Ons", endpoint);
            logger.info("Added custom endpoint: {}", endpoint);
        }

        this.client = new DefaultAcsClient(profile);
        this.instanceId = instanceId;
    }

    /** 列出并删除所有 Topic */
    public void deleteAllTopics() {
        OnsTopicListRequest req = new OnsTopicListRequest();
        req.setInstanceId(instanceId);
        try {
            OnsTopicListResponse resp = client.getAcsResponse(req);
            // 返回的 Data 是一个 JSON 字符串，需要自己解析
            JsonObject dataObj = JsonParser.parseString(resp.getData()).getAsJsonObject();
            JsonArray arr = dataObj.getAsJsonArray("PublishInfoDo");
            for (JsonElement el : arr) {
                String topic = el.getAsJsonObject().get("Topic").getAsString();
                try {
                    OnsTopicDeleteRequest delReq = new OnsTopicDeleteRequest();
                    delReq.setInstanceId(instanceId);
                    delReq.setTopic(topic);
                    client.getAcsResponse(delReq);
                    logger.info("Deleted topic: {}", topic);
                } catch (ClientException e) {
                    logger.error("Failed to delete topic {}: {} (ErrorCode={})",
                                 topic, e.getErrMsg(), e.getErrCode());
                }
            }
        } catch (ClientException e) {
            logger.error("Failed to list topics: {} (ErrorCode={})",
                         e.getErrMsg(), e.getErrCode());
        }
    }

    /** 列出并删除所有 Consumer Group */
    public void deleteAllConsumerGroups() {
        OnsConsumerListRequest req = new OnsConsumerListRequest();
        req.setInstanceId(instanceId);
        try {
            OnsConsumerListResponse resp = client.getAcsResponse(req);
            // Data 字段同样是 JSON 字符串，假设返回结构为 {"SubscriptionDataDo":[{"GroupId":"..."}]}
            JsonObject dataObj = JsonParser.parseString(resp.getData()).getAsJsonObject();
            JsonArray arr = dataObj.getAsJsonArray("SubscriptionDataDo");
            for (JsonElement el : arr) {
                String groupId = el.getAsJsonObject().get("GroupId").getAsString();
                try {
                    OnsConsumerDeleteRequest delReq = new OnsConsumerDeleteRequest();
                    delReq.setInstanceId(instanceId);
                    delReq.setGroupId(groupId);
                    client.getAcsResponse(delReq);
                    logger.info("Deleted consumer group: {}", groupId);
                } catch (ClientException e) {
                    logger.error("Failed to delete consumer group {}: {} (ErrorCode={})",
                                 groupId, e.getErrMsg(), e.getErrCode());
                }
            }
        } catch (ClientException e) {
            logger.error("Failed to list consumer groups: {} (ErrorCode={})",
                         e.getErrMsg(), e.getErrCode());
        }
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 5) {
            System.err.println("Usage: java -jar rocketmq-cleanup.jar <regionId> <accessKeyId> <accessKeySecret> <endpoint|\"\"> <instanceId>");
            System.exit(1);
        }
        String regionId       = args[0];
        String accessKeyId    = args[1];
        String accessKeySecret= args[2];
        String endpoint       = args[3].isEmpty() ? null : args[3]; // e.g. ons.cn-hangzhou-internal.aliyuncs.com
        String instanceId     = args[4];

        RocketMQCleanup cleaner = new RocketMQCleanup(regionId, accessKeyId, accessKeySecret, endpoint, instanceId);
        cleaner.deleteAllTopics();
        cleaner.deleteAllConsumerGroups();
    }
}

