import java.util.Collections;

public class PortScanModule implements ComplianceModule {
    @Override
    public String getName() {
        return ModuleIds.PORT_SCAN;
    }

    @Override
    public ModuleMetadata getMetadata() {
        return new ModuleMetadata(
            ModuleIds.PORT_SCAN,
            "Open Port Scan",
            "1.0.0",
            "1.0.0",
            ModuleCategory.NETWORK,
            Severity.LOW,
            25000L,
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
        boolean completed = false;
        try {
            report = PortScanner.runScan();
            completed = report.contains("Scanning Completed.");
        } catch(Exception e) {
            report = "Error: " + e.getMessage();
        }
        
        ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, true);
        ComplianceStatus status = completed ? ComplianceStatus.PASS : ComplianceStatus.FAIL;
        
        ComplianceResult result = new ComplianceResult(ModuleIds.PORT_SCAN, status, report, runtimeState);
        result.addDetail("scanCompleted", completed);
        return result;
    }
}
