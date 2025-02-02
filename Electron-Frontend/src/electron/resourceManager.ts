import osUtils from "os-utils";
import fs from "fs";
import os from "os";
import { BrowserWindow } from "electron";
import { ipcWebContentsSend } from "./util.js";

const POLLING_INTERVAL = 500;

export function pollResource(mainWindow: BrowserWindow) {
  setInterval(async () => {
    const cpuUsage = await getCpuUsage();
    const memoryUsage = getMemoryUsage();
    const diskUsage = getDiskUsage();
    ipcWebContentsSend("statistics", mainWindow.webContents, {
      cpuUsage,
      memoryUsage,
      storageUsage: diskUsage.usedGB,
    });
  }, POLLING_INTERVAL);
}

function getCpuUsage(): Promise<number> {
  return new Promise<number>((resolve) => {
    osUtils.cpuUsage((cpuUsage) => {
      resolve(cpuUsage);
    });
  });
}

function getMemoryUsage() {
  return osUtils.freememPercentage();
}

function getDiskUsage() {
  const stats = fs.statfsSync(process.platform === "win32" ? "C:\\" : "/");
  const total = stats.bsize * stats.blocks;
  const free = stats.bfree * stats.bsize;
  return {
    totalGB: Math.floor(total / 1_000_000_000),
    usedGB: 1 - free / total,
  };
}

export async function getStaticData(): Promise<StaticData> {
  const totalStorage = getDiskUsage().totalGB;
  const cpuModel = os.cpus()[0].model;
  const totalMemoryGB = Math.floor(osUtils.totalmem() / 1024);
  return { totalStorage, totalMemoryGB, cpuModel };
}
