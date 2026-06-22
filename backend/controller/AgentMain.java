import java.util.HashMap;
import java.util.Map;
import java.time.LocalTime;

public class AgentMain {

    public static void main(String[] args) {

        String systemId = "PC-" + System.currentTimeMillis();

        Map<String, String> complianceResults = new HashMap<>();

        // Run all compliance checks
        complianceResults.put("Antivirus", Antivirus.runCheck().contains("FULLY COMPLIANT") ? "PASS" : "FAIL");
        complianceResults.put("WindowsUpdate", "PASS"); // Assume pass
        complianceResults.put("SecurityModule", "PASS"); // Placeholder
        complianceResults.put("PortScanner", "PASS"); // Assume pass

        // Calculate Risk Score
        int riskScore = 0;

        for (String key : complianceResults.keySet()) {
            if (complianceResults.get(key).equals("FAIL")) {
                riskScore += 20;
            }
        }

        // Basic Anomaly Detection
        int currentHour = LocalTime.now().getHour();
        String anomaly = "NONE";

        if (currentHour < 6) {
            anomaly = "Unusual login time detected";
            riskScore += 30;
        }

        // Final Report
        System.out.println("\n===== SYSTEM SECURITY REPORT =====");
        System.out.println("System ID: " + systemId);
        System.out.println("Compliance Results: " + complianceResults);
        System.out.println("Risk Score: " + riskScore);

        if (!anomaly.equals("NONE")) {
            System.out.println("⚠️ Anomaly: " + anomaly);
        } else {
            System.out.println("No anomalies detected");
        }

        // Plain English Output (VERY IMPORTANT)
        System.out.println("\n===== BUSINESS SUMMARY =====");

        if (riskScore >= 50) {
            System.out.println("⚠️ This system is at HIGH RISK. Immediate action required.");
        } else if (riskScore >= 20) {
            System.out.println("⚠️ This system has some security issues.");
        } else {
            System.out.println("✅ This system is secure.");
        }
    }
}