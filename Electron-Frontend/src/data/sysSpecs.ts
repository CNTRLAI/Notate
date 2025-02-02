export type SystemSpecs = {
  cpu: string;
  vram: string;
  GPU_Manufacturer?: string;
};

export const fetchSystemSpecs = async (
  setSystemSpecs: React.Dispatch<React.SetStateAction<SystemSpecs>>
) => {
  try {
    const { cpu, vram, GPU_Manufacturer } = await window.electron.systemSpecs();
    if (!GPU_Manufacturer) {
      setSystemSpecs({ cpu, vram, GPU_Manufacturer: "Unknown" });
    } else {
      setSystemSpecs({ cpu, vram, GPU_Manufacturer });
    }
  } catch (error) {
    console.error("Error fetching system specs:", error);
    setSystemSpecs({
      cpu: "Unknown",
      vram: "Unknown",
      GPU_Manufacturer: "Unknown",
    });
  }
};
