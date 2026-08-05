import java.util.LinkedHashMap;
import java.util.Map;

public class ModuleRuntimeState {
    public boolean available;
    public boolean enabled;
    public boolean supported;
    public boolean healthy;

    public ModuleRuntimeState(boolean available, boolean enabled, boolean supported, boolean healthy) {
        this.available = available;
        this.enabled = enabled;
        this.supported = supported;
        this.healthy = healthy;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("available", available);
        map.put("enabled", enabled);
        map.put("supported", supported);
        map.put("healthy", healthy);
        return map;
    }
}
