import java.io.BufferedReader;
import java.io.InputStreamReader;

public class Antivirus {

    public static void main(String[] args) {
        System.out.print(runCheck());
    }

    public static String runCheck() {
        StringBuilder output = new StringBuilder();
        try {
            boolean antivirusEnabled = checkAntivirus();
            boolean realTimeEnabled = checkRealTimeProtection();
            boolean firewallEnabled = checkFirewall();

            output.append("------ Compliance Report ------\n");
            output.append("Antivirus Enabled: ").append(antivirusEnabled).append("\n");
            output.append("Real-Time Protection: ").append(realTimeEnabled).append("\n");
            output.append("Firewall Enabled: ").append(firewallEnabled).append("\n");

            if (antivirusEnabled && realTimeEnabled && firewallEnabled) {
                output.append("Overall Risk Level: LOW\n");
                output.append("\nSystem is FULLY COMPLIANT.\n");
            } else {
                output.append("Overall Risk Level: HIGH\n");
                output.append("\nSystem is NON-COMPLIANT.\n");
                output.append("Attempting to enable Antivirus and Firewall...\n");

                String elevatedCommand =
                        "Start-Process powershell -Verb RunAs -ArgumentList " +
                        "'-Command \"Set-MpPreference -DisableRealtimeMonitoring $false; " +
                        "Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True; " +
                        "Write-Host ''Security Settings Applied''; " +
                        "Start-Sleep -Seconds 10\"'";

                ProcessBuilder builder = new ProcessBuilder(
                        "powershell.exe",
                        "-Command",
                        elevatedCommand
                );

                Process process = builder.start();
                process.waitFor();
                Thread.sleep(5000);

                output.append("\nRe-checking compliance status...\n");

                antivirusEnabled = checkAntivirus();
                realTimeEnabled = checkRealTimeProtection();
                firewallEnabled = checkFirewall();

                output.append("------ Updated Compliance Report ------\n");
                output.append("Antivirus Enabled: ").append(antivirusEnabled).append("\n");
                output.append("Real-Time Protection: ").append(realTimeEnabled).append("\n");
                output.append("Firewall Enabled: ").append(firewallEnabled).append("\n");

                if (antivirusEnabled && realTimeEnabled && firewallEnabled) {
                    output.append("Overall Risk Level: LOW\n");
                    output.append("\nSystem is now FULLY COMPLIANT.\n");
                } else {
                    output.append("Overall Risk Level: HIGH\n");
                    output.append("\nSystem remains NON-COMPLIANT.\n");
                }
            }
        } catch (Exception e) {
            output.append("Error: ").append(e.getMessage()).append("\n");
        }
        return output.toString();
    }

    public static boolean checkAntivirus() throws Exception {

        ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "-Command",
                "(Get-MpComputerStatus).AntivirusEnabled"
        );

        Process process = pb.start();
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        );

        String output = reader.readLine();
        process.waitFor();

        return "True".equalsIgnoreCase(output);
    }

    public static boolean checkRealTimeProtection() throws Exception {

        ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "-Command",
                "(Get-MpComputerStatus).RealTimeProtectionEnabled"
        );

        Process process = pb.start();
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        );

        String output = reader.readLine();
        process.waitFor();

        return "True".equalsIgnoreCase(output);
    }

    public static boolean checkFirewall() throws Exception {

        ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "-Command",
                "(Get-NetFirewallProfile | Where-Object {$_.Enabled -eq $false}).Count"
        );

        Process process = pb.start();
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream())
        );

        String output = reader.readLine();
        process.waitFor();

        return "0".equals(output);
    }
}
