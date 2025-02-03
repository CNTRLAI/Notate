import { SystemSpecs } from "../types/sysSpecs";

export const fetchSystemSpecs = async (
  setSystemSpecs: React.Dispatch<React.SetStateAction<SystemSpecs>>
) => {
  try {
    const mockData = {
      totalVRAM: 16384,
      totalStorage: 1000000,
      cpuModel: "Intel Core i7-9700K",
    };
    setSystemSpecs(mockData);
    /*  const { cpu, vram, GPU_Manufacturer } = await window.electron.systemSpecs(); */
  } catch (error) {
    console.error("Error fetching system specs:", error);
    setSystemSpecs({
      totalVRAM: 0,
      totalStorage: 0,
      cpuModel: "Unknown",
    });
  }
};
