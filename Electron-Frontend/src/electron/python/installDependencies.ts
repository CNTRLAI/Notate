import { spawnAsync } from "../helpers/spawnAsync.js";
import log from "electron-log";
import { updateLoadingStatus } from "../loadingWindow.js";
import { installLlamaCpp } from "./installLlamaCpp.js";

export async function installDependencies(
  venvPython: string,
  hasNvidiaGpu: boolean,
  cudaAvailable: boolean
) {
  try {
    // Upgrade pip first
    await spawnAsync(venvPython, ["-m", "pip", "install", "--upgrade", "pip"]);
    log.info("Pip upgraded successfully");
    updateLoadingStatus("Pip upgraded successfully", 14.5);

    // Install wheel and setuptools first with specific versions and no dependencies
    await spawnAsync(venvPython, [
      "-m",
      "pip",
      "install",
      "--no-deps",
      "wheel>=0.42.0",
      "setuptools>=69.0.3",
    ]);
    log.info("Wheel and setuptools installed successfully");
    updateLoadingStatus("Basic build dependencies installed successfully", 15);

    // Install pkg_resources separately (needed for some builds)
    await spawnAsync(venvPython, [
      "-m",
      "pip",
      "install",
      "--no-deps",
      "setuptools>=69.0.3",
      "packaging>=23.2",
    ]);
    log.info("Additional build dependencies installed successfully");

    // Install NumPy with Python 3.12 compatible version
    await spawnAsync(venvPython, [
      "-m",
      "pip",
      "install",
      "numpy>=1.26.0",  // This version supports Python 3.12
      "--no-cache-dir",
    ]);
    log.info("NumPy installed successfully");
    updateLoadingStatus("NumPy installed successfully", 15.5);

    // Install llvmlite and numba before whisper
    await spawnAsync(venvPython, [
      "-m",
      "pip",
      "install",
      "--no-cache-dir",
      "llvmlite>=0.42.0",  // Python 3.12 compatible version
      "numba>=0.59.0",     // Python 3.12 compatible version
    ]);
    log.info("Numba and llvmlite installed successfully");

    // Install FastAPI and dependencies with build isolation disabled
    const fastApiDeps =
      process.platform === "darwin"
        ? [
            "fastapi==0.115.6",
            "pydantic>=2.9.0,<3.0.0",
            "uvicorn[standard]==0.27.0",
            "PyJWT==2.10.1",
          ]
        : [
            "fastapi>=0.115.6",
            "pydantic>=2.5.0",
            "uvicorn[standard]>=0.27.0",
            "PyJWT==2.10.1",
          ];

    await spawnAsync(venvPython, [
      "-m",
      "pip",
      "install",
      "--no-cache-dir",
      ...fastApiDeps,
    ]);
    log.info("FastAPI and dependencies installed successfully");
    updateLoadingStatus("FastAPI and dependencies installed successfully", 16.5);

    // Install PyTorch
    if (hasNvidiaGpu && cudaAvailable) {
      log.info("Installing PyTorch with CUDA support");
      await spawnAsync(venvPython, [
        "-m",
        "pip",
        "install",
        "--no-cache-dir",
        "torch",
        "torchvision",
        "torchaudio",
        "--index-url",
        "https://download.pytorch.org/whl/cu121",
      ]);
    } else {
      log.info("Installing CPU-only PyTorch");
      await spawnAsync(venvPython, [
        "-m",
        "pip",
        "install",
        "--no-cache-dir",
        "torch",
        "torchvision",
        "torchaudio",
        "--index-url",
        "https://download.pytorch.org/whl/cpu",
      ]);
    }
    log.info("PyTorch installed successfully");
    updateLoadingStatus("PyTorch installed successfully", 20.5);

    // Install transformers and related packages
    await spawnAsync(venvPython, [
      "-m",
      "pip",
      "install",
      "--no-cache-dir",
      "transformers==4.48.0",
      "sentence-transformers==3.3.1",
    ]);
    log.info("Transformers installed successfully");
    updateLoadingStatus("Transformers installed successfully", 21.5);

    await installLlamaCpp(venvPython, hasNvidiaGpu, cudaAvailable);

    updateLoadingStatus("Dependencies installed successfully", 30.5);
    return { venvPython, hasNvidiaGpu };
  } catch (error) {
    log.error("Failed to install dependencies", error);
    throw error;
  }
}
