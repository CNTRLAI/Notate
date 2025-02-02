import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { IngestProgress } from "../IngestProgress";
import { useLibrary } from "@/context/useLibrary";

export function FileTab() {
  const {
    setSelectedFile,
    selectedFile,
    handleUpload,
    ingesting,
  } = useLibrary();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, [setSelectedFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  return (
    <>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-[10px] p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag 'n' drop a file here, or click to select a file
        </p>
      </div>
      {selectedFile && (
        <p className="text-sm text-muted-foreground">
          Selected: {selectedFile.name}
        </p>
      )}
      <IngestProgress />
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || ingesting}
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {ingesting ? (
          <span className="inline-flex items-center">
            <span className="animate-spin h-4 w-4 mr-2">
              <Loader2 className="h-4 w-4" />
            </span>
            Uploading File...
          </span>
        ) : (
          "Upload File"
        )}
      </Button>
    </>
  );
} 