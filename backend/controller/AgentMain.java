import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class AgentMain {

    private static final String DEFAULT_HOST = System.getenv().getOrDefault("ADMIN_SERVER_HOST", "127.0.0.1");
    private static final int DEFAULT_PORT = Integer.parseInt(System.getenv().getOrDefault("ADMIN_SERVER_PORT", "5000"));
    private static final String AGENT_TOKEN = System.getenv().getOrDefault("AGENT_TOKEN", "");
    private static final long HEARTBEAT_INTERVAL_SECONDS = 30L;
    private static final long RECONNECT_DELAY_MILLIS = 5000L;

    public static void main(String[] args) {
        String host = args.length > 0 ? args[0] : DEFAULT_HOST;
        int port = args.length > 1 ? parsePort(args[1], DEFAULT_PORT) : DEFAULT_PORT;
        String agentId = args.length > 2 ? args[2] : defaultAgentId();

        AgentRuntime runtime = new AgentRuntime(host, port, agentId, AGENT_TOKEN);
        runtime.start();
    }

    private static int parsePort(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (Exception error) {
            return fallback;
        }
    }

    private static final String DATA_DIR = "C:\\ProgramData\\SecureComply";
    private static final String ID_FILE = "agent-id.json";

    private static String defaultAgentId() {
        Path dirPath = Paths.get(DATA_DIR);
        Path filePath = dirPath.resolve(ID_FILE);
        
        try {
            if (Files.exists(filePath)) {
                String content = Files.readString(filePath);
                Map<String, String> parsed = AgentProtocol.parse(content);
                String existingId = parsed.get("agentId");
                if (existingId != null && !existingId.trim().isEmpty()) {
                    return existingId;
                }
                System.err.println("[WARNING] agent-id.json exists but is corrupted or missing agentId. Regenerating...");
            }
        } catch (Exception e) {
            System.err.println("[WARNING] Failed to read agent-id.json: " + e.getMessage());
        }

        String newId = "SC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        try {
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }
            Map<String, String> payload = new LinkedHashMap<>();
            payload.put("agentId", newId);
            payload.put("createdAt", Instant.now().toString());
            payload.put("version", "1");
            
            Files.writeString(filePath, AgentProtocol.toJson(payload));
            return newId;
        } catch (Exception e) {
            System.err.println("[CRITICAL ERROR] Failed to save agent identity to " + filePath.toAbsolutePath());
            System.err.println("                 Reason: " + e.getMessage());
            System.err.println("                 Starting in DEGRADED MODE (in-memory ID).");
            System.err.println("                 This will cause duplicate dashboard clients upon restart unless permissions are fixed.");
            return newId;
        }
    }

    private static final class AgentRuntime {
        private final String host;
        private final int port;
        private final String agentId;
        private final String token;

        private AgentRuntime(String host, int port, String agentId, String token) {
            this.host = host;
            this.port = port;
            this.agentId = agentId;
            this.token = token;
        }

        private void start() {
            while (true) {
                try (Socket socket = new Socket(host, port)) {
                    socket.setTcpNoDelay(true);
                    socket.setKeepAlive(true);

                    BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                    PrintWriter writer = new PrintWriter(socket.getOutputStream(), true);
                    ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();

                    AgentState state = AgentCommandExecutor.buildAgentState(agentId);
                    sendHello(writer, state);
                    SecurityModule.logEvent("Agent connected to AdminServer: " + agentId);

                    heartbeatScheduler.scheduleAtFixedRate(() -> {
                        try {
                            state.hostname = AgentCommandExecutor.determineHostName();
                            state.ipAddress = AgentCommandExecutor.determineIpAddress();
                            state.osVersion = AgentCommandExecutor.determineOsVersion();
                            state.antivirusStatus = AgentCommandExecutor.determineAntivirusStatus();
                            state.lastSeen = System.currentTimeMillis();
                            sendHeartbeat(writer, state);
                        } catch (Exception error) {
                            SecurityModule.logEvent("Heartbeat failed for " + agentId + ": " + error.getMessage());
                            throw new RuntimeException(error);
                        }
                    }, HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_INTERVAL_SECONDS, TimeUnit.SECONDS);

                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.trim().isEmpty()) {
                            continue;
                        }

                        Map<String, String> message = AgentProtocol.parse(line);
                        String type = AgentProtocol.value(message, "type", "UNKNOWN");

                        if ("COMMAND_REQUEST".equalsIgnoreCase(type)) {
                            handleCommandRequest(message, writer, state);
                        } else if ("AUTH_REJECTED".equalsIgnoreCase(type)) {
                            throw new SecurityException(AgentProtocol.value(message, "message", "Agent authentication rejected."));
                        }
                    }

                    heartbeatScheduler.shutdownNow();
                } catch (Exception error) {
                    SecurityModule.logEvent("Agent disconnected: " + agentId + " | " + error.getMessage());
                    sleepQuietly(RECONNECT_DELAY_MILLIS);
                }
            }
        }

        private void sendHello(PrintWriter writer, AgentState state) {
            Map<String, String> message = baseTelemetry("HELLO", state);
            message.put("token", token);
            message.put("messageId", UUID.randomUUID().toString());
            message.put("protocolVersion", "2");
            // Also send legacy capabilities string for backward compatibility
            message.put("capabilities", AgentCommandExecutor.getEngine().getCapabilitiesString());
            send(writer, AgentProtocol.build("HELLO", message));

            // Mandatory Rule 7 & 11: Explicit CAPABILITIES Message
            sendCapabilities(writer, state);
        }

        private void sendCapabilities(PrintWriter writer, AgentState state) {
            Map<String, Object> message = new LinkedHashMap<>();
            message.put("type", "CAPABILITIES");
            message.put("messageId", UUID.randomUUID().toString());
            message.put("timestamp", System.currentTimeMillis());
            message.put("protocolVersion", "2");
            message.put("schemaVersion", 1);
            message.put("capabilityVersion", AgentCommandExecutor.getEngine().getCapabilityVersion());
            message.put("agentId", agentId);
            message.put("modules", AgentCommandExecutor.getEngine().getCapabilitiesMetadata());
            send(writer, AgentProtocol.toJsonObject(message));
        }

        private void sendHeartbeat(PrintWriter writer, AgentState state) {
            Map<String, String> message = baseTelemetry("HEARTBEAT", state);
            message.put("messageId", UUID.randomUUID().toString());
            message.put("protocolVersion", "2");
            message.put("status", "online");
            send(writer, AgentProtocol.build("HEARTBEAT", message));
        }

        private void handleCommandRequest(Map<String, String> message, PrintWriter writer, AgentState state) {
            String requestId = AgentProtocol.value(message, "requestId", UUID.randomUUID().toString());
            String command = AgentProtocol.value(message, "command", "UNKNOWN");
            String actionStr = AgentProtocol.value(message, "action", "CHECK");
            
            CommandAction action;
            try {
                action = CommandAction.valueOf(actionStr.toUpperCase());
            } catch (Exception e) {
                action = CommandAction.CHECK;
            }

            SecurityModule.logEvent("Command received: " + command + " | requestId=" + requestId);

            // 1. Transport Status: Accepted
            sendTransportStatus(writer, state, requestId, command, "Accepted");

            // 2. Transport Status: Running
            sendTransportStatus(writer, state, requestId, command, "Running");

            // 3. Business Execution
            if (AgentCommandExecutor.COMMAND_COMPLIANCE_AUDIT.equals(AgentCommandExecutor.normalizeCommand(command))) {
                // Handle legacy COMPLIANCE_AUDIT all modules execution
                for (ComplianceResult result : AgentCommandExecutor.getEngine().executeAll()) {
                    result.setContext(requestId, agentId);
                    sendComplianceResult(writer, result);
                }
            } else {
                ComplianceResult result = AgentCommandExecutor.execute(command, message, action);
                if (result != null) {
                    result.setContext(requestId, agentId);
                    sendComplianceResult(writer, result);
                } else {
                    // Send failed transport status if module not found
                    sendTransportStatus(writer, state, requestId, command, "Failed");
                    return;
                }
            }

            // 4. Transport Status: Completed
            sendTransportStatus(writer, state, requestId, command, "Completed");
            SecurityModule.logEvent("Command response sent: " + command + " | requestId=" + requestId);
        }

        private void sendComplianceResult(PrintWriter writer, ComplianceResult result) {
            Map<String, Object> payload = result.toMap();
            payload.put("type", "COMPLIANCE_RESULT");
            payload.put("messageId", UUID.randomUUID().toString());
            payload.put("protocolVersion", "2");
            send(writer, AgentProtocol.toJsonObject(payload));
        }

        private void sendTransportStatus(PrintWriter writer, AgentState state, String requestId, String command, String status) {
            Map<String, String> response = new LinkedHashMap<>();
            response.put("type", "COMMAND_RESPONSE");
            response.put("messageId", UUID.randomUUID().toString());
            response.put("timestamp", String.valueOf(System.currentTimeMillis()));
            response.put("protocolVersion", "2");
            
            response.put("requestId", requestId);
            response.put("agentId", agentId);
            response.put("hostname", state.hostname);
            response.put("command", command);
            response.put("status", status);
            
            send(writer, AgentProtocol.toJson(response));
        }

        private Map<String, String> baseTelemetry(String type, AgentState state) {
            Map<String, String> message = new LinkedHashMap<>();
            message.put("type", type);
            message.put("agentId", agentId);
            message.put("hostname", state.hostname);
            message.put("ipAddress", state.ipAddress);
            message.put("osVersion", state.osVersion);
            message.put("antivirusStatus", state.antivirusStatus);
            message.put("timestamp", String.valueOf(System.currentTimeMillis()));
            return message;
        }

        private void send(PrintWriter writer, String payload) {
            synchronized (writer) {
                writer.println(payload);
                writer.flush();
            }
        }

        private void sleepQuietly(long milliseconds) {
            try {
                Thread.sleep(milliseconds);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
            }
        }
    }
}