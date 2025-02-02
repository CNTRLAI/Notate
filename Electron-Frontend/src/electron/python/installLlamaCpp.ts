import { spawnAsync } from "../helpers/spawnAsync.js";
import log from "electron-log";
import { ifFedora } from "./ifFedora.js";
import { dialog, shell } from "electron";
import { updateLoadingStatus } from "../loadingWindow.js";

const cudaLoadingMessages = [
  "Herding CUDA llamas into the pen...",
  "Teaching llamas quantum physics...",
  "Boy, these CUDA llamas take forever to train...",
  "Convincing llamas that parallel processing is fun...",
  "Feeding llamas their favorite CUDA treats...",
  "Still working... llamas are notoriously stubborn...",
  "Optimizing llama performance (they're a bit lazy)...",
  "Running llama benchmarks (they're on a coffee break)...",
  "Almost there! Just waking up some sleepy llamas...",
  "Turns out llamas need a lot of CUDA cores...",
  "Negotiating with llamas for better compute rates...",
  "Explaining parallel processing to skeptical llamas...",
  "Llamas are attending their mandatory CUDA training...",
  "Debugging llama logic (they're not very logical)...",
  "Waiting for llamas to finish their GPU meditation...",
  "Converting llama thoughts to tensor operations...",
  "Llamas are studying the CUDA documentation...",
  "Teaching llamas to count in parallel...",
  "Llamas insist on taking another GPU coffee break...",
  "Optimizing llama memory allocation patterns...",
  "Convincing llamas that GPUs aren't scary...",
  "Llamas are doing their morning CUDA yoga...",
  "Synchronizing llama thread schedules...",
  "Llamas are debating quantum superposition...",
  "Installing llama-friendly CUDA drivers...",
  "Waiting for llamas to finish their GPU snack...",
  "Llamas are practicing their parallel humming...",
  "Teaching llamas about memory bandwidth...",
  "Llamas are computing their optimal nap times...",
  "Running anti-spitting protocols on CUDA llamas...",
  "Llamas are calibrating their tensor wool...",
  "Scheduling llama GPU time-sharing meetings...",
  "Defragmenting llama memory banks...",
  "Llamas are reviewing their CUDA certification...",
  "Installing advanced llama parallel-spitting modules...",
  "Llamas are optimizing their cache coherency...",
  "Running llama-approved stress tests on GPU...",
  "Llamas insist on following proper CUDA protocols...",
  "Upgrading llama neural pathways to CUDA spec...",
  "Llamas are performing their GPU diagnostics dance...",
];

let messageInterval: NodeJS.Timeout | null = null;
const usedMessageIndices: Set<number> = new Set();

function getNextMessage(): string {
  // If we've used all messages, reset the tracking
  if (usedMessageIndices.size === cudaLoadingMessages.length) {
    usedMessageIndices.clear();
  }

  // Get available indices that haven't been used
  const availableIndices = Array.from(
    { length: cudaLoadingMessages.length },
    (_, i) => i
  ).filter((i) => !usedMessageIndices.has(i));

  // Select random index from available ones
  const randomIndex = Math.floor(Math.random() * availableIndices.length);
  const selectedIndex = availableIndices[randomIndex];

  // Mark this index as used
  usedMessageIndices.add(selectedIndex);

  return cudaLoadingMessages[selectedIndex];
}

function startRotatingMessages(baseProgress: number) {
  if (messageInterval) clearInterval(messageInterval);

  messageInterval = setInterval(() => {
    updateLoadingStatus(
      "Installing CUDA llama-cpp-python (this may take a while) " +
        getNextMessage(),
      baseProgress
    );
  }, 15000); // Rotate message every 15 seconds
}

function stopRotatingMessages() {
  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
    usedMessageIndices.clear(); // Reset tracking when stopped
  }
}

export async function installLlamaCpp(
  venvPython: string,
  hasNvidiaGpu: boolean,
  cudaAvailable: boolean
) {
  try {
    if (hasNvidiaGpu && cudaAvailable) {
      // Install build dependencies for CUDA
      updateLoadingStatus("Installing build dependencies for CUDA", 22.5);
      await spawnAsync(venvPython, [
        "-m",
        "pip",
        "install",
        "setuptools",
        "wheel",
        "scikit-build-core",
        "cmake",
        "ninja",
      ]);
      updateLoadingStatus(
        "Installing typing-extensions, numpy, diskcache, msgpack",
        23.5
      );
      await spawnAsync(venvPython, [
        "-m",
        "pip",
        "install",
        "typing-extensions",
        "numpy",
        "diskcache",
        "msgpack",
      ]);

      // Check for Fedora and install CUDA toolkit if needed
      await ifFedora();
      updateLoadingStatus("Installing CUDA toolkit for Fedora", 24.5);
      process.env.CMAKE_ARGS = "-DGGML_CUDA=ON";
      process.env.FORCE_CMAKE = "1";
      process.env.LLAMA_CUDA = "1";
      process.env.GGML_CUDA_FORCE_MMQ = "1";
      process.env.GGML_CUDA_F16 = "1";
      process.env.GGML_CUDA_ENABLE_UNIFIED_MEMORY = "1";

      log.info("Installing llama-cpp-python with CUDA support");
      updateLoadingStatus(
        "Installing llama-cpp-python with CUDA support (this may take a while)",
        25.5
      );
      try {
        startRotatingMessages(25.5);
        await spawnAsync(
          venvPython,
          [
            "-m",
            "pip",
            "install",
            "--no-cache-dir",
            "--verbose",
            "llama-cpp-python",
          ],
          {
            env: {
              ...process.env,
              FORCE_CMAKE: "1",
              CMAKE_ARGS: "-DGGML_CUDA=ON",
              LLAMA_CUDA: "1",
              VERBOSE: "1",
              CMAKE_BUILD_PARALLEL_LEVEL: "8",
              NVCC_PREPEND_FLAGS: "-ccbin /usr/bin/g++-13",
            },
          }
        );
        stopRotatingMessages();
        updateLoadingStatus("llama-cpp-python installed successfully", 30.5);
      } catch (error) {
        if (process.platform === "win32") {
          log.error(
            "Failed to install llama-cpp-python with CUDA support",
            error
          );
          updateLoadingStatus(
            "Failed to install llama-cpp-python with CUDA support. Asking user to install CPU version.",
            30.5
          );
          const { response } = await dialog.showMessageBox({
            type: "error",
            title: "CUDA Installation Error",
            message:
              "Failed to install llama-cpp-python with CUDA support. Would you like to proceed with CPU-only version instead?",
            detail:
              "This could be due to missing Visual Studio 2022 with C++ Desktop Development Tools. Would you like to proceed with CPU-only version instead?\n\nNote: You can install Visual Studio and try CUDA installation again later.",
            buttons: [
              "Install CPU Version",
              "Open Visual Studio Download Page",
            ],
            defaultId: 0,
            cancelId: 1,
            noLink: true,
          });
          if (response === 0) {
            log.info(
              "Falling back to CPU-only installation using pre-built wheel"
            );
            updateLoadingStatus(
              "Falling back to CPU-only installation using pre-built wheel",
              31.5
            );
            await spawnAsync(venvPython, [
              "-m",
              "pip",
              "install",
              "--only-binary",
              ":all:",
              "llama-cpp-python",
              "--extra-index-url",
              "https://abetlen.github.io/llama-cpp-python/whl/cpu",
              "--no-cache-dir",
              "--verbose",
            ]);
            updateLoadingStatus("CPU-only installation completed", 32.5);
          } else {
            // Open Visual Studio download page
            await shell.openExternal(
              "https://visualstudio.microsoft.com/vs/community/"
            );
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      // CPU-only installation
      updateLoadingStatus("Installing CPU-only llama-cpp-python", 26.5);
      log.info("Installing CPU-only llama-cpp-python");
      try {
        if (process.platform === "darwin") {
          // On macOS, build from source
          await spawnAsync(venvPython, [
            "-m",
            "pip",
            "install",
            "setuptools",
            "wheel",
            "scikit-build-core",
            "cmake",
            "ninja",
          ]);
          updateLoadingStatus(
            "Installing CPU-only llama-cpp-python (this may take a while)",
            27.5
          );
          await spawnAsync(venvPython, [
            "-m",
            "pip",
            "install",
            "--verbose",
            "--no-cache-dir",
            "llama-cpp-python",
          ]);
          updateLoadingStatus("CPU-only installation completed", 28.5);
        } else {
          // For other platforms, try pre-built wheel first
          await spawnAsync(venvPython, [
            "-m",
            "pip",
            "install",
            "--only-binary",
            ":all:",
            "llama-cpp-python",
            "--extra-index-url",
            "https://abetlen.github.io/llama-cpp-python/whl/cpu",
            "--no-cache-dir",
            "--verbose",
          ]);
          updateLoadingStatus("CPU-only installation completed", 28.5);
        }
      } catch (error) {
        if (process.platform === "win32") {
          log.error("Failed to install llama-cpp-python", error);
          await dialog.showMessageBox({
            type: "error",
            title: "Installation Error",
            message: "Failed to install llama-cpp-python",
            detail:
              "An error occurred while installing the CPU version of llama-cpp-python. Please try again or check your internet connection.",
            buttons: ["OK"],
          });
        }
        throw error;
      }
    }
  } catch (error) {
    log.error("Error during llama-cpp-python installation:", error);
    throw error;
  }
}
