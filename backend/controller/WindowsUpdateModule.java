import java.util.Collections;

public class WindowsUpdateModule implements ComplianceModule {
    @Override
    public String getName() {
        return ModuleIds.WINDOWS_UPDATE;
    }

    @Override
    public ModuleMetadata getMetadata() {
        return new ModuleMetadata(
            ModuleIds.WINDOWS_UPDATE,
            "Windows Update",
            "1.0.0",
            "1.0.0",
            ModuleCategory.UPDATES,
            Severity.MEDIUM,
            15000L,
            Collections.singletonList("Internet"),
            true,
            false,
            false,
            false
        );
    }

    @Override
    public ComplianceResult execute(AgentSnapshot snapshot) {
        String report = "Unknown";
        boolean needsRestart = false;
        try {
            report = WindowsUpdate.runCheck();
            needsRestart = report.contains("restart is required");
        } catch(Exception e) {
            report = "Error: " + e.getMessage();
        }
        
        ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, true);
        ComplianceStatus status = needsRestart ? ComplianceStatus.FAIL : ComplianceStatus.PASS;
        
        ComplianceResult result = new ComplianceResult(ModuleIds.WINDOWS_UPDATE, status, report, runtimeState);
        result.addDetail("needsRestart", needsRestart);
        return result;
    }
}
