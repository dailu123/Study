import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

public class AESGCMExample {

    private static final String ENCRYPTION_ALGORITHM = "AES/GCM/NoPadding";
    private static final int AES_KEY_SIZE = 256;
    private static final int GCM_IV_LENGTH = 12; // 96 bits
    private static final int GCM_TAG_LENGTH = 16; // 128 bits

    public static void main(String[] args) throws Exception {
        // Generate a random AES key
        KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
        keyGenerator.init(AES_KEY_SIZE);
        SecretKey secretKey = keyGenerator.generateKey();

        // Generate a random IV
        byte[] iv = new byte[GCM_IV_LENGTH];
        SecureRandom secureRandom = new SecureRandom();
        secureRandom.nextBytes(iv);

        // Sample plaintext
        String plaintext = "This is a secret message";

        // Encrypt the plaintext
        String ciphertext = encrypt(plaintext, secretKey, iv);
        System.out.println("Ciphertext: " + ciphertext);

        // Decrypt the ciphertext
        String decryptedText = decrypt(ciphertext, secretKey, iv);
        System.out.println("Decrypted Text: " + decryptedText);
    }

    public static String encrypt(String plaintext, SecretKey key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(ENCRYPTION_ALGORITHM);
        GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, gcmParameterSpec);

        byte[] ciphertext = cipher.doFinal(plaintext.getBytes());

        // Encode IV and ciphertext to Base64 to get a readable format
        return Base64.getEncoder().encodeToString(iv) + ":" + Base64.getEncoder().encodeToString(ciphertext);
    }

    public static String decrypt(String ciphertext, SecretKey key, byte[] iv) throws Exception {
        // Split the IV and ciphertext
        String[] parts = ciphertext.split(":");
        byte[] ivDecoded = Base64.getDecoder().decode(parts[0]);
        byte[] ciphertextDecoded = Base64.getDecoder().decode(parts[1]);

        Cipher cipher = Cipher.getInstance(ENCRYPTION_ALGORITHM);
        GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, ivDecoded);
        cipher.init(Cipher.DECRYPT_MODE, key, gcmParameterSpec);

        byte[] decryptedText = cipher.doFinal(ciphertextDecoded);

        return new String(decryptedText);
    }
}
