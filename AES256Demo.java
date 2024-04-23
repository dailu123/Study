import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class AES256Demo {


    import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class SecretKeyExample {

    public static void main(String[] args) {
        String secretKeyString = "your-secret-key"; // String representation of the key

        // Decode the string key into a byte array
        byte[] decodedKey = Base64.getDecoder().decode(secretKeyString);

        // Create a SecretKeySpec object
        SecretKey secretKey = new SecretKeySpec(decodedKey, 0, decodedKey.length, "AES");

        // Use the SecretKey object
        // For example, pass the SecretKey object to encryption or decryption methods
        // encrypt(secretKey, plainText);
        // decrypt(secretKey, encryptedText);
    }
}

    
    private static final String AES_ALGORITHM = "AES";
    private static final String SECRET_KEY = "your-secret-key"; // 密钥长度必须是 256 位

    public static void main(String[] args) throws Exception {
        String originalText = "Hello, world!";
        System.out.println("Original Text: " + originalText);

        // 加密
        String encryptedText = encrypt(originalText);
        System.out.println("Encrypted Text: " + encryptedText);

        // 解密
        String decryptedText = decrypt(encryptedText);
        System.out.println("Decrypted Text: " + decryptedText);
    }

    // 加密
    public static String encrypt(String plainText) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        SecretKeySpec secretKey = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), AES_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    // 解密
    public static String decrypt(String encryptedText) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        SecretKeySpec secretKey = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), AES_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, secretKey);
        byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
}
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class AES256Demo {

    private static final String AES_ALGORITHM = "AES";
    private static final String SECRET_KEY_ALGORITHM = "AES";
    private static final String SECRET_KEY = "your-secret-key"; // 长度必须是 256 位

    public static void main(String[] args) throws Exception {
        String originalText = "Hello, world!";
        System.out.println("Original Text: " + originalText);

        // 生成密钥
        SecretKey secretKey = generateSecretKey();
        System.out.println("Generated Secret Key: " + Base64.getEncoder().encodeToString(secretKey.getEncoded()));

        // 加密
        String encryptedText = encrypt(originalText, secretKey);
        System.out.println("Encrypted Text: " + encryptedText);

        // 解密
        String decryptedText = decrypt(encryptedText, secretKey);
        System.out.println("Decrypted Text: " + decryptedText);
    }

    // 生成密钥
    public static SecretKey generateSecretKey() throws NoSuchAlgorithmException {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(SECRET_KEY_ALGORITHM);
        keyGenerator.init(256);
        return keyGenerator.generateKey();
    }

    // 加密
    public static String encrypt(String plainText, SecretKey secretKey) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    // 解密
    public static String decrypt(String encryptedText, SecretKey secretKey) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, secretKey);
        byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
}
