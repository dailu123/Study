import com.aliyuncs.DefaultAcsClient;
import com.aliyuncs.IAcsClient;
import com.aliyuncs.exceptions.ClientException;
import com.aliyuncs.profile.DefaultProfile;
import com.aliyuncs.profile.IClientProfile;
import com.aliyuncs.ons.model.v20190214.*;

public class RocketMQCleaner {

    // 替换成你自己的信息
    private static final String REGION_ID = "cn-hangzhou";
    private static final String ACCESS_KEY_ID = "your-access-key-id";
    private static final String ACCESS_KEY_SECRET = "your-access-key-secret";
    private static final String INSTANCE_ID = "MQ_INST_xxx";

    private static IAcsClient client;

    public static void main(String[] args) throws ClientException {
        initClient();

        // 删除所有 topic
        deleteAllTopics();

        // 删除所有 group
        deleteAllGroups();

        System.out.println("全部 Topic 和 Group 删除完成。");
    }

    private static void initClient() {
        IClientProfile profile = DefaultProfile.getProfile(REGION_ID, ACCESS_KEY_ID, ACCESS_KEY_SECRET);
        client = new DefaultAcsClient(profile);
    }

    private static void deleteAllTopics() throws ClientException {
        ListTopicRequest request = new ListTopicRequest();
        request.setInstanceId(INSTANCE_ID);
        request.setRegionId(REGION_ID);

        ListTopicResponse response = client.getAcsResponse(request);

        for (ListTopicResponse.Topic topic : response.getData()) {
            String topicName = topic.getTopic();
            System.out.println("准备删除 Topic: " + topicName);

            DeleteTopicRequest deleteRequest = new DeleteTopicRequest();
            deleteRequest.setInstanceId(INSTANCE_ID);
            deleteRequest.setTopic(topicName);
            deleteRequest.setRegionId(REGION_ID);

            try {
                client.getAcsResponse(deleteRequest);
                System.out.println("已删除 Topic: " + topicName);
            } catch (ClientException e) {
                System.err.println("删除 Topic 失败: " + topicName + ", 错误: " + e.getErrMsg());
            }
        }
    }

    private static void deleteAllGroups() throws ClientException {
        ListGroupIdRequest request = new ListGroupIdRequest();
        request.setInstanceId(INSTANCE_ID);
        request.setRegionId(REGION_ID);

        ListGroupIdResponse response = client.getAcsResponse(request);

        for (ListGroupIdResponse.GroupId group : response.getData()) {
            String groupId = group.getGroupId();
            System.out.println("准备删除 Group: " + groupId);

            DeleteGroupIdRequest deleteRequest = new DeleteGroupIdRequest();
            deleteRequest.setInstanceId(INSTANCE_ID);
            deleteRequest.setGroupId(groupId);
            deleteRequest.setRegionId(REGION_ID);

            try {
                client.getAcsResponse(deleteRequest);
                System.out.println("已删除 Group: " + groupId);
            } catch (ClientException e) {
                System.err.println("删除 Group 失败: " + groupId + ", 错误: " + e.getErrMsg());
            }
        }
    }
}
