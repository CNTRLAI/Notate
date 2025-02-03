"use client";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { toast } from "@/src/hooks/use-toast";
import { useUser } from "./useUser";
import { LibraryContextType } from "@/src/types/ContextTypes/LibraryContextTypes";
import { Collection } from "../types/collection";
import { Model } from "../types/Models";
import { ProgressData } from "../types/progress";
import {
  getFilesInCollection,
  deleteCollection,
  getCollections,
} from "@/src/data/collections";
import { addFileToCollection } from "../lib/actions/storage/newFile";
import { cancelEmbed } from "../lib/actions/embedding/cancelEmbed";
const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { activeUser } = useUser();
  const [openLibrary, setOpenLibrary] = useState<boolean>(false);
  const [openAddToCollection, setOpenAddToCollection] =
    useState<boolean>(false);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [userCollections, setUserCollections] = useState<Collection[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [fileExpanded, setFileExpanded] = useState(false);
  const [link, setLink] = useState("");
  const [showAddStore, setShowAddStore] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLinkType, setSelectedLinkType] = useState<
    "website" | "youtube" | "crawl" | "documentation" | null
  >(null);
  const [embeddingModels, setEmbeddingModels] = useState<Model[]>([]);
  const loadFiles = useCallback(async () => {
    if (!activeUser?.id || !activeUser?.name || !selectedCollection?.id) return;
    const fileList = await getFilesInCollection(selectedCollection.id);
    setFiles(fileList?.split(",").filter(Boolean) || []);
  }, [activeUser?.id, selectedCollection?.id, activeUser?.name, setFiles]);
  const handleCancelEmbed = async () => {
    try {
      if (!activeUser?.id) return;
      await cancelEmbed({ userId: Number(activeUser.id) });
      setProgressMessage("Embedding cancelled");
      setProgress(0);
      setShowUpload(false);
    } catch (error) {
      console.error("Error cancelling embed:", error);
    }
  };

  const handleDeleteCollection = async () => {
    if (!activeUser?.id || !selectedCollection?.id || !setShowUpload) return;
    setShowUpload(false);
    await deleteCollection(selectedCollection.id);
    setUserCollections(
      [...userCollections].filter((c) => c.id !== selectedCollection.id)
    );
    setSelectedCollection(null);
  };
  const handleProgressData = (data: ProgressData) => {
    setShowProgress(true);
    if ("type" in data) {
      switch (data.type) {
        case "start":
          setProgressMessage(data.message || "Starting web crawl...");
          setProgress(0);
          break;
        case "progress":
          if (data.current && data.total) {
            const percentage = Math.floor((data.current / data.total) * 100);
            setProgress(percentage);
            setProgressMessage(
              `Processing URL ${data.current} of ${data.total}`
            );
          }
          break;
        case "processing":
          if (data.url) {
            setProgressMessage(`Processing: ${data.url}`);
          }
          break;
        case "saved":
          if (data.url) {
            setProgressMessage(`Saved: ${data.url}`);
          }
          break;
        case "links":
          if (data.count && data.url) {
            setProgressMessage(
              `Found ${data.count} new links from: ${data.url}`
            );
          }
          break;
        case "embedding_start":
          setProgressMessage(data.message || "Starting embedding process...");
          break;
        case "embedding_progress":
          if (data.current_batch && data.total_batches) {
            const percentage = Math.floor(
              (data.current_batch / data.total_batches) * 100
            );
            setProgress(percentage);
            setProgressMessage(
              `Processing batch ${data.current_batch}/${data.total_batches}`
            );
          }
          break;
        case "error":
          setProgressMessage(`Error: ${data.message || "Unknown error"}`);
          setProgress(0);
          break;
        case "complete":
          setProgress(100);
          setProgressMessage(data.message || "Web crawl completed!");
          break;
      }
    } else if ("status" in data) {
      if (data.status === "progress" && data.data) {
        const { message, chunk, total_chunks, percent_complete } = data.data;
        if (message) setProgressMessage(message);
        if (chunk && total_chunks) {
          const percentage = Math.floor((chunk / total_chunks) * 100);
          setProgress(percentage);
        } else if (percent_complete) {
          const percentage = parseFloat(percent_complete.replace("%", ""));
          setProgress(percentage);
        }
      } else if (data.status === "error" && data.data?.message) {
        setProgressMessage(`Error: ${data.data.message}`);
        setProgress(0);
      }
    }
  };
  const fetchCollections = async () => {
    if (activeUser) {
      const fetchedCollections = await getCollections(Number(activeUser.id));
      setUserCollections(
        fetchedCollections.map((c) => ({
          ...c,
          userId: c.user_id,
        })) as Collection[]
      );
    }
  };

  const fetchFilesInCollection = useCallback(async () => {
    if (activeUser && selectedCollection) {
      const files = await getFilesInCollection(selectedCollection.id);
      setFiles(files?.split(",").filter(Boolean) || []);
    }
  }, [activeUser, selectedCollection]);

  const handleUpload = useCallback(async () => {
    if (!activeUser?.id || !selectedCollection?.id || !selectedFile) return;

    try {
      setIngesting(true);
      setShowProgress(true);
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result;
        if (typeof content !== "string") return;

        const result = await addFileToCollection(
          Number(activeUser.id),
          activeUser.name || "",
          selectedCollection.id,
          selectedCollection.name,
          selectedFile.name,
          content
        );

        if (result.success) {
          setSelectedFile(null);
          setProgressMessage("");
          setProgress(0);
          setShowProgress(false);
          loadFiles();
          setIngesting(false);
        } else {
          toast({
            title: "Error",
            description: "Check your OPENAI API keys and try again",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      setShowProgress(false);
      setProgressMessage("");
      setIngesting(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [
    activeUser?.id,
    activeUser?.name,
    selectedCollection?.id,
    selectedCollection?.name,
    selectedFile,
    loadFiles,
    setProgressMessage,
    setShowProgress,
    setProgress,
    setIngesting,
    setSelectedFile,
  ]);

  useEffect(() => {
    fetchFilesInCollection();
  }, [fetchFilesInCollection]);

  useEffect(() => {
    const updateState = (msg: string, prog: number) => {
      setProgressMessage(msg);
      setProgress(prog);
    };

    let eventSource: EventSource | null = null;

    if (ingesting) {
      // Create EventSource when ingesting starts
      eventSource = new EventSource("/api/progress");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setShowProgress(true);

          if (data.type === "progress") {
            updateState(data.message, data.progress);
          } else if (data.type === "complete") {
            updateState(data.message || "Complete", 100);
            // Close the connection when complete
            eventSource?.close();
          } else if (data.type === "error") {
            updateState(data.message || "Error occurred", 0);
            eventSource?.close();
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        eventSource?.close();
        setShowProgress(false);
      };
    }

    // Cleanup function
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [ingesting, setProgressMessage, setProgress, setShowProgress]);

  return (
    <LibraryContext.Provider
      value={{
        files,
        setFiles,
        loadFiles,
        handleCancelEmbed,
        handleProgressData,
        showProgress,
        showUpload,
        progressMessage,
        progress,
        openLibrary,
        setOpenLibrary,
        openAddToCollection,
        setOpenAddToCollection,
        fetchCollections,
        ingesting,
        setIngesting,
        userCollections,
        setUserCollections,
        selectedCollection,
        setSelectedCollection,
        fileExpanded,
        setFileExpanded,
        link,
        setLink,
        selectedFile,
        setSelectedFile,
        selectedLinkType,
        setSelectedLinkType,
        showAddStore,
        setShowAddStore,
        setShowUpload,
        setProgressMessage,
        setProgress,
        setEmbeddingModels,
        setShowProgress,
        handleUpload,
        handleDeleteCollection,
        embeddingModels,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export { LibraryProvider, LibraryContext };
