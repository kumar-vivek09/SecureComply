import java.util.Collections;
import java.util.Map;

public class AntivirusModule implements ComplianceModule, RemediationModule {
    @Override
    public String getName() {
        return ModuleIds.ANTIVIRUS;
    }

    @Override
    public ModuleMetadata getMetadata() {
        return new ModuleMetadata(
            ModuleIds.ANTIVIRUS,
            "Antivirus Status",
            "1.0.0",
            "1.0.0",
            ModuleCategory.SECURITY,
            Severity.HIGH,
            3000L,
            Collections.emptyList(),
            true,
            false,
            false,
            false
        );
    }

    @Override
    public ComplianceResult execute(AgentSnapshot snapshot) {
        String report = "Unknown";
        boolean compliant = false;
        try {
            report = Antivirus.runCheck();
            compliant = report.contains("FULLY COMPLIANT");
        } catch(Exception e) {
            report = "Error: " + e.getMessage();
        }
        
        ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, true);
        ComplianceStatus status = compliant ? ComplianceStatus.PASS : ComplianceStatus.FAIL;
        
        ComplianceResult result = new ComplianceResult(ModuleIds.ANTIVIRUS, status, report, runtimeState);
        result.addDetail("antivirusStatus", snapshot.systemState.get("antivirusStatus"));
        result.addDetail("compliant", compliant);
        return result;
    }

    @Override
    public ComplianceResult remediate(AgentSnapshot snapshot, Map<String, Object> payload) {
        String report = "Unknown";
        boolean compliant = false;
        try {
            report = Antivirus.runCheck(true);
            compliant = report.contains("FULLY COMPLIANT");
        } catch(Exception e) {
            report = "Remediation Error: " + e.getMessage();
        }
        
        ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, false);
        ComplianceStatus status = compliant ? ComplianceStatus.PASS : ComplianceStatus.FAIL;
        return new ComplianceResult(ModuleIds.ANTIVIRUS, status, report, runtimeState);
    }
}
