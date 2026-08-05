import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

public class AdminServer {

    private static final int DEFAULT_PORT = 5000;
    private static final String EXPECTED_TOKEN = System.getenv("AGENT_TOKEN");

    private final Map<String, AgentConnection> activeAgents = new ConcurrentHashMap<>();
    private final Map<String, CompletableFuture<Map<String, String>>> pendingResponses = new ConcurrentHashMap<>();
    private final Map<String, AgentConnection> backendConnections = new ConcurrentHashMap<>();

    public static void main(String[] args) {
        new AdminServer().start(DEFAULT_PORT);
    }

    public void start(int port) {
        try (ServerSocket serverSocket = new ServerSocket(port)) {
            System.out.println("Admin Server started on port " + port + ". Waiting for agents...");

            Thread acceptThread = new Thread(() -> acceptLoop(serverSocket), "agent-accept-loop");
            acceptThread.setDaemon(true);
            acceptThread.start();

            consoleLoop();
        } catch (Exception error) {
            error.printStackTrace();
        }
    }

    private void acceptLoop(ServerSocket serverSocket) {
        while (true) {
            try {
                Socket socket = serverSocket.accept();
                AgentConnection connection = new AgentConnection(socket);
                Thread handlerThread = new Thread(() -> handleConnection(connection), "agent-" + connection.remoteAddress);
                handlerThread.setDaemon(true);
                handlerThread.start();
            } catch (Exception error) {
                System.out.println("Agent accept loop stopped: " + error.getMessage());
                return;
            }
        }
    }

    private void handleConnection(AgentConnection connection) {
        try {
            String line;
            while ((line = connection.reader.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue;
                }

                Map<String, String> message = AgentProtocol.parse(line);
                String type = AgentProtocol.value(message, "type", "UNKNOWN");

                if ("BACKEND_HELLO".equalsIgnoreCase(type)) {
                    registerBackend(connection, message);
                    sendBackendReady(connection);
                    continue;
                }

                if ("COMMAND_REQUEST".equalsIgnoreCase(type) && connection.isBackend) {
                    handleBackendCommandRequest(connection, message);
                    continue;
                }

                if ("HELLO".equalsIgnoreCase(type)) {
                    registerAgent(connection, message);
                    sendAck(connection, "HELLO_ACK", message);
                    continue;
                }

                if ("HEARTBEAT".equalsIgnoreCase(type)) {
                    updateAgentHeartbeat(connection, message);
                    sendAck(connection, "HEARTBEAT_ACK", message);
                    continue;
                }

                if ("COMMAND_RESPONSE".equalsIgnoreCase(type) || "COMPLIANCE_REPORT".equalsIgnoreCase(type) || "COMPLIANCE_RESULT".equalsIgnoreCase(type) || "LOG_EVENT".equalsIgnoreCase(type) || "CAPABILITIES".equalsIgnoreCase(type)) {
                    handleAgentEvent(connection, message, line);
                    continue;
                }

                if ("BYE".equalsIgnoreCase(type)) {
                    break;
                }

                System.out.println("Unhandled message from " + connection.remoteAddress + ": " + line);
            }
        } catch (Exception error) {
            System.out.println("Connection ended for " + connection.remoteAddress + ": " + error.getMessage());
        } finally {
            unregisterAgent(connection);
            connection.close();
        }
    }

    private void registerBackend(AgentConnection connection, Map<String, String> message) {
        connection.isBackend = true;
        connection.state.agentId = AgentProtocol.value(message, "backendId", connection.remoteAddress);
        backendConnections.put(connection.state.agentId, connection);
        System.out.println("Backend bridge connected: " + connection.state.agentId);
    }

    private void sendBackendReady(AgentConnection connection) {
        Map<String, String> ready = new LinkedHashMap<>();
        ready.put("backendId", connection.state.agentId);
        ready.put("message", "AdminServer bridge ready");
        ready.put("timestamp", String.valueOf(System.currentTimeMillis()));
        connection.send(AgentProtocol.build("BACKEND_READY", ready));
    }

    private void handleBackendCommandRequest(AgentConnection backendConnection, Map<String, String> message) {
        String agentId = AgentProtocol.requireValue(message, "agentId");
        AgentConnection target = activeAgents.get(agentId);

        if (target == null) {
            Map<String, String> rejection = new LinkedHashMap<>();
            rejection.put("requestId", AgentProtocol.value(message, "requestId", ""));
            rejection.put("agentId", agentId);
            rejection.put("message", "Agent is offline or unknown.");
            backendConnection.send(AgentProtocol.build("COMMAND_REJECTED", rejection));
            return;
        }

        target.pendingBackendConnection = backendConnection;

        Map<String, String> forward = new LinkedHashMap<>();
        forward.put("requestId", AgentProtocol.value(message, "requestId", ""));
        forward.put("agentId", agentId);
        forward.put("command", AgentProtocol.value(message, "command", "UNKNOWN"));
        forward.put("requestedBy", AgentProtocol.value(message, "requestedBy", "system"));
        forward.put("source", AgentProtocol.value(message, "source", "node-backend"));
        forward.put("timestamp", AgentProtocol.value(message, "timestamp", String.valueOf(System.currentTimeMillis())));

        String payload = AgentProtocol.build("COMMAND_REQUEST", forward);
        target.send(payload);

        System.out.println("Forwarded command " + AgentProtocol.value(message, "command", "UNKNOWN") + " to agent " + agentId + " | requestId=" + AgentProtocol.value(message, "requestId", ""));
    }

    private void registerAgent(AgentConnection connection, Map<String, String> message) {
        String token = AgentProtocol.value(message, "token", "");
        if (EXPECTED_TOKEN != null && !EXPECTED_TOKEN.isEmpty() && !EXPECTED_TOKEN.equals(token)) {
            connection.send(AgentProtocol.build("AUTH_REJECTED", mapOf(
                    "message", "Invalid agent token."
            )));
            throw new SecurityException("Rejected agent from " + connection.remoteAddress);
        }

        String agentId = AgentProtocol.requireValue(message, "agentId");
        AgentState state = connection.state;
        state.agentId = agentId;
        state.hostname = AgentProtocol.value(message, "hostname", connection.remoteAddress);
        state.ipAddress = AgentProtocol.value(message, "ipAddress", connection.remoteAddress);
        state.osVersion = AgentProtocol.value(message, "osVersion", "unknown");
        state.antivirusStatus = AgentProtocol.value(message, "antivirusStatus", "unknown");
        state.lastSeen = System.currentTimeMillis();

        activeAgents.put(agentId, connection);

        System.out.println("Agent connected: " + agentId + " | " + state.hostname + " | " + connection.remoteAddress);
        notifyBackend("AGENT_CONNECTED", mapOf(
            "agentId", agentId,
            "hostname", state.hostname,
            "ipAddress", state.ipAddress,
            "osVersion", state.osVersion,
            "antivirusStatus", state.antivirusStatus,
            "lastHeartbeat", String.valueOf(state.lastSeen),
            "status", "online",
            "message", "Agent connected"
        ));
    }

    private void updateAgentHeartbeat(AgentConnection connection, Map<String, String> message) {
        String agentId = AgentProtocol.value(message, "agentId", connection.state.agentId);
        if (agentId != null && !agentId.isEmpty()) {
            connection.state.agentId = agentId;
            activeAgents.put(agentId, connection);
        }

        connection.state.hostname = AgentProtocol.value(message, "hostname", connection.state.hostname);
        connection.state.ipAddress = AgentProtocol.value(message, "ipAddress", connection.state.ipAddress);
        connection.state.osVersion = AgentProtocol.value(message, "osVersion", connection.state.osVersion);
        connection.state.antivirusStatus = AgentProtocol.value(message, "antivirusStatus", connection.state.antivirusStatus);
        connection.state.lastSeen = System.currentTimeMillis();

        System.out.println("Heartbeat from " + connection.state.agentId + " at " + connection.state.lastSeen);
        notifyBackend("HEARTBEAT", mapOf(
            "agentId", connection.state.agentId,
            "hostname", connection.state.hostname,
            "ipAddress", connection.state.ipAddress,
            "osVersion", connection.state.osVersion,
            "antivirusStatus", connection.state.antivirusStatus,
            "lastHeartbeat", String.valueOf(connection.state.lastSeen),
            "status", "online",
            "message", "Heartbeat received"
        ));
    }

    private void handleAgentEvent(AgentConnection connection, Map<String, String> message, String rawLine) {
        String type = AgentProtocol.value(message, "type", "UNKNOWN");
        String requestId = AgentProtocol.value(message, "requestId", "");

        if (connection.pendingBackendConnection != null && requestId != null && !requestId.isEmpty()) {
            connection.pendingBackendConnection.send(rawLine);
            connection.pendingBackendConnection = null;
        }

        if ("COMMAND_RESPONSE".equalsIgnoreCase(type) && requestId != null && !requestId.isEmpty()) {
            CompletableFuture<Map<String, String>> pending = pendingResponses.remove(requestId);
            if (pending != null) {
                pending.complete(message);
            }
        }

        if (connection.isBackend) {
            return;
        }

        forwardRawToBackend(rawLine);

        if ("LOG_EVENT".equalsIgnoreCase(type)) {
            System.out.println("Log event from " + connection.state.agentId + ": " + AgentProtocol.value(message, "message", ""));
            return;
        }

        if ("COMPLIANCE_REPORT".equalsIgnoreCase(type) || "COMPLIANCE_RESULT".equalsIgnoreCase(type)) {
            System.out.println("Compliance result from " + connection.state.agentId);
            return;
        }

        System.out.println("Command response from " + connection.state.agentId + ": " + AgentProtocol.value(message, "output", AgentProtocol.value(message, "message", "")));
    }

    private void unregisterAgent(AgentConnection connection) {
        if (connection.state.agentId != null) {
            activeAgents.remove(connection.state.agentId, connection);
            backendConnections.remove(connection.state.agentId, connection);
            connection.state.lastSeen = System.currentTimeMillis();
            System.out.println("Agent offline: " + connection.state.agentId);
            notifyBackend("AGENT_DISCONNECTED", mapOf(
                    "agentId", connection.state.agentId,
                    "hostname", connection.state.hostname,
                    "ipAddress", connection.state.ipAddress,
                    "osVersion", connection.state.osVersion,
                    "antivirusStatus", connection.state.antivirusStatus,
                    "message", "Agent disconnected",
                    "timestamp", String.valueOf(System.currentTimeMillis())
            ));
        }
    }

    private void sendAck(AgentConnection connection, String ackType, Map<String, String> message) {
        String requestId = AgentProtocol.value(message, "requestId", "");
        Map<String, String> ack = new LinkedHashMap<>();
        ack.put("requestId", requestId);
        ack.put("agentId", AgentProtocol.value(message, "agentId", connection.state.agentId));
        ack.put("timestamp", String.valueOf(System.currentTimeMillis()));
        ack.put("message", ackType);
        connection.send(AgentProtocol.build(ackType, ack));
    }

    private void notifyBackend(String type, Map<String, String> fields) {
        if (backendConnections.isEmpty()) {
            return;
        }

        for (AgentConnection backendConnection : backendConnections.values()) {
            backendConnection.send(AgentProtocol.build(type, fields));
        }
    }

    private void forwardRawToBackend(String rawLine) {
        if (backendConnections.isEmpty()) {
            return;
        }

        for (AgentConnection backendConnection : backendConnections.values()) {
            backendConnection.send(rawLine);
        }
    }

    private void consoleLoop() {
        Scanner scanner = new Scanner(System.in);

        while (true) {
            System.out.println("\nMenu:");
            System.out.println("1. List agents");
            System.out.println("2. Send command to agent");
            System.out.println("3. Exit");
            System.out.print("Choose option: ");

            String input = scanner.nextLine().trim();

            if ("1".equals(input)) {
                printAgents();
                continue;
            }

            if ("2".equals(input)) {
                sendCommandFlow(scanner);
                continue;
            }

            if ("3".equals(input)) {
                System.out.println("Exiting...");
                scanner.close();
                return;
            }

            System.out.println("Invalid choice.");
        }
    }

    private void printAgents() {
        List<AgentConnection> agents = new ArrayList<>(activeAgents.values());
        if (agents.isEmpty()) {
            System.out.println("No connected agents.");
            return;
        }

        System.out.println("\nConnected agents:");
        for (AgentConnection connection : agents) {
            AgentState state = connection.state;
            System.out.println("- " + state.agentId + " | " + state.hostname + " | " + state.ipAddress + " | " + state.osVersion + " | antivirus=" + state.antivirusStatus + " | lastSeen=" + state.lastSeen);
        }
    }

    private void sendCommandFlow(Scanner scanner) {
        System.out.print("Agent ID: ");
        String agentId = scanner.nextLine().trim();
        AgentConnection connection = activeAgents.get(agentId);

        if (connection == null) {
            System.out.println("Agent not found or offline.");
            return;
        }

        System.out.println("Command types:");
        System.out.println("1. ANTIVIRUS");
        System.out.println("2. WINDOWS_UPDATE");
        System.out.println("3. PORT_SCAN");
        System.out.println("4. COMPLIANCE_AUDIT");
        System.out.println("5. CUSTOM_COMMAND");
        System.out.print("Choose command: ");

        String commandChoice = scanner.nextLine().trim();
        String command;

        if ("1".equals(commandChoice)) {
            command = ModuleIds.ANTIVIRUS;
        } else if ("2".equals(commandChoice)) {
            command = ModuleIds.WINDOWS_UPDATE;
        } else if ("3".equals(commandChoice)) {
            command = ModuleIds.PORT_SCAN;
        } else if ("4".equals(commandChoice)) {
            command = AgentCommandExecutor.COMMAND_COMPLIANCE_AUDIT;
        } else if ("5".equals(commandChoice)) {
            command = AgentCommandExecutor.COMMAND_CUSTOM;
        } else {
            System.out.println("Invalid command choice.");
            return;
        }

        try {
            Map<String, String> response = sendCommandToAgent(connection, command, 60);
            System.out.println("Response from agent:");
            System.out.println(AgentProtocol.value(response, "output", AgentProtocol.value(response, "message", "No response payload.")));
        } catch (Exception error) {
            System.out.println("Failed to receive command response: " + error.getMessage());
        }
    }

    private Map<String, String> sendCommandToAgent(AgentConnection connection, String command, long timeoutSeconds) throws Exception {
        String requestId = UUID.randomUUID().toString();
        CompletableFuture<Map<String, String>> pending = new CompletableFuture<>();
        pendingResponses.put(requestId, pending);

        try {
            Map<String, String> payload = new LinkedHashMap<>();
            payload.put("requestId", requestId);
            payload.put("agentId", connection.state.agentId);
            payload.put("command", command);
            payload.put("timestamp", String.valueOf(System.currentTimeMillis()));

            connection.send(AgentProtocol.build("COMMAND_REQUEST", payload));
            return pending.get(timeoutSeconds, TimeUnit.SECONDS);
        } catch (Exception error) {
            pendingResponses.remove(requestId);
            throw error;
        }
    }

    private static Map<String, String> mapOf(String... entries) {
        Map<String, String> map = new LinkedHashMap<>();

        for (int i = 0; i + 1 < entries.length; i += 2) {
            map.put(entries[i], entries[i + 1]);
        }

        return map;
    }

    private final class AgentConnection {
        private final Socket socket;
        private final BufferedReader reader;
        private final PrintWriter writer;
        private final String remoteAddress;
        private final AgentState state = new AgentState();
        private boolean isBackend = false;
        private AgentConnection pendingBackendConnection = null;

        private AgentConnection(Socket socket) throws Exception {
            this.socket = socket;
            this.socket.setTcpNoDelay(true);
            this.socket.setKeepAlive(true);
            this.reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            this.writer = new PrintWriter(socket.getOutputStream(), true);
            this.remoteAddress = String.valueOf(socket.getRemoteSocketAddress());
        }

        private void send(String message) {
            synchronized (writer) {
                writer.println(message);
                writer.flush();
            }
        }

        private void close() {
            try {
                socket.close();
            } catch (Exception ignored) {
            }
        }
    }
}