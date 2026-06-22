import java.io.*;
import java.net.*;
import java.util.Scanner;

public class AdminServer {

    public static void main(String[] args) {
        try (ServerSocket serverSocket = new ServerSocket(5000)) {
            System.out.println("Admin Server started on port 5000. Waiting for client...");
            Socket clientSocket = serverSocket.accept();
            System.out.println("Client connected: " + clientSocket.getInetAddress());

            BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
            PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);

            Scanner sc = new Scanner(System.in);
            while (true) {
                System.out.println("\nMenu:");
                System.out.println("1. Antivirus Check");
                System.out.println("2. Windows Update");
                System.out.println("3. Port Scan");
                System.out.println("4. Run All");
                System.out.println("5. Exit");
                System.out.print("Choose option: ");
                int choice = sc.nextInt();
                sc.nextLine(); // consume newline

                String command = "";
                switch (choice) {
                    case 1:
                        command = "ANTIVIRUS";
                        break;
                    case 2:
                        command = "WINDOWS_UPDATE";
                        break;
                    case 3:
                        command = "PORT_SCAN";
                        break;
                    case 4:
                        command = "ALL";
                        break;
                    case 5:
                        out.println("EXIT");
                        System.out.println("Exiting...");
                        sc.close();
                        return;
                    default:
                        System.out.println("Invalid choice.");
                        continue;
                }

                out.println(command);
                System.out.println("Command sent: " + command);

                // Receive response
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    if (line.equals("END")) break;
                    response.append(line).append("\n");
                }

                System.out.println("Response from client:\n" + response.toString());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}