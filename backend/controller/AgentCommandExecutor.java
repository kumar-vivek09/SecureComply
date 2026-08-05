import java.net.InetAddress;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class AgentCommandExecutor {

    public static final String COMMAND_COMPLIANCE_AUDIT = "COMPLIANCE_AUDIT";
    public static final String COMMAND_CUSTOM = "CUSTOM_COMMAND";

    // Compliance Engine singleton (Mandatory Rule 13)
    private static final ComplianceEngine engine = new ComplianceEngine();

    static {
        // Engine owns all module initialization and capability metadata caching
        engine.initialize();
    }

    private AgentCommandExecutor() {
    }

    public static ComplianceEngine getEngine() {
        return engine;
    }

    public static ComplianceResult execute(String command, Map<String, String> rawMessage, CommandAction action) {
        String normalizedCommand = normalizeCommand(command);

        // Map legacy aliases directly to ModuleIds
        if (normalizedCommand.equals("ANTIVIRUS")) normalizedCommand = ModuleIds.ANTIVIRUS;
        if (normalizedCommand.equals("WINDOWS_UPDATE")) normalizedCommand = ModuleIds.WINDOWS_UPDATE;
        if (normalizedCommand.equals("PORT_SCAN")) normalizedCommand = ModuleIds.PORT_SCAN;

        if (engine.supports(normalizedCommand)) {
            // Forward arbitrary payload fields into the generic map for RemediationModule
            Map<String, Object> payload = new LinkedHashMap<>(rawMessage);
            return engine.executeComplianceWorkflow(normalizedCommand, payload);
        }

        return null; // unsupported module, handled by AgentMain Transport
    }

    public static String normalizeCommand(String command) {
        if (command == null) {
            return null;
        }

        String normalized = command.trim().toUpperCase().replace('-', '_').replace(' ', '_');

        if ("ALL".equals(normalized) || "ALL_CHECKS".equals(normalized)) {
            return COMMAND_COMPLIANCE_AUDIT;
        }

        if ("WINDOWSUPDATE".equals(normalized)) {
            return ModuleIds.WINDOWS_UPDATE;
        }

        if ("PORTSCAN".equals(normalized)) {
            return ModuleIds.PORT_SCAN;
        }

        return normalized;
    }

    public static String determineAntivirusStatus() {
        try {
            return Antivirus.runCheck().contains("FULLY COMPLIANT") ? "compliant" : "non-compliant";
        } catch (Exception error) {
            return "unknown";
        }
    }

    public static String determineHostName() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception error) {
            return "unknown";
        }
    }

    public static String determineIpAddress() {
        try {
            return InetAddress.getLocalHost().getHostAddress();
        } catch (Exception error) {
            return "unknown";
        }
    }

    public static String determineOsVersion() {
        return System.getProperty("os.name") + " " + System.getProperty("os.version");
    }

    public static AgentState buildAgentState(String agentId) {
        AgentState state = new AgentState();
        state.agentId = agentId;
        state.hostname = determineHostName();
        state.ipAddress = determineIpAddress();
        state.osVersion = determineOsVersion();
        state.antivirusStatus = determineAntivirusStatus();
        state.lastSeen = System.currentTimeMillis();
        return state;
    }
}

class AgentState {
    String agentId;
    String hostname;
    String ipAddress;
    String osVersion;
    String antivirusStatus;
    long lastSeen;
}