public class TestProtocol {
    public static void main(String[] args) {
        String json = "{\"type\":\"COMMAND_REQUEST\",\"requestId\":\"123\",\"agentId\":\"agent-1\",\"command\":\"ANTIVIRUS\",\"payload\":{\"source\":\"node-backend\"},\"timestamp\":\"2026\"}";
        System.out.println("Input JSON: " + json);
        java.util.Map<String, String> parsed = AgentProtocol.parse(json);
        System.out.println("Parsed Map: " + parsed);
    }
}
