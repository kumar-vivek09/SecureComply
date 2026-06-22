import java.net.*;
import java.io.*;
import javax.net.ssl.*;

public class PortScanner {

    private static final int TIMEOUT = 500;
    private static final int READ_TIMEOUT = 800;

    public static void main(String[] args) {
        System.out.print(runScan());
    }

    public static String runScan() {
        StringBuilder output = new StringBuilder();
        String host = "localhost";
        for (int port = 1; port <= 1000; port++) {
            scanPort(host, port, output);
        }
        output.append("\nScanning Completed.\n");
        return output.toString();
    }

    private static void scanPort(String host, int port, StringBuilder output) {

        try (Socket socket = new Socket()) {

            socket.connect(new InetSocketAddress(host, port), TIMEOUT);
            socket.setSoTimeout(READ_TIMEOUT);

            String service = detectService(host, port, socket);

            output.append("Port ").append(port).append(" is OPEN | Service: ").append(service).append("\n");

        } catch (Exception ignored) {
        }
    }

    private static String detectService(String host, int port, Socket socket) {

        // 🔹 SMB Detection (Port 445)
        if (port == 445) {
            return detectSMB(socket);
        }

        // 🔹 Try TLS Detection
        String tlsResult = detectTLS(host, port);
        if (tlsResult != null)
            return tlsResult;

        // 🔹 Try Text-Based Detection
        try {

            InputStream in = socket.getInputStream();
            OutputStream out = socket.getOutputStream();

            out.write("GET / HTTP/1.1\r\nHost: test\r\n\r\n".getBytes());
            out.flush();

            byte[] buffer = new byte[2048];
            int bytesRead = in.read(buffer);

            if (bytesRead > 0) {

                String response = new String(buffer, 0, bytesRead);

                if (response.contains("HTTP"))
                    return "HTTP Server (" + extractVersion(response) + ")";

                if (response.contains("SSH"))
                    return "SSH Server (" + extractVersion(response) + ")";

                if (response.contains("FTP"))
                    return "FTP Server (" + extractVersion(response) + ")";

                if (response.contains("SMTP"))
                    return "SMTP Server (" + extractVersion(response) + ")";

                return "Unknown Text Service";
            }

        } catch (Exception ignored) {
        }

        return "Unknown (No Detectable Banner)";
    }

    // 🔥 SMB Basic Detection
    private static String detectSMB(Socket socket) {
        try {
            OutputStream out = socket.getOutputStream();
            InputStream in = socket.getInputStream();

            byte[] smbNegotiate = {
                    (byte)0x00,0x00,0x00,(byte)0x85,
                    (byte)0xFF,(byte)0x53,(byte)0x4D,(byte)0x42,
                    0x72,0x00,0x00,0x00,0x00,0x18,0x53,(byte)0xC8
            };

            out.write(smbNegotiate);
            out.flush();

            byte[] response = new byte[1024];
            int read = in.read(response);

            if (read > 0 && response[4] == (byte)0xFF)
                return "SMB Service Detected";

        } catch (Exception ignored) {}

        return "SMB (No Version Info)";
    }

    // 🔥 TLS Detection
    private static String detectTLS(String host, int port) {

        try {

            SSLSocketFactory factory =
                    (SSLSocketFactory) SSLSocketFactory.getDefault();

            SSLSocket sslSocket =
                    (SSLSocket) factory.createSocket(host, port);

            sslSocket.setSoTimeout(READ_TIMEOUT);
            sslSocket.startHandshake();

            SSLSession session = sslSocket.getSession();

            String protocol = session.getProtocol();
            String cipher = session.getCipherSuite();

            return "TLS Enabled (" + protocol + ", " + cipher + ")";

        } catch (Exception ignored) {
        }

        return null;
    }

    private static String extractVersion(String response) {
        String[] lines = response.split("\n");
        if (lines.length > 0)
            return lines[0].trim();
        return "Version Unknown";
    }
}
