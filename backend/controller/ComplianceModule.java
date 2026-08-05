import java.util.Collections;

/**
 * ComplianceModule defines the contract for all compliance check modules.
 * Each module must provide a name and an execute method that returns a ComplianceResult.
 */
public interface ComplianceModule {
    /**
     * Returns the unique name of this module (e.g., "ANTIVIRUS", "WINDOWS_UPDATE").
     */
    String getName();

    /**
     * Execute the compliance check using the provided agent snapshot.
     * @param snapshot Current agent telemetry snapshot.
     * @return A structured ComplianceResult.
     */
    ComplianceResult execute(AgentSnapshot snapshot);

    /**
     * Returns the metadata for this module.
     * Default implementation for backwards compatibility.
     */
    default ModuleMetadata getMetadata() {
        return new ModuleMetadata(
            getName(),
            getName(), // displayName
            "1.0.0", // version
            "1.0.0", // minimumEngineVersion
            ModuleCategory.SYSTEM,
            Severity.MEDIUM,
            5000L,
            Collections.emptyList(),
            true, // supportsCheck
            false, // supportsRemediation
            false, // supportsRollback
            false // manualOnly
        );
    }
}
