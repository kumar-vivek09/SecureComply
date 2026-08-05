import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ComplianceResult is the structured return model for all compliance modules.
 */
public class ComplianceResult {
    public String moduleId;
    public String requestId;
    public String agentId;
    public ComplianceStatus status;
    public ModuleRuntimeState runtimeState;
    public String summary;
    public Map<String, Object> details;
    public long executionTime;
    public long timestamp;
    public long workflowDurationMs;
    public boolean autoRemediationSuccessful;
    public final List<WorkflowEvent> workflowEvents = new ArrayList<>();

    public static class WorkflowEvent {
        public final String action;
        public final String snapshotId;
        public final long startedAt;
        public final long completedAt;
        public final String status;
        
        public WorkflowEvent(String action, String snapshotId, long startedAt, long completedAt, String status) {
            this.action = action;
            this.snapshotId = snapshotId;
            this.startedAt = startedAt;
            this.completedAt = completedAt;
            this.status = status;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("action", action);
            map.put("snapshotId", snapshotId);
            map.put("startedAt", startedAt);
            map.put("completedAt", completedAt);
            map.put("status", status);
            return map;
        }
    }

    public ComplianceResult(String moduleId, ComplianceStatus status, String summary, ModuleRuntimeState runtimeState) {
        this.moduleId = moduleId;
        this.status = status;
        this.summary = summary;
        this.runtimeState = runtimeState;
        this.details = new LinkedHashMap<>();
        this.executionTime = 0;
        this.timestamp = System.currentTimeMillis();
        this.workflowDurationMs = 0;
        this.autoRemediationSuccessful = false;
    }

    public void addWorkflowEvent(WorkflowEvent event) {
        this.workflowEvents.add(event);
    }

    public ComplianceResult addDetail(String key, Object value) {
        this.details.put(key, value);
        return this;
    }

    public void setContext(String requestId, String agentId) {
        this.requestId = requestId;
        this.agentId = agentId;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("moduleId", moduleId);
        map.put("requestId", requestId);
        map.put("agentId", agentId);
        map.put("status", status != null ? status.name() : null);
        map.put("runtimeState", runtimeState != null ? runtimeState.toMap() : null);
        map.put("summary", summary);
        map.put("details", details);
        map.put("executionTime", executionTime);
        map.put("timestamp", timestamp);
        map.put("workflowDurationMs", workflowDurationMs);
        map.put("autoRemediationSuccessful", autoRemediationSuccessful);
        
        List<Map<String, Object>> eventsList = new ArrayList<>();
        for (WorkflowEvent event : workflowEvents) {
            eventsList.add(event.toMap());
        }
        map.put("workflowEvents", eventsList);
        
        // For backwards compatibility where legacy modules returned flat strings
        map.put("module", moduleId);
        map.put("success", String.valueOf(status == ComplianceStatus.PASS));
        
        return map;
    }
}
