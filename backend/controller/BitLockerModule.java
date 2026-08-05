import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public class BitLockerModule implements ComplianceModule {
    @Override
    public String getName() {
        return ModuleIds.BITLOCKER;
    }

    @Override
    public ModuleMetadata getMetadata() {
        return new ModuleMetadata(
            ModuleIds.BITLOCKER,
            "BitLocker Drive Encryption",
            "1.0.0",
            "2.0.0",
            ModuleCategory.ENCRYPTION,
            Severity.CRITICAL,
            4000L,
            Collections.singletonList("Administrator"),
            true,
            false,
            false,
            true // manualOnly
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
                "(Get-BitLockerVolume -MountPoint 'C:').VolumeStatus"
            );
            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String output = reader.readLine();
            process.waitFor();
            
            if (output != null) {
                compliant = "FullyEncrypted".equalsIgnoreCase(output.trim());
                report = "C: Drive BitLocker Status: " + output.trim();
            } else {
                report = "Could not read BitLocker status. (Ensure running as Administrator)";
            }
        } catch(Exception e) {
            report = "Error: " + e.getMessage();
        }
        
        ModuleRuntimeState runtimeState = new ModuleRuntimeState(true, true, true, true);
        ComplianceStatus status = compliant ? ComplianceStatus.PASS : ComplianceStatus.MANUAL_REQUIRED;
        
        ComplianceResult result = new ComplianceResult(ModuleIds.BITLOCKER, status, report, runtimeState);
        
        if (!compliant) {
            Map<String, String> recommendation = new LinkedHashMap<>();
            recommendation.put("reason", "Drive C: is not fully encrypted.");
            recommendation.put("impact", "Restart Required. May take several hours to encrypt.");
            recommendation.put("steps", "1. Open Control Panel.\n2. Go to BitLocker Drive Encryption.\n3. Click 'Turn on BitLocker'.\n4. Follow the wizard and securely save the recovery key.");
            result.addDetail("recommendation", recommendation);
        }
        
        return result;
    }
}
