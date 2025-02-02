import { exec } from "child_process";
import log from "electron-log";

export async function killProcessOnPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    const command =
      process.platform === "win32"
        ? `netstat -ano | findstr :${port} | findstr LISTENING`
        : `lsof -i :${port} | grep LISTEN`;

    exec(command, async (error, stdout) => {
      if (error) {
        log.error(`Failed to find process on port ${port}: ${error}`);
        resolve(); // Resolve anyway since there might not be a process
        return;
      }

      if (!stdout) {
        resolve();
        return;
      }

      // Extract PID based on platform
      let pid: string | null = null;
      if (process.platform === "win32") {
        // On Windows, try to get all PIDs that might be using the port
        const lines = stdout.split("\n");
        for (const line of lines) {
          const match = line.match(/\s+(\d+)\s*$/);
          if (match) {
            pid = match[1];
            // Kill each process we find
            const killCommand = `taskkill /F /PID ${pid}`;
            try {
              await new Promise((resolve, reject) => {
                exec(killCommand, (killError) => {
                  if (killError) {
                    log.error(`Failed to kill process ${pid}: ${killError}`);
                    reject(killError);
                  } else {
                    log.info(
                      `Successfully killed process ${pid} on port ${port}`
                    );
                    resolve(true);
                  }
                });
              });
            } catch (e) {
              log.error(`Error killing process: ${e}`);
            }
          }
        }
      } else {
        const match = stdout.match(/\S+\s+(\d+)/);
        if (match) {
          pid = match[1];
          // Kill the process
          const killCommand = `kill -9 ${pid}`;
          exec(killCommand, (killError) => {
            if (killError) {
              log.error(`Failed to kill process ${pid}: ${killError}`);
            } else {
              log.info(`Successfully killed process ${pid} on port ${port}`);
            }
          });
        }
      }

      // Add a small delay before resolving to ensure process cleanup
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  });
}
