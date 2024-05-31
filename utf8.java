import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.ByteBuffer;

public class Utf8Validator {
    public static String validateAndCleanString(String input) {
        if (input == null) {
            return null;
        }

        CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder();
        try {
            // 尝试将字符串解码为UTF-8，如果成功，则返回原字符串
            decoder.decode(ByteBuffer.wrap(input.getBytes(StandardCharsets.UTF_8)));
            return input;
        } catch (CharacterCodingException e) {
            // 如果解码失败，则清理字符串
            return new String(input.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
        }
    }

    public static void main(String[] args) {
        String testString = "你的测试字符串";
        String cleanedString = validateAndCleanString(testString);
        System.out.println(cleanedString);
    }
}
