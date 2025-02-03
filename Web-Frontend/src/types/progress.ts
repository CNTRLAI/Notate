export type ProgressData = CustomProgressData | OllamaProgressEvent;

export interface OllamaProgressEvent {
  type: "pull" | "verify";
  output: string;
}

export type CustomProgressData = {
  type?:
    | "info"
    | "progress"
    | "start"
    | "processing"
    | "saved"
    | "links"
    | "embedding_start"
    | "embedding_progress"
    | "complete"
    | "error";
  message?: string;
  chunk?: number;
  totalChunks?: number;
  percent_complete?: string;
  est_remaining_time?: string;
  status?: "success" | "error" | "progress";
  current?: number;
  total?: number;
  url?: string;
  count?: number;
  current_batch?: number;
  total_batches?: number;
  data?: {
    message?: string;
    chunk?: number;
    total_chunks?: number;
    percent_complete?: string;
  };
};

export interface DownloadProgress {
  type: "progress";
  data: DownloadProgressData;
}
export interface DownloadProgressData {
  message: string;
  fileName?: string;
  fileNumber?: number;
  totalFiles?: number;
  fileProgress?: number;
  totalProgress: number;
  currentSize?: string;
  totalSize?: string;
  currentStep?: string;
  speed?: string;
}
export interface DownloadModelProgress {
  type: "progress";
  data: {
    message: string;
    fileName?: string;
    fileNumber?: number;
    totalFiles?: number;
    fileProgress?: number;
    totalProgress: number;
  };
}

export interface PythonProgressData {
  type: string;
  message: string;
  chunk?: number;
  totalChunks?: number;
  percent_complete?: string;
}
