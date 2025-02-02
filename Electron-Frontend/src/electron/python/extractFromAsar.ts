import fs from "fs";
import path from "path";
import log from "electron-log";
import { app } from "electron";

export function extractFromAsar(sourcePath: string, destPath: string) {
  const basePath = app.isPackaged ? process.resourcesPath : app.getAppPath();
  const resolvedSourcePath = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.join(basePath, sourcePath);
  const resolvedDestPath = path.isAbsolute(destPath)
    ? destPath
    : path.join(basePath, destPath);

  log.info(`Base path: ${basePath}`);
  log.info(`Extracting from ${resolvedSourcePath} to ${resolvedDestPath}`);
  try {
    if (!fs.existsSync(resolvedSourcePath)) {
      throw new Error(`Source path does not exist: ${resolvedSourcePath}`);
    }
    if (!fs.existsSync(resolvedDestPath)) {
      log.info(`Creating directory: ${resolvedDestPath}`);
      fs.mkdirSync(resolvedDestPath, { recursive: true });
    }

    const files = fs.readdirSync(resolvedSourcePath);
    log.info(`Files in source: ${files.join(", ")}`);
    files.forEach((file) => {
      const fullSourcePath = path.join(resolvedSourcePath, file);
      const fullDestPath = path.join(resolvedDestPath, file);

      if (fs.statSync(fullSourcePath).isDirectory()) {
        log.info(`Extracting directory: ${file}`);
        extractFromAsar(fullSourcePath, fullDestPath);
      } else {
        log.info(`Copying file: ${file}`);
        fs.copyFileSync(fullSourcePath, fullDestPath);
      }
    });
    log.info(`Extraction completed for ${resolvedSourcePath}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      log.error(`Error in extractFromAsar: ${error.message}`);
      log.error(`Stack trace: ${error.stack}`);
    } else {
      log.error(`Unknown error in extractFromAsar: ${error}`);
    }
    throw error;
  }
}
