import { dialog, shell } from "electron";
import { execSync, spawn } from "child_process";
import path from "path";
import log from "electron-log";
import { runWithPrivileges } from "./runWithPrivileges.js";
import fs from "fs";
import { getLinuxPackageManager } from "./getLinuxPackageManager.js";
import { updateLoadingStatus } from "../loadingWindow.js";

function spawnAsync(command: string, args: string[], options: { env?: NodeJS.ProcessEnv; stdio?: 'inherit' | 'pipe' } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
      log.info(`[Installation Output] ${data.toString().trim()}`);
      updateLoadingStatus(data.toString().trim(), -1);
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
      log.warn(`[Installation Error] ${data.toString().trim()}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Process exited with code ${code}\nStderr: ${stderr}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

export async function ensurePythonAndVenv(backendPath: string) {
  updateLoadingStatus("Installing Python and Virtual Environment...", 0.5);
  const venvPath = path.join(backendPath, "venv");
  const pythonCommands =
    process.platform === "win32"
      ? ["python3.10", "py -3.10", "python"]
      : process.platform === "darwin"
      ? ["/opt/homebrew/bin/python3.10", "python3.10", "python3"]
      : ["python3.10", "python3"];

  let pythonCommand: string | null = null;
  let pythonVersion: string | null = null;

  // First ensure Python is installed
  for (const cmd of pythonCommands) {
    try {
      log.info(`Trying Python command: ${cmd}`);
      updateLoadingStatus(`Trying Python command: ${cmd}`, 1.5);
      const version = execSync(`${cmd} --version`).toString().trim();
      log.info(`Version output: ${version}`);
      updateLoadingStatus(`Version output: ${version}`, 3.5);
      if (version.includes("3.10")) {
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
        updateLoadingStatus(`Failed to execute ${cmd}: ${error.message}`, 5.5);
      }
      continue;
    }
  }

  if (!pythonCommand) {
    log.error("Python 3.10 is not installed or not in PATH");
    updateLoadingStatus("Python 3.10 is not installed or not in PATH", 6.5);
    const response = await dialog.showMessageBox({
      type: "question",
      buttons: ["Install Python 3.10", "Cancel"],
      defaultId: 0,
      title: "Python 3.10 Required",
      message: "Python 3.10 is required but not found on your system.",
      detail:
        "Would you like to open the Python download page to install Python 3.10?",
    });

    if (response.response === 0) {
      updateLoadingStatus("Opening Python download page...", 7.5);
      await shell.openExternal(
        "https://www.python.org/downloads/release/python-31010/"
      );
      updateLoadingStatus(
        "Please restart the application after installing Python 3.10",
        8.5
      );
      throw new Error(
        "Please restart the application after installing Python 3.10"
      );
    } else {
      updateLoadingStatus("Installation cancelled", 8.5);
      throw new Error(
        "Python 3.10 is required to run this application. Installation was cancelled."
      );
    }
  }

  log.info(`Using ${pythonVersion}`);
  updateLoadingStatus(`Using ${pythonVersion}`, 9.5);
  const venvPython =
    process.platform === "win32"
      ? path.join(venvPath, "Scripts", "python.exe")
      : path.join(venvPath, "bin", "python");

  // Create virtual environment if it doesn't exist
  if (!fs.existsSync(venvPath)) {
    log.info("Creating virtual environment with Python 3.10...");
    updateLoadingStatus(
      "Creating virtual environment with Python 3.10...",
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
        updateLoadingStatus(`Full Python path: ${pythonFullPath}`, 12.5);
        await runWithPrivileges([
          packageManager.installCommand,
          `${pythonFullPath} -m venv "${venvPath}"`,
          `chown -R ${process.env.USER}:${process.env.USER} "${venvPath}"`,
        ]);
        updateLoadingStatus("Virtual environment created successfully", 13.5);
        log.info("Virtual environment created successfully");
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error("Failed to create virtual environment", error);
          updateLoadingStatus("Failed to create virtual environment", 14.5);
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
        updateLoadingStatus("Virtual environment created successfully", 11.5);
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error("Failed to create virtual environment", error);
          updateLoadingStatus("Failed to create virtual environment", 12.5);
          throw new Error("Failed to create virtual environment");
        } else {
          log.error("Unknown error in ensurePythonAndVenv", error);
          updateLoadingStatus("Unknown error in ensurePythonAndVenv", 13.5);
          throw new Error("Unknown error in ensurePythonAndVenv");
        }
      }
    }
  }

  // Check for NVIDIA GPU and CUDA first
  let hasNvidiaGpu = false;
  let cudaAvailable = false;
  try {
    if (process.platform === "linux" || process.platform === "win32") {
      updateLoadingStatus("Checking for NVIDIA GPU and CUDA...", 15.5);
      execSync("nvidia-smi");
      hasNvidiaGpu = true;
      updateLoadingStatus("NVIDIA GPU and CUDA detected", 16.5);
    } else if (process.platform === "darwin") {
      hasNvidiaGpu = false;
    }
  } catch {
    log.info("No NVIDIA GPU detected, will use CPU-only packages");
    updateLoadingStatus(
      "No NVIDIA GPU detected, will use CPU-only packages",
      17.5
    );
    hasNvidiaGpu = false;
  }

  if (hasNvidiaGpu) {
    try {
      updateLoadingStatus("Checking for CUDA installation...", 22.5);
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
        const packageManager = getLinuxPackageManager();

        try {
          await runWithPrivileges([
            // Update package list
            `${packageManager.command} update`,
            // Install CUDA toolkit and development tools
            `${packageManager.installCommand} nvidia-cuda-toolkit build-essential`,
          ]);

          // Verify installation
          const nvccVersion = execSync("nvcc --version").toString();
          if (nvccVersion) {
            log.info("CUDA toolkit installed successfully");
            cudaAvailable = true;
          }
        } catch (error) {
          log.error("Failed to install CUDA toolkit:", error);
          // Continue without CUDA support
        }
      }
    } catch (error) {
      log.info("Failed to detect CUDA installation details", error);
    }
  }

  // Modify the dependency installation section:
  async function installDependencies(venvPython: string, hasNvidiaGpu: boolean, cudaAvailable: boolean) {
    try {
      // Upgrade pip first
      await spawnAsync(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip']);
      log.info("Pip upgraded successfully");
      updateLoadingStatus("Pip upgraded successfully", 23.5);

      // Install NumPy with specific version
      await spawnAsync(venvPython, ['-m', 'pip', 'install', 'numpy==1.24.3', '--no-deps', '--no-cache-dir']);
      log.info("NumPy 1.24.3 installed successfully");
      updateLoadingStatus("NumPy 1.24.3 installed successfully", 24.5);

      // Install FastAPI and dependencies
      const fastApiDeps = process.platform === "darwin"
        ? ['fastapi==0.115.6', 'pydantic>=2.9.0,<3.0.0', 'uvicorn[standard]==0.27.0', 'python-multipart==0.0.7', 'email-validator==2.1.0', 'httpx>=0.26.0,<0.28.0', 'numpy==1.24.3', 'PyJWT==2.10.1']
        : ['fastapi>=0.115.6', 'pydantic>=2.5.0', 'uvicorn[standard]>=0.27.0', 'python-multipart>=0.0.7', 'email-validator>=2.1.0', 'httpx>=0.26.0,<0.28.0', 'numpy==1.24.3', 'PyJWT==2.10.1'];

      await spawnAsync(venvPython, ['-m', 'pip', 'install', '--no-cache-dir', ...fastApiDeps]);
      log.info("FastAPI and dependencies installed successfully");
      updateLoadingStatus("FastAPI and dependencies installed successfully", 25.5);

      // Install PyTorch
      if (hasNvidiaGpu && cudaAvailable) {
        log.info("Installing PyTorch with CUDA support");
        await spawnAsync(venvPython, ['-m', 'pip', 'install', '--no-cache-dir', 'torch', 'torchvision', 'torchaudio', '--index-url', 'https://download.pytorch.org/whl/cu121']);
      } else {
        log.info("Installing CPU-only PyTorch");
        await spawnAsync(venvPython, ['-m', 'pip', 'install', '--no-cache-dir', 'torch', 'torchvision', 'torchaudio']);
      }
      log.info("PyTorch installed successfully");
      updateLoadingStatus("PyTorch installed successfully", 26.5);

      // Install llama-cpp-python if needed
      if (process.platform === "darwin" || hasNvidiaGpu) {
        await installLlamaCpp(venvPython, hasNvidiaGpu, cudaAvailable);
      }

      return { venvPython, hasNvidiaGpu };
    } catch (error) {
      log.error("Failed to install dependencies", error);
      throw error;
    }
  }

  async function installLlamaCpp(venvPython: string, hasNvidiaGpu: boolean, cudaAvailable: boolean) {
    // Install build dependencies
    await spawnAsync(venvPython, ['-m', 'pip', 'install', 'setuptools', 'wheel', 'scikit-build-core', 'cmake', 'ninja']);
    await spawnAsync(venvPython, ['-m', 'pip', 'install', 'typing-extensions', 'numpy', 'diskcache', 'msgpack']);

    if (hasNvidiaGpu && cudaAvailable) {
      process.env.CMAKE_ARGS = "-DGGML_CUDA=ON";
      process.env.FORCE_CMAKE = "1";
      process.env.LLAMA_CUDA = "1";
      process.env.GGML_CUDA_FORCE_MMQ = "1";
      process.env.GGML_CUDA_F16 = "1";
      process.env.GGML_CUDA_ENABLE_UNIFIED_MEMORY = "1";

      log.info("Installing llama-cpp-python with CUDA support");
      await spawnAsync(venvPython, ['-m', 'pip', 'install', '--no-cache-dir', '--verbose', 'llama-cpp-python'], {
        env: {
          ...process.env,
          FORCE_CMAKE: "1",
          CMAKE_ARGS: "-DGGML_CUDA=ON",
          LLAMA_CUDA: "1",
          VERBOSE: "1",
          CMAKE_BUILD_PARALLEL_LEVEL: "8",
        }
      });
    } else {
      log.info("Installing CPU-only llama-cpp-python");
      await spawnAsync(venvPython, ['-m', 'pip', 'install', '--no-cache-dir', 'llama-cpp-python']);
    }
  }

  // When you reach the dependency installation part, call the new async function:
  return await installDependencies(venvPython, hasNvidiaGpu, cudaAvailable);
}
