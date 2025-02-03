import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: Date | string): string {
  const date = input instanceof Date ? input : new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date input");
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}

export async function sanitizeStoreName(name: string) {
  return name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
    .replace(/_+/g, "_")
    .toLowerCase();
}

export const getYouTubeLink = (source: string, startTime?: number) => {
  if (!source.includes("youtube.com") && !source.includes("youtu.be"))
    return source;

  // Remove any existing timestamp
  const cleanUrl = source.replace(/[&?]t=\d+s?/, "");

  // If there's a timestamp, add it to the URL
  if (startTime) {
    if (cleanUrl.includes("?")) {
      return `${cleanUrl}&t=${Math.floor(startTime)}`;
    }
    return `${cleanUrl}?t=${Math.floor(startTime)}`;
  }
  return cleanUrl;
};

export const formatTimestamp = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const getFileName = (source: string) => {
  try {
    return source.split("/").pop();
  } catch (error) {
    console.error(error);
    return source;
  }
};

export const processFiles = (
  files: string | { files: string } | string[] | unknown
): string[] => {
  if (typeof files === "string") {
    return files.split(",").filter(Boolean);
  }
  if (
    typeof files === "object" &&
    files !== null &&
    "files" in files &&
    typeof files.files === "string"
  ) {
    return files.files.split(",").filter(Boolean);
  }
  if (Array.isArray(files)) {
    return files;
  }
  return [];
};
