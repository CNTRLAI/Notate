import { platform } from "os";
import { ExecException, exec } from "child_process";

export async function systemSpecs(): Promise<{
  cpu: string;
  vram: string;
  GPU_Manufacturer?: string;
}> {
  const os = platform();

  return new Promise((resolve) => {
    if (os === "darwin") {
      // macOS
      exec(
        "system_profiler SPHardwareDataType SPDisplaysDataType",
        (error: ExecException | null, stdout: string) => {
          if (error) {
            console.error("Error getting system specs:", error);
            resolve({
              cpu: "Unknown",
              vram: "Unknown",
              GPU_Manufacturer: "Unknown",
            });
            return;
          }

          const cpu =
            stdout.match(/Chip: (.+)/)?.[1] ||
            stdout.match(/Processor Name: (.+)/)?.[1] ||
            "Unknown";

          const memory = stdout.match(/Memory: (.+)/)?.[1] || "Unknown";
          const gpuCores = stdout.match(/Total Number of Cores: (\d+)/)?.[1];

          // Check for GPU manufacturer
          const GPU_Manufacturer = cpu.includes("Apple")
            ? "Apple Silicon"
            : stdout.includes("NVIDIA")
            ? "NVIDIA"
            : stdout.includes("AMD")
            ? "AMD"
            : "Unknown";

          const vram = cpu.includes("Apple")
            ? `${memory} Unified Memory, ${gpuCores || "Unknown"} GPU Cores`
            : stdout.match(/VRAM \(Total\): (.+)/)?.[1] || "Unknown";

          resolve({ cpu, vram, GPU_Manufacturer });
        }
      );
    } else if (os === "win32") {
      // Windows - Use separate commands for GPU info and VRAM
      const gpuCommand = "wmic path win32_VideoController get name";
      const vramCommand =
        'powershell -command "$qwMemorySize = (Get-ItemProperty -Path \\"HKLM:\\SYSTEM\\ControlSet001\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0*\\" -Name HardwareInformation.qwMemorySize -ErrorAction SilentlyContinue).\\"HardwareInformation.qwMemorySize\\"; [math]::round($qwMemorySize/1GB)"';
      const cpuCommand = "wmic cpu get name";

      // Execute all commands in sequence
      exec(gpuCommand, (gpuError: ExecException | null, gpuStdout: string) => {
        if (gpuError) {
          console.error("Error getting GPU info:", gpuError);
          resolve({
            cpu: "Unknown",
            vram: "Unknown",
            GPU_Manufacturer: "Unknown",
          });
          return;
        }

        // Parse GPU info
        const gpuLines = gpuStdout.trim().split("\n");
        const gpuName = gpuLines[1]?.trim() || "Unknown";
        let GPU_Manufacturer = "Unknown";

        // Determine manufacturer from GPU name
        if (gpuName.toLowerCase().includes("nvidia")) {
          GPU_Manufacturer = "NVIDIA";
        } else if (
          gpuName.toLowerCase().includes("amd") ||
          gpuName.toLowerCase().includes("radeon")
        ) {
          GPU_Manufacturer = "AMD";
        } else if (gpuName.toLowerCase().includes("intel")) {
          GPU_Manufacturer = "Intel";
        }

        // Get CPU info
        exec(
          cpuCommand,
          (cpuError: ExecException | null, cpuStdout: string) => {
            const cpu = cpuError
              ? "Unknown"
              : cpuStdout.trim().split("\n")[1]?.trim() || "Unknown";

            // Get VRAM info
            exec(
              vramCommand,
              (vramError: ExecException | null, vramStdout: string) => {
                let vram = "Unknown";
                if (!vramError) {
                  const vramGB = parseInt(vramStdout.trim());
                  if (!isNaN(vramGB)) {
                    vram = `${vramGB} GB`;
                  }
                }

                GPU_Manufacturer = gpuName;
                resolve({ cpu, vram, GPU_Manufacturer });
              }
            );
          }
        );
      });
    } else {
      // Linux
      const getVRAM = async (GPU_Manufacturer: string): Promise<string> => {
        return new Promise((resolve) => {
          if (GPU_Manufacturer === "NVIDIA") {
            exec("nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits", (error, stdout) => {
              if (!error && stdout) {
                const vramMB = parseInt(stdout.trim());
                resolve(vramMB >= 1024 ? `${(vramMB / 1024).toFixed(1)} GB` : `${vramMB} MB`);
              } else {
                resolve("Unknown");
              }
            });
          } else if (GPU_Manufacturer === "AMD") {
            exec("rocm-smi --showmeminfo vram", (error, stdout) => {
              if (!error && stdout) {
                const match = stdout.match(/(\d+)\s*MB/);
                if (match) {
                  const vramMB = parseInt(match[1]);
                  resolve(vramMB >= 1024 ? `${(vramMB / 1024).toFixed(1)} GB` : `${vramMB} MB`);
                } else {
                  resolve("Unknown");
                }
              } else {
                resolve("Unknown");
              }
            });
          } else if (GPU_Manufacturer === "Intel") {
            // For Intel, try multiple methods to get memory information
            exec("free -m && glxinfo | grep -i 'dedicated video memory\\|total available memory'", (error, stdout) => {
              if (!error && stdout) {
                // Try to find dedicated or total available memory from glxinfo
                const dedicatedMatch = stdout.match(/Dedicated video memory:\s*(\d+)\s*MB/i);
                const totalMatch = stdout.match(/Total available memory:\s*(\d+)\s*MB/i);
                // Get system memory from free command
                const memMatch = stdout.match(/Mem:\s+(\d+)/);
                
                if (dedicatedMatch) {
                  const vramMB = parseInt(dedicatedMatch[1]);
                  resolve(vramMB >= 1024 ? `${(vramMB / 1024).toFixed(1)} GB` : `${vramMB} MB`);
                } else if (totalMatch) {
                  const vramMB = parseInt(totalMatch[1]);
                  resolve(`${(vramMB / 1024).toFixed(1)} GB (Shared)`);
                } else if (memMatch) {
                  // If no specific GPU memory info, show system memory as shared
                  const totalMemMB = parseInt(memMatch[1]);
                  const sharedGB = (totalMemMB / 1024).toFixed(1);
                  resolve(`Up to ${sharedGB} GB Shared Memory`);
                } else {
                  resolve("Shared Memory");
                }
              } else {
                // Fallback to just getting system memory
                exec("free -m", (error2, stdout2) => {
                  if (!error2 && stdout2) {
                    const memMatch = stdout2.match(/Mem:\s+(\d+)/);
                    if (memMatch) {
                      const totalMemMB = parseInt(memMatch[1]);
                      const sharedGB = (totalMemMB / 1024).toFixed(1);
                      resolve(`Up to ${sharedGB} GB Shared Memory`);
                    } else {
                      resolve("Shared Memory");
                    }
                  } else {
                    resolve("Shared Memory");
                  }
                });
              }
            });
          } else {
            resolve("Unknown");
          }
        });
      };

      exec(
        "lscpu | grep 'Model name' && lspci | grep -i vga",
        async (error: ExecException | null, stdout: string) => {
          if (error) {
            console.error("Error getting system specs:", error);
            resolve({
              cpu: "Unknown",
              vram: "Unknown",
              GPU_Manufacturer: "Unknown",
            });
            return;
          }

          const cpu = stdout.match(/Model name:\s*(.+)/)?.[1]?.trim() || "Unknown";
          const gpuLine = stdout.match(/VGA.*: (.+)/)?.[1] || "";

          // Determine GPU manufacturer from the GPU line
          const GPU_Manufacturer = gpuLine.includes("NVIDIA")
            ? "NVIDIA"
            : gpuLine.includes("AMD")
            ? "AMD"
            : gpuLine.includes("Intel")
            ? "Intel"
            : "Unknown";

          const vram = await getVRAM(GPU_Manufacturer);
          resolve({ cpu, vram, GPU_Manufacturer });
        }
      );
    }
  });
}
