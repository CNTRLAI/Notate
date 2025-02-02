import { dialog, shell } from "electron";
import { execSync } from "child_process";
import path from "path";
import log from "electron-log";
import { runWithPrivileges } from "./runWithPrivileges.js";
import fs from "fs";
import { getLinuxPackageManager } from "./getLinuxPackageManager.js";
import { updateLoadingStatus } from "../loadingWindow.js";
import { installDependencies } from "./installDependencies.js";

export async function ensurePythonAndVenv(backendPath: string) {
  updateLoadingStatus("Installing Python and Virtual Environment...", 0.5);
  const venvPath = path.join(backendPath, "venv");
  const pythonCommands =
    process.platform === "win32"
      ? ["python3.11", "py -3.11", "python"]
      : process.platform === "darwin"
      ? ["/opt/homebrew/bin/python3.12", "python3.12", "python3"]
      : ["python3.12", "python3"];

  let pythonCommand: string | null = null;
  let pythonVersion: string | null = null;

  // First ensure Python is installed
  for (const cmd of pythonCommands) {
    try {
      log.info(`Trying Python command: ${cmd}`);
      updateLoadingStatus(`Trying Python command: ${cmd}`, 1.5);
      const version = execSync(`${cmd} --version`).toString().trim();
      log.info(`Version output: ${version}`);
      updateLoadingStatus(`Version output: ${version}`, 2.0);
      if ((process.platform === "win32" && version.includes("3.11")) || 
          (process.platform !== "win32" && version.includes("3.12"))) {
        pythonCommand = cmd;
        pythonVersion = version;
        log.info(`Found valid Python command: ${cmd} with version ${version}`);
        updateLoadingStatus(
          `Found valid Python command: ${cmd} with version ${version}`,
          4.5
        );
        break;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.info(`Failed to execute ${cmd}: ${error.message}`);
        updateLoadingStatus(`Failed to execute ${cmd}: ${error.message}`, 3.5);
      }
      continue;
    }
  }

  if (!pythonCommand) {
    log.error(process.platform === "win32" ? "Python 3.11 is not installed or not in PATH" : "Python 3.12 is not installed or not in PATH");
    updateLoadingStatus(process.platform === "win32" ? "Python 3.11 is not installed or not in PATH" : "Python 3.12 is not installed or not in PATH", 3.5);
    const response = await dialog.showMessageBox({
      type: "question",
      buttons: ["Install Python", "Cancel"],
      defaultId: 0,
      title: process.platform === "win32" ? "Python 3.11 Required" : "Python 3.12 Required",
      message: process.platform === "win32" ? "Python 3.11 is required but not found on your system." : "Python 3.12 is required but not found on your system.",
      detail:
        process.platform === "win32" 
          ? "Would you like to open the Python download page to install Python 3.11?"
          : "Would you like to open the Python download page to install Python 3.12?",
    });

    if (response.response === 0) {
      updateLoadingStatus("Opening Python download page...", 4.5);
      await shell.openExternal(
        process.platform === "win32"
          ? "https://www.python.org/downloads/release/python-3118/"
          : "https://www.python.org/downloads/release/python-3128/"
      );
      updateLoadingStatus(
        process.platform === "win32"
          ? "Please restart the application after installing Python 3.11"
          : "Please restart the application after installing Python 3.12",
        8.5
      );
      throw new Error(
        process.platform === "win32"
          ? "Please restart the application after installing Python 3.11"
          : "Please restart the application after installing Python 3.12"
      );
    } else {
      updateLoadingStatus("Installation cancelled", 4.5);
      throw new Error(
        process.platform === "win32"
          ? "Python 3.11 is required to run this application. Installation was cancelled."
          : "Python 3.12 is required to run this application. Installation was cancelled."
      );
    }
  }

  log.info(`Using ${pythonVersion}`);
  updateLoadingStatus(`Using ${pythonVersion}`, 5.5);
  const venvPython =
    process.platform === "win32"
      ? path.join(venvPath, "Scripts", "python.exe")
      : path.join(venvPath, "bin", "python");

  // Create virtual environment if it doesn't exist
  if (!fs.existsSync(venvPath)) {
    log.info(process.platform === "win32" 
      ? "Creating virtual environment with Python 3.11..."
      : "Creating virtual environment with Python 3.12...");
    updateLoadingStatus(
      process.platform === "win32"
        ? "Creating virtual environment with Python 3.11..."
        : "Creating virtual environment with Python 3.12...",
      10.5
    );
    if (process.platform === "linux") {
      try {
        const packageManager = getLinuxPackageManager();
        log.info(`Using package manager: ${packageManager.command}`);
        updateLoadingStatus(
          `Using package manager: ${packageManager.command}`,
          11.5
        );
        const pythonFullPath = execSync(`which ${pythonCommand}`)
          .toString()
          .trim();
        log.info(`Full Python path: ${pythonFullPath}`);
        updateLoadingStatus(`Full Python path: ${pythonFullPath}`, 6.5);
        await runWithPrivileges([
          packageManager.installCommand,
          `${pythonFullPath} -m venv "${venvPath}"`,
          `chown -R ${process.env.USER}:${process.env.USER} "${venvPath}"`,
        ]);
        updateLoadingStatus("Virtual environment created successfully", 6.5);
        log.info("Virtual environment created successfully");
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error("Failed to create virtual environment", error);
          updateLoadingStatus("Failed to create virtual environment", 7.5);
          throw error;
        }
        updateLoadingStatus(
          "Unknown error while creating virtual environment",
          15.5
        );
        throw new Error("Unknown error while creating virtual environment");
      }
    } else {
      try {
        execSync(`${pythonCommand} -m venv "${venvPath}"`);
        log.info("Virtual environment created successfully");
        updateLoadingStatus("Virtual environment created successfully", 7.5);
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error("Failed to create virtual environment", error);
          updateLoadingStatus("Failed to create virtual environment", 7.5);
          throw new Error("Failed to create virtual environment");
        } else {
          log.error("Unknown error in ensurePythonAndVenv", error);
          updateLoadingStatus("Unknown error in ensurePythonAndVenv", 7.5);
          throw new Error("Unknown error in ensurePythonAndVenv");
        }
      }
    }
  }

  // Check for NVIDIA GPU and CUDA first
  let hasNvidiaGpu = false;
  let cudaAvailable = false;

  // Force CPU-only mode for laptops and non-NVIDIA systems
  if (process.platform === "darwin") {
    hasNvidiaGpu = false;
    cudaAvailable = false;
    log.info("MacOS detected, using CPU-only mode");
    updateLoadingStatus("Using CPU-only mode for MacOS", 7.5);
  } else {
    try {
      if (process.platform === "linux" || process.platform === "win32") {
        updateLoadingStatus("Checking for NVIDIA GPU...", 8.5);
        const gpuInfo = execSync("nvidia-smi").toString();
        // Only enable CUDA if this is a dedicated GPU (not a laptop integrated GPU)
        if (
          !gpuInfo.toLowerCase().includes("notebook") &&
          !gpuInfo.toLowerCase().includes("laptop")
        ) {
          hasNvidiaGpu = true;
          updateLoadingStatus("Dedicated NVIDIA GPU detected", 9.5);
        } else {
          log.info("Laptop GPU detected, using CPU-only mode");
          updateLoadingStatus("Using CPU-only mode for laptop GPU", 9.5);
          hasNvidiaGpu = false;
        }
      }
    } catch {
      log.info(
        "No NVIDIA GPU detected or nvidia-smi not available, using CPU-only mode"
      );
      updateLoadingStatus("Using CPU-only mode", 9.5);
      hasNvidiaGpu = false;
    }
  }

  // Skip CUDA checks if we're in CPU-only mode
  if (hasNvidiaGpu) {
    try {
      updateLoadingStatus("Checking for CUDA installation...", 10.5);
      const cudaCheckCommands = [
        "nvcc --version",
        process.platform === "win32"
          ? "where cuda-install-samples-*.exe"
          : "which nvcc",
        process.platform === "win32"
          ? 'dir /b "%CUDA_PATH%\\bin\\nvcc.exe"'
          : "ls -l /usr/local/cuda/bin/nvcc",
      ];

      for (const cmd of cudaCheckCommands) {
        try {
          const output = execSync(cmd).toString();
          if (output) {
            cudaAvailable = true;
            break;
          }
        } catch (e) {
          log.debug(
            `CUDA check command failed: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
          continue;
        }
      }

      // If CUDA is not available on Linux, try to install it
      if (!cudaAvailable && process.platform === "linux") {
        log.info(
          "CUDA not found on Linux, attempting to install CUDA toolkit..."
        );
        updateLoadingStatus(
          "CUDA not found on Linux, attempting to install CUDA toolkit...",
          10.5
        );

        const packageManager = getLinuxPackageManager();

        // Check if we're on Fedora - if so, handle CUDA installation in ifFedora.ts
        if (fs.existsSync("/etc/fedora-release")) {
          // Re-check CUDA availability after Fedora-specific installation
          updateLoadingStatus(
            "Re-checking CUDA availability after Fedora-specific installation",
            11.5
          );
          try {
            const nvccVersion = execSync("nvcc --version").toString();
            if (nvccVersion) {
              updateLoadingStatus(
                "CUDA toolkit installed successfully via Fedora-specific process",
                12.5
              );
              log.info(
                "CUDA toolkit installed successfully via Fedora-specific process"
              );
              cudaAvailable = true;
            }
          } catch (error) {
            log.error("Failed to verify CUDA installation on Fedora:", error);
          }
        } else {
          // Non-Fedora Linux systems
          try {
            updateLoadingStatus(
              "Installing CUDA toolkit and development tools...",
              11.5
            );
            await runWithPrivileges([
              // Update package list
              `${packageManager.command} update`,
              // Install CUDA toolkit and development tools
              `${packageManager.installCommand} nvidia-cuda-toolkit build-essential`,
            ]);
            updateLoadingStatus("CUDA toolkit installed successfully", 12.5);
            // Verify installation
            const nvccVersion = execSync("nvcc --version").toString();
            if (nvccVersion) {
              log.info("CUDA toolkit installed successfully");
              updateLoadingStatus("CUDA toolkit installed successfully", 13.5);
              cudaAvailable = true;
            }
          } catch (error) {
            log.error("Failed to install CUDA toolkit:", error);
            updateLoadingStatus("Failed to install CUDA toolkit", 13.5);
            // Continue without CUDA support
          }
        }
      }
    } catch (error) {
      log.info("Failed to detect CUDA installation details", error);
      updateLoadingStatus("Failed to detect CUDA installation details", 13.5);
    }
  } else {
    cudaAvailable = false;
  }

  // When you reach the dependency installation part, call the new async function:
  return await installDependencies(venvPython, hasNvidiaGpu, cudaAvailable);
}
