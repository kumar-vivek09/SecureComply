import java.io.BufferedReader;
import java.io.InputStreamReader;

public class WindowsUpdate {

    public static void main(String[] args) {
        System.out.print(runCheck());
    }

    public static String runCheck() {
        StringBuilder output = new StringBuilder();
        try {
            output.append("Checking Windows Version...\n");

            ProcessBuilder versionCheck = new ProcessBuilder(
                    "powershell.exe",
                    "-Command",
                    "[System.Environment]::OSVersion.Version.Build"
            );

            Process versionProcess = versionCheck.start();
            BufferedReader versionReader = new BufferedReader(
                    new InputStreamReader(versionProcess.getInputStream())
            );

            String buildStr = versionReader.readLine();
            versionProcess.waitFor();

            int build = Integer.parseInt(buildStr.trim());

            if (build >= 22000) {
                output.append("Detected OS: Windows 11 (Build ").append(build).append(")\n");
            } else {
                output.append("Detected OS: Windows 10 (Build ").append(build).append(")\n");
            }

            output.append("\nScanning for Windows Updates...\n");

            ProcessBuilder scanBuilder = new ProcessBuilder(
                    "cmd.exe",
                    "/c",
                    "UsoClient StartScan"
            );

            scanBuilder.start().waitFor();

            output.append("Scan initiated.\n");

            output.append("\nStarting download & install of updates...\n");

            String updateCommand =
                    "Start-Process cmd -Verb RunAs -ArgumentList " +
                    "'/c UsoClient StartDownload & UsoClient StartInstall'";

            ProcessBuilder updateBuilder = new ProcessBuilder(
                    "powershell.exe",
                    "-Command",
                    updateCommand
            );

            updateBuilder.start().waitFor();

            output.append("\nWindows Update process started.\n");

            Thread.sleep(5000);

            boolean rebootRequired = checkRebootRequired();

            if (rebootRequired) {
                output.append("\nSystem restart is required to complete updates.\n");
                output.append("Please remember to restart later.\n");
            } else {
                output.append("\nNo restart required.\n");
            }

        } catch (Exception e) {
            output.append("Error: ").append(e.getMessage()).append("\n");
        }
        return output.toString();
    }

    // --------------------------------------------------
    // REBOOT CHECK
    // --------------------------------------------------
    public static boolean checkRebootRequired() {

        try {

            ProcessBuilder pb = new ProcessBuilder(
                    "powershell.exe",
                    "-Command",
                    "Test-Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update\\RebootRequired'"
            );

            Process process = pb.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            String output = reader.readLine();
            process.waitFor();

            return "True".equalsIgnoreCase(output);

        } catch (Exception e) {
            return false;
        }
    }
}
