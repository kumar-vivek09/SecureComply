import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.Scanner;

public class SecurityModule {

    static String logFile = "compliance_log.txt";

    // 🔐 Admin password (only admin knows this)
    static final String ADMIN_PASSWORD = "admin@123";

    public static void main(String[] args) {

        try {

            Scanner sc = new Scanner(System.in);

            System.out.println("1. Encrypt Log (User)");
            System.out.println("2. Decrypt Log (Admin Only)");
            System.out.print("Choose option: ");

            int choice = sc.nextInt();
            sc.nextLine();

            if (choice == 1) {

                System.out.print("Set encryption password: ");
                String password = sc.nextLine();

                logEvent("Compliance scan started");
                logEvent("Chrome detected version 123.0.1");
                logEvent("Firewall Enabled");
                logEvent("Antivirus Enabled");
                logEvent("Compliance Score: 85");

                System.out.println("\nLogs written.");

                encryptFile(password);

                System.out.println("🔐 File encrypted successfully!");
                System.out.println("Logs are secured. Only admin can access.");

            } else if (choice == 2) {

                // 🔐 Admin authentication
                System.out.print("Enter ADMIN password: ");
                String adminPass = sc.nextLine();

                if (!adminPass.equals(ADMIN_PASSWORD)) {
                    System.out.println("❌ Access Denied! Not an admin.");
                    sc.close();
                    return;
                }

                // If admin verified
                System.out.print("Enter decryption password: ");
                String password = sc.nextLine();

                decryptFile(password);
            }

            sc.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // --------------------------------------------------
    // LOGGING
    // --------------------------------------------------
    public static void logEvent(String message) {

        try {

            FileWriter fw = new FileWriter(logFile, true);
            BufferedWriter bw = new BufferedWriter(fw);

            String timestamp =
                    new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());

            bw.write(timestamp + " - " + message);
            bw.newLine();

            bw.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // --------------------------------------------------
    // PASSWORD → AES KEY
    // --------------------------------------------------
    public static SecretKey getKeyFromPassword(String password) throws Exception {

        MessageDigest sha = MessageDigest.getInstance("SHA-256");

        byte[] key = sha.digest(password.getBytes("UTF-8"));

        key = Arrays.copyOf(key, 16); // 128-bit AES key

        return new SecretKeySpec(key, "AES");
    }

    // --------------------------------------------------
    // ENCRYPT
    // --------------------------------------------------
    public static void encryptFile(String password) throws Exception {

        byte[] data = Files.readAllBytes(Paths.get(logFile));

        SecretKey key = getKeyFromPassword(password);

        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, key);

        byte[] encrypted = cipher.doFinal(data);

        FileOutputStream fos = new FileOutputStream(logFile);
        fos.write(encrypted);
        fos.close();
    }

    // --------------------------------------------------
    // DECRYPT (ADMIN ONLY)
    // --------------------------------------------------
    public static void decryptFile(String password) {

        try {

            byte[] encrypted = Files.readAllBytes(Paths.get(logFile));

            SecretKey key = getKeyFromPassword(password);

            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.DECRYPT_MODE, key);

            byte[] decrypted = cipher.doFinal(encrypted);

            System.out.println("\n===== DECRYPTED LOG =====\n");
            System.out.println(new String(decrypted));

        } catch (Exception e) {
            System.out.println("❌ Wrong password or corrupted file!");
        }
    }
}