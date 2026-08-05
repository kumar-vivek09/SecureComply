import java.util.Map;

public interface RemediationModule {
    ComplianceResult remediate(AgentSnapshot snapshot, Map<String, Object> payload);
}
