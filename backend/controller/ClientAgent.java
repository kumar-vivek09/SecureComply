import java.io.*;
import java.net.*;

public class ClientAgent {

    public static void main(String[] args) {
        try (Socket socket = new Socket("localhost", 5000)) {
            System.out.println("Connected to server.");
            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            PrintWriter out = new PrintWriter(socket.getOutputStream(), true);

            String command;
            while ((command = in.readLine()) != null) {
                if (command.equals("EXIT")) break;

                SecurityModule.logEvent("Command received: " + command);

                String result = "";
                if (command.equals("ANTIVIRUS")) {
                    result = Antivirus.runCheck();
                } else if (command.equals("WINDOWS_UPDATE")) {
                    result = WindowsUpdate.runCheck();
                } else if (command.equals("PORT_SCAN")) {
                    result = PortScanner.runScan();
                } else if (command.equals("ALL")) {
                    result = Antivirus.runCheck() + "\n" + WindowsUpdate.runCheck() + "\n" + PortScanner.runScan();
                } else {
                    result = "Unknown command";
                }

                SecurityModule.logEvent("Result sent for " + command);

                out.println(result);
                out.println("END");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}