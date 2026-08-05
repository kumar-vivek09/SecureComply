import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

public class ModuleMetadata {
    public final String id;
    public final String displayName;
    public final String moduleVersion;
    public final String minimumEngineVersion;
    public final ModuleCategory category;
    public final Severity severity;
    public final long estimatedExecutionMs;
    public final List<String> prerequisites;
    public final boolean supportsCheck;
    public final boolean supportsRemediation;
    public final boolean supportsRollback;
    public final boolean manualOnly;

    public ModuleMetadata(String id, String displayName, String moduleVersion, String minimumEngineVersion, 
                          ModuleCategory category, Severity severity, long estimatedExecutionMs, 
                          List<String> prerequisites, boolean supportsCheck, boolean supportsRemediation, 
                          boolean supportsRollback, boolean manualOnly) {
        this.id = id;
        this.displayName = displayName;
        this.moduleVersion = moduleVersion;
        this.minimumEngineVersion = minimumEngineVersion;
        this.category = category;
        this.severity = severity;
        this.estimatedExecutionMs = estimatedExecutionMs;
        this.prerequisites = prerequisites;
        this.supportsCheck = supportsCheck;
        this.supportsRemediation = supportsRemediation;
        this.supportsRollback = supportsRollback;
        this.manualOnly = manualOnly;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", id);
        map.put("name", id); // for legacy compat if needed
        map.put("displayName", displayName);
        map.put("moduleVersion", moduleVersion);
        map.put("minimumEngineVersion", minimumEngineVersion);
        map.put("category", category != null ? category.name() : null);
        map.put("severity", severity != null ? severity.name() : null);
        map.put("estimatedExecutionMs", estimatedExecutionMs);
        map.put("prerequisites", prerequisites);
        map.put("supportsCheck", supportsCheck);
        map.put("supportsRemediation", supportsRemediation);
        map.put("supportsRollback", supportsRollback);
        map.put("manualOnly", manualOnly);
        return map;
    }
}
