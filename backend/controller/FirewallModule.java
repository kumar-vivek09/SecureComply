import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Collections;
import java.util.Map;

public class FirewallModule implements ComplianceModule, RemediationModule {
    @Override
    public String getName() {
        return ModuleIds.FIREWALL;
    }

    @Override
    public ModuleMetadata getMetadata() {
        return new ModuleMetadata(
            ModuleIds.FIREWALL,
            "Windows Firewall",
            "1.0.0",
            "2.0.0",
            ModuleCategory.SECURITY,
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
        boolean compliant = false;
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "-Command",
                "(Get-NetFirewallProfile | Where-Object {$_.Enabled -eq $false}).Count"
            );
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String output = reader.readLine();
            process.waitFor();
            
            compliant = "0".equals(output);
            report = compliant ? "All Firewall profiles are enabled." : "One or more Firewall profiles are disabled.";
        } catch(Exception e) {
            report = "Error: " + e.getMessage();
        }
        
        ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, true);
        ComplianceStatus status = compliant ? ComplianceStatus.PASS : ComplianceStatus.FAIL;
        
        return new ComplianceResult(ModuleIds.FIREWALL, status, report, runtimeState);
    }

    @Override
    public ComplianceResult remediate(AgentSnapshot snapshot, Map<String, Object> payload) {
        String report = "Unknown";
        boolean compliant = false;
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "Start-Process",
                "powershell",
                "-Verb", "RunAs",
                "-Wait",
                "-ArgumentList",
                "'-Command \"Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True\"'"
            );
            Process process = pb.start();
            process.waitFor();
            
            ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, false);
            return new ComplianceResult(ModuleIds.FIREWALL, ComplianceStatus.PASS, "Remediation command executed.", runtimeState);
        } catch(Exception e) {
            report = "Remediation Error: " + e.getMessage();
            ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, false);
            return new ComplianceResult(ModuleIds.FIREWALL, ComplianceStatus.FAIL, report, runtimeState);
        }
    }
}
