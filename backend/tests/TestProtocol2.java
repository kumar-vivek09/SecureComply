public class TestProtocol2 {
    public static void main(String[] args) {
        String json = "{\"hostname\":\"VIVEK-PC-01\",\"ipAddress\":\"10.0.0.1\",\"osVersion\":\"Windows 11\"}";
        java.util.Map<String, String> parsed = AgentProtocol.parse(json);
        System.out.println("Parsed: " + parsed);
    }
}
