import { spawn } from "child_process";
import log from "electron-log";
import { updateLoadingStatus } from "../loadingWindow.js";

export function spawnAsync(
  command: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv; stdio?: "inherit" | "pipe" } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, options);
    let stdout = "";
    let stderr = "";

    process.stdout?.on("data", (data) => {
      stdout += data.toString();
      log.info(`[Installation Output] ${data.toString().trim()}`);
      updateLoadingStatus(data.toString().trim(), -1);
    });

    process.stderr?.on("data", (data) => {
      stderr += data.toString();
      log.warn(`[Installation Error] ${data.toString().trim()}`);
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(`Process exited with code ${code}\nStderr: ${stderr}`)
        );
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}
