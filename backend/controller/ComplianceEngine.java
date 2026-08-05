import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * ComplianceEngine is the single authoritative owner of module registration,
 * metadata generation, execution, scoring, and discovery. (Rule 13)
 */
public class ComplianceEngine {
    private final Map<String, ComplianceModule> modules = new ConcurrentHashMap<>();
    private final Map<String, Integer> scoringWeights = new ConcurrentHashMap<>();
    
    private String capabilityVersionCache = null;

    public void initialize() {
        // Register legacy and new modules here
        register(new AntivirusModule(), 10);
        register(new WindowsUpdateModule(), 10);
        register(new PortScanModule(), 10);
        
        // Phase 1b modules
        register(new FirewallModule(), 20);
        // register(new DefenderModule(), 20); // Hidden from dashboard as per request
        register(new PasswordPolicyModule(), 10);
        register(new LocalAdminsModule(), 10);
        register(new BitLockerModule(), 10);
        
        recalculateCapabilityVersion();
    }

    private void register(ComplianceModule module, int weight) {
        if (module == null || module.getName() == null) {
            return;
        }
        String id = module.getName().toUpperCase();
        modules.put(id, module);
        scoringWeights.put(id, weight);
    }

    private void recalculateCapabilityVersion() {
        // Hash based on engine version and all module versions
        StringBuilder sb = new StringBuilder("2.1.0|"); // Engine version
        List<String> keys = new ArrayList<>(modules.keySet());
        Collections.sort(keys);
        for (String key : keys) {
            ModuleMetadata meta = modules.get(key).getMetadata();
            sb.append(meta.id).append(":").append(meta.moduleVersion).append(";");
        }
        // Simple hash for caching capability string
        this.capabilityVersionCache = Integer.toHexString(sb.toString().hashCode());
    }

    public boolean supports(String moduleName) {
        return moduleName != null && modules.containsKey(moduleName.toUpperCase());
    }

    public String getCapabilityVersion() {
        return capabilityVersionCache;
    }

    public List<Map<String, Object>> getCapabilitiesMetadata() {
        List<Map<String, Object>> metas = new ArrayList<>();
        for (ComplianceModule mod : modules.values()) {
            metas.add(mod.getMetadata().toMap());
        }
        return metas;
    }
    
    // For HELLO compatibility
    public String getCapabilitiesString() {
        return String.join(",", modules.keySet());
    }

    private AgentSnapshot createExecutionSnapshot() {
        Map<String, Object> state = new java.util.LinkedHashMap<>();
        try {
            state.put("antivirusStatus", AgentCommandExecutor.determineAntivirusStatus());
        } catch (Exception e) {}
        return new AgentSnapshot(state);
    }

    public ComplianceResult executeComplianceWorkflow(String moduleName, Map<String, Object> payload) {
        long globalStartTime = System.currentTimeMillis();
        
        if (moduleName == null) {
            return new ComplianceResult(moduleName, ComplianceStatus.UNKNOWN, "Module name is null", new ModuleRuntimeState(false, false, false, false));
        }

        ComplianceModule module = modules.get(moduleName.toUpperCase());
        if (module == null) {
            return new ComplianceResult(moduleName, ComplianceStatus.UNKNOWN, "Unsupported module: " + moduleName, new ModuleRuntimeState(false, false, false, false));
        }
        
        AgentSnapshot snap1 = createExecutionSnapshot();
        
        long checkStart = System.currentTimeMillis();
        ComplianceResult result = null;
        try {
            result = module.execute(snap1);
        } catch (Exception e) {
            result = new ComplianceResult(moduleName, ComplianceStatus.FAIL, "Module error: " + e.getMessage(), new ModuleRuntimeState(true, true, true, false));
        }
        long checkEnd = System.currentTimeMillis();
        result.addWorkflowEvent(new ComplianceResult.WorkflowEvent("CHECK", snap1.snapshotId, checkStart, checkEnd, result.status.name()));
        
        if (result.status == ComplianceStatus.PASS) {
            result.workflowDurationMs = System.currentTimeMillis() - globalStartTime;
            return result;
        }
        
        if (result.status == ComplianceStatus.FAIL && module instanceof RemediationModule) {
            long remStart = System.currentTimeMillis();
            ComplianceResult remResult = null;
            try {
                remResult = ((RemediationModule) module).remediate(snap1, payload);
            } catch (Exception e) {
                remResult = new ComplianceResult(moduleName, ComplianceStatus.FAIL, "Remediation error: " + e.getMessage(), new ModuleRuntimeState(true, true, true, false));
            }
            long remEnd = System.currentTimeMillis();
            result.addWorkflowEvent(new ComplianceResult.WorkflowEvent("REMEDIATE", snap1.snapshotId, remStart, remEnd, remResult.status.name()));
            
            AgentSnapshot snap2 = createExecutionSnapshot();
            
            long verStart = System.currentTimeMillis();
            ComplianceResult verResult = null;
            try {
                verResult = module.execute(snap2);
            } catch (Exception e) {
                verResult = new ComplianceResult(moduleName, ComplianceStatus.FAIL, "Verify error: " + e.getMessage(), new ModuleRuntimeState(true, true, true, false));
            }
            long verEnd = System.currentTimeMillis();
            result.addWorkflowEvent(new ComplianceResult.WorkflowEvent("VERIFY", snap2.snapshotId, verStart, verEnd, verResult.status.name()));
            
            verResult.workflowEvents.addAll(0, result.workflowEvents); // Keep history chronological
            verResult.autoRemediationSuccessful = (verResult.status == ComplianceStatus.PASS);
            verResult.workflowDurationMs = System.currentTimeMillis() - globalStartTime;
            return verResult;
        }
        
        result.workflowDurationMs = System.currentTimeMillis() - globalStartTime;
        return result;
    }

    public List<ComplianceResult> executeAll() {
        List<ComplianceResult> results = new ArrayList<>();
        for (String moduleName : modules.keySet()) {
            results.add(executeComplianceWorkflow(moduleName, Collections.emptyMap()));
        }
        return results;
    }

    public int calculateScore(List<ComplianceResult> results) {
        int earned = 0;
        int max = 0;
        
        for (ComplianceResult result : results) {
            Integer weight = scoringWeights.get(result.moduleId.toUpperCase());
            if (weight != null) {
                max += weight;
                if (result.status == ComplianceStatus.PASS) {
                    earned += weight;
                }
            }
        }
        
        if (max == 0) return 100;
        return (int) (((double) earned / max) * 100);
    }
}
