export interface LibraryContextType {
  handleDeleteCollection: () => void;
  files: string[];
  setFiles: React.Dispatch<React.SetStateAction<string[]>>;
  loadFiles: () => Promise<void>;
  handleCancelEmbed: () => Promise<void>;
  handleProgressData: (data: ProgressData) => void;
  showProgress: boolean;
  progressMessage: string;
  progress: number;
  openLibrary: boolean;
  setOpenLibrary: React.Dispatch<React.SetStateAction<boolean>>;
  openAddToCollection: boolean;
  setOpenAddToCollection: React.Dispatch<React.SetStateAction<boolean>>;
  fetchCollections: () => Promise<void>;
  ingesting: boolean;
  setIngesting: React.Dispatch<React.SetStateAction<boolean>>;
  userCollections: Collection[];
  setUserCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  selectedCollection: Collection | null;
  setSelectedCollection: React.Dispatch<
    React.SetStateAction<Collection | null>
  >;
  setEmbeddingModels: React.Dispatch<React.SetStateAction<Model[]>>;
  embeddingModels: Model[];
  showUpload: boolean;
  setShowUpload: React.Dispatch<React.SetStateAction<boolean>>;
  showAddStore: boolean;
  setShowAddStore: React.Dispatch<React.SetStateAction<boolean>>;
  fileExpanded: boolean;
  setFileExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  link: string;
  setLink: React.Dispatch<React.SetStateAction<string>>;
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  selectedLinkType: "website" | "youtube" | "crawl" | "documentation" | null;
  setSelectedLinkType: React.Dispatch<
    React.SetStateAction<
      "website" | "youtube" | "crawl" | "documentation" | null
    >
  >;
  setProgressMessage: React.Dispatch<React.SetStateAction<string>>;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  setShowProgress: React.Dispatch<React.SetStateAction<boolean>>;
  handleUpload: () => Promise<void>;
}
