import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Collections;
import java.util.Map;

public class PasswordPolicyModule implements ComplianceModule, RemediationModule {
    @Override
    public String getName() {
        return ModuleIds.PASSWORD_POLICY;
    }

    @Override
    public ModuleMetadata getMetadata() {
        return new ModuleMetadata(
            ModuleIds.PASSWORD_POLICY,
            "Password Length Policy",
            "1.0.0",
            "2.0.0",
            ModuleCategory.IDENTITY,
            Severity.HIGH,
            2000L,
            Collections.singletonList("Administrator"),
            true,
            true,
            false,
            false
        );
    }

    @Override
    public ComplianceResult execute(AgentSnapshot snapshot) {
        String report = "Unknown";
        boolean compliant = false;
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "-Command",
                "net accounts | Select-String 'Minimum password length'"
            );
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            String output = null;
            while ((line = reader.readLine()) != null) {
                if (line.contains("Minimum password length")) {
                    output = line;
                    break;
                }
            }
            process.waitFor();
            
            if (output != null && output.contains(":")) {
                String val = output.split(":")[1].trim();
                int length = Integer.parseInt(val);
                compliant = length >= 14;
                report = "Minimum password length is " + length + " (Target: >= 14)";
            } else {
                report = "Could not parse net accounts output";
            }
        } catch(Exception e) {
            report = "Error: " + e.getMessage();
        }
        
        ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, true);
        ComplianceStatus status = compliant ? ComplianceStatus.PASS : ComplianceStatus.FAIL;
        
        return new ComplianceResult(ModuleIds.PASSWORD_POLICY, status, report, runtimeState);
    }

    @Override
    public ComplianceResult remediate(AgentSnapshot snapshot, Map<String, Object> payload) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "Start-Process",
                "powershell",
                "-Verb", "RunAs",
                "-Wait",
                "-ArgumentList",
                "'-Command \"net accounts /minpwlen:14\"'"
            );
            Process process = pb.start();
            process.waitFor();
            
            ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, false);
            return new ComplianceResult(ModuleIds.PASSWORD_POLICY, ComplianceStatus.PASS, "Remediation command executed.", runtimeState);
        } catch(Exception e) {
            String report = "Remediation Error: " + e.getMessage();
            ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, false);
            return new ComplianceResult(ModuleIds.PASSWORD_POLICY, ComplianceStatus.FAIL, report, runtimeState);
        }
    }
}
