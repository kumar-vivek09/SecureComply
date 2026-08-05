import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class AgentSnapshot {
    public final String snapshotId;
    public final long capturedAt;
    public final Map<String, Object> systemState;

    public AgentSnapshot(Map<String, Object> state) {
        this.snapshotId = "snap-" + UUID.randomUUID().toString();
        this.capturedAt = System.currentTimeMillis();
        this.systemState = Collections.unmodifiableMap(new LinkedHashMap<>(state));
    }
}
