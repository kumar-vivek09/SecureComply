import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class LocalAdminsModule implements ComplianceModule, RemediationModule {
    @Override
    public String getName() {
        return ModuleIds.LOCAL_ADMINS;
    }

    @Override
    public ModuleMetadata getMetadata() {
        return new ModuleMetadata(
            ModuleIds.LOCAL_ADMINS,
            "Local Administrators",
            "1.0.0",
            "2.0.0",
            ModuleCategory.IDENTITY,
            Severity.HIGH,
            3000L,
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
        List<String> admins = new ArrayList<>();
        boolean compliant = false;
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "-Command",
                "(Get-LocalGroupMember -Group 'Administrators').Name"
            );
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    admins.add(line.trim());
                }
            }
            process.waitFor();
            
            // For hackathon: Pass if only the built-in Administrator or domain admins exist. 
            // In reality, this requires policy matching. We'll just return PARTIAL or PASS based on count.
            compliant = admins.size() <= 2;
            report = "Found " + admins.size() + " local administrators.";
        } catch(Exception e) {
            report = "Error: " + e.getMessage();
        }
        
        ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, true);
        ComplianceStatus status = compliant ? ComplianceStatus.PASS : ComplianceStatus.PARTIAL;
        
        ComplianceResult result = new ComplianceResult(ModuleIds.LOCAL_ADMINS, status, report, runtimeState);
        result.addDetail("accounts", admins);
        return result;
    }

    @Override
    public ComplianceResult remediate(AgentSnapshot snapshot, Map<String, Object> payload) {
        String accountToRemove = (String) payload.get("accountToRemove");
        if (accountToRemove == null || accountToRemove.isEmpty()) {
            ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, true);
            return new ComplianceResult(ModuleIds.LOCAL_ADMINS, ComplianceStatus.FAIL, "No accountToRemove specified in payload", runtimeState);
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "Start-Process",
                "powershell",
                "-Verb", "RunAs",
                "-Wait",
                "-ArgumentList",
                "'-Command \"Remove-LocalGroupMember -Group ''Administrators'' -Member ''" + accountToRemove + "''\"'"
            );
            Process process = pb.start();
            process.waitFor();
            
            ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, false);
            return new ComplianceResult(ModuleIds.LOCAL_ADMINS, ComplianceStatus.PASS, "Remediation command executed.", runtimeState);
        } catch(Exception e) {
            String report = "Remediation Error: " + e.getMessage();
            ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, false);
            return new ComplianceResult(ModuleIds.LOCAL_ADMINS, ComplianceStatus.FAIL, report, runtimeState);
        }
    }
}
