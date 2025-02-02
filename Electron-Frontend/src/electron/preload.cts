const electron = require("electron");

// Set higher max listeners limit for IPC events
electron.ipcRenderer.setMaxListeners(20);

type IpcCallback<T> = (event: Electron.IpcRendererEvent, payload: T) => void;

electron.contextBridge.exposeInMainWorld("electron", {
  subscribeStatistics: (callback) =>
    ipcOn("statistics", (_, stats) => {
      callback(stats);
    }),
  getStaticData: () => ipcInvoke("getStaticData"),
  subscribeChangeView: (callback) =>
    ipcOn("changeView", (_, view) => {
      callback(view);
    }),
  subscribeResetUserState: (callback) =>
    ipcOn("resetUserState", () => {
      callback();
    }),
  pullModel: async (model: string) => {
    await ipcInvoke("pullModel", { model });
  },
  openDirectory: () => ipcInvoke("openDirectory"),
  deleteCollection: (
    collectionId: number,
    collectionName: string,
    userId: number
  ) =>
    ipcInvoke("deleteCollection", {
      userId,
      id: collectionId,
      collectionName,
    }).then((response) => ({
      collectionId: response.id,
      collectionName: response.collectionName,
      userId: response.userId,
    })),
  openDevTools: () => ipcSend("openDevTools"),
  sendFrameAction: (payload) => ipcSend("frameWindowAction", payload),
  resizeWindow: (width, height) => ipcSend("resizeWindow", { width, height }),
  setApiKey: (apiKey) => ipcInvoke("setApiKey", { success: true, apiKey }),
  runOllama: (model: string, user: User) =>
    ipcInvoke("runOllama", {
      model,
      user,
    }) as unknown as Promise<{
      success: boolean;
      error?: string;
    }>,
  chatRequest: (
    messages,
    activeUser,
    conversationId,
    collectionId,
    title,
    requestId
  ) =>
    ipcInvoke("chatRequest", {
      messages,
      activeUser,
      conversationId,
      collectionId,
      title,
      requestId: requestId || Date.now(),
    }) as unknown as Promise<{
      messages: Message[];
      id: bigint | number;
      title: string;
    }>,
  cancelWebcrawl: (userId: number) =>
    ipcInvoke("cancelWebcrawl", { userId }) as unknown as Promise<{
      userId: number;
      result: boolean;
    }>,
  abortChatRequest: (requestId: number) =>
    ipcSend("abortChatRequest", requestId),
  onMessageChunk: (callback) =>
    ipcOn("messageChunk", (_, chunk) => callback(chunk)),
  offMessageChunk: (callback) =>
    ipcOff("messageChunk", (_, chunk) => callback(chunk)),
  onStreamEnd: (callback) => ipcOn("streamEnd", () => callback()),
  offStreamEnd: (callback) => ipcOff("streamEnd", () => callback()),
  getUsers: () => ipcInvoke("getUsers"),
  addUser: (name: string) =>
    ipcInvoke("addUser", { name }) as Promise<{
      name: string;
      error?: string;
    }>,
  updateUserSettings: (userSettings: UserSettings) =>
    ipcInvoke(
      "updateUserSettings",
      userSettings
    ) as unknown as Promise<UserSettings>,
  getUserSettings: (userId: number) =>
    ipcInvoke("getUserSettings", {
      userId,
    }) as unknown as Promise<UserSettings>,
  getUserPrompts: (userId: number) =>
    ipcInvoke("getUserPrompts", { userId }) as unknown as Promise<{
      prompts: UserPrompts[];
    }>,
  getConversationMessages: (userId: number, conversationId: number) =>
    ipcInvoke("getConversationMessages", {
      userId,
      conversationId,
    }) as unknown as Promise<{ messages: Message[] }>,
  getUserConversations: (userId: number) =>
    ipcInvoke("getUserConversations", { userId }) as unknown as Promise<{
      conversations: Conversation[];
    }>,
  addUserPrompt: (userId: number, name: string, prompt: string) =>
    ipcInvoke("addUserPrompt", {
      userId,
      name,
      prompt,
    }) as Promise<UserPrompts>,
  updateUserPrompt: (
    userId: number,
    id: number,
    name: string,
    prompt: string
  ) => ipcInvoke("updateUserPrompt", { userId, id, name, prompt }),
  addAPIKey: (userId: number, key: string, provider: string) =>
    ipcInvoke("addAPIKey", { userId, key, provider }),
  youtubeIngest: (
    url: string,
    userId: number,
    userName: string,
    collectionId: number,
    collectionName: string
  ) =>
    ipcInvoke("youtubeIngest", {
      url,
      userId,
      userName,
      collectionId,
      collectionName,
    }),
  createCollection: (
    userId: number,
    name: string,
    description: string,
    type: string,
    isLocal: boolean,
    localEmbeddingModel: string
  ) =>
    ipcInvoke("createCollection", {
      userId,
      name,
      description,
      type,
      isLocal,
      localEmbeddingModel,
    }) as unknown as Promise<{
      id: number;
      name: string;
      description: string;
      type: string;
    }>,
  getDirModels: (dirPath: string) =>
    ipcInvoke("getDirModels", { dirPath }) as unknown as Promise<{
      dirPath: string;
      models: Model[];
    }>,
  getOpenRouterModel: (userId: number) =>
    ipcInvoke("getOpenRouterModel", { userId }) as unknown as Promise<{
      model: string;
    }>,
  downloadModel: (payload: {
    modelId: string;
    dirPath: string;
    hfToken?: string;
  }) => ipcInvoke("downloadModel", payload) as unknown as Promise<void>,
  cancelDownload: () =>
    ipcInvoke("cancelDownload") as unknown as Promise<{ success: boolean }>,
  addOpenRouterModel: (userId: number, model: string) =>
    ipcInvoke("addOpenRouterModel", {
      userId,
      model,
    }) as unknown as Promise<void>,
  deleteOpenRouterModel: (userId: number, id: number) =>
    ipcInvoke("deleteOpenRouterModel", {
      userId,
      id,
    }) as unknown as Promise<void>,
  getOpenRouterModels: (userId: number) =>
    ipcInvoke("getOpenRouterModels", { userId }) as unknown as Promise<{
      models: string[];
    }>,
  webcrawl: async (payload: {
    base_url: string;
    user_id: number;
    user_name: string;
    collection_id: number;
    collection_name: string;
    max_workers: number;
  }) => {
    try {
      const result = await ipcInvoke("webcrawl", payload);
      return {
        ...result,
        status: "success",
      } as {
        base_url: string;
        user_id: number;
        user_name: string;
        collection_id: number;
        collection_name: string;
        max_workers: number;
        status: string;
      };
    } catch (error) {
      console.error("Error in webcrawl:", error);
      throw error;
    }
  },
  loadModel: (payload: {
    model_location: string;
    model_name: string;
    model_type?: string;
    user_id: number;
  }) => ipcInvoke("loadModel", payload) as unknown as Promise<void>,
  fetchOllamaModels: () =>
    ipcInvoke("fetchOllamaModels") as unknown as Promise<{
      models: OllamaModel[];
    }>,
  changeUser: () => ipcInvoke("changeUser"),
  quit: () => ipcInvoke("quit"),
  undo: () => ipcInvoke("undo"),
  redo: () => ipcInvoke("redo"),
  cut: () => ipcInvoke("cut"),
  copy: () => ipcInvoke("copy"),
  paste: () => ipcInvoke("paste"),
  delete: () => ipcInvoke("delete"),
  selectAll: () => ipcInvoke("selectAll"),
  print: () => ipcInvoke("print"),
  chat: () => ipcInvoke("chat"),
  history: () => ipcInvoke("history"),
  getUserCollections: (userId: number) =>
    ipcInvoke("getUserCollections", { userId }) as unknown as Promise<{
      collections: Collection[];
    }>,
  vectorstoreQuery: (
    userId: number,
    userName: string,
    collectionId: number,
    collectionName: string,
    query: string,
    conversationId: number
  ) =>
    ipcInvoke("vectorstoreQuery", {
      userId,
      userName,
      collectionId,
      collectionName,
      query,
      conversationId,
    }) as unknown as Promise<{
      results: {
        content: string;
        source: string;
      }[];
      status: string;
      conversationId: number;
    }>,
  checkIfFFMPEGInstalled: () =>
    ipcInvoke("checkIfFFMPEGInstalled") as unknown as Promise<{
      success: boolean;
      message: boolean;
    }>,
  deleteConversation: (userId: number, conversationId: number) =>
    ipcInvoke("deleteConversation", { userId, conversationId }) as Promise<{
      userId: number;
      conversationId: number;
    }>,
  addFileToCollection: (
    userId: number,
    userName: string,
    collectionId: number,
    collectionName: string,
    fileName: string,
    fileContent: string
  ) =>
    ipcInvoke("addFileToCollection", {
      userId,
      userName,
      collectionId,
      collectionName,
      fileName,
      fileContent,
    }) as unknown as Promise<{
      result: {
        success: boolean;
      };
    }>,
  getFilesInCollection: (userId: number, collectionId: number) =>
    ipcInvoke("getFilesInCollection", {
      userId,
      collectionId,
    }) as unknown as Promise<{
      files: string[];
    }>,
  getUserApiKeys: (userId: number) =>
    ipcInvoke("getUserApiKeys", { userId }) as unknown as Promise<{
      apiKeys: ApiKey[];
    }>,
  addUserConversation: (userId: number, input: string) =>
    ipcInvoke("addUserConversation", { userId, input }) as Promise<{
      userId: number;
      input: string;
      id: number;
      title: string;
    }>,
  openCollectionFolder: (filepath: string) =>
    ipcInvoke("openCollectionFolder", { filepath }),
  getConversationMessagesWithData: (userId: number, conversationId: number) =>
    ipcInvoke("getConversationMessagesWithData", {
      userId,
      conversationId,
    }) as unknown as Promise<{ messages: Message[] }>,
  getPlatform: () =>
    ipcInvoke("getPlatform") as unknown as Promise<{
      platform: "win32" | "darwin" | "linux";
    }>,
  keyValidation: ({
    apiKey,
    inputProvider,
  }: {
    apiKey: string;
    inputProvider: string;
  }) =>
    ipcInvoke("keyValidation", { apiKey, inputProvider }) as Promise<{
      error?: string;
      success?: boolean;
    }>,
  on: (
    channel: "ingest-progress" | "ollama-progress" | "download-model-progress",
    func: (event: Electron.IpcRendererEvent, message: any) => void
  ) => electron.ipcRenderer.on(channel, func),
  removeListener: (
    channel: "ingest-progress" | "ollama-progress" | "download-model-progress",
    func: (event: Electron.IpcRendererEvent, message: any) => void
  ) => electron.ipcRenderer.removeListener(channel, func),
  cancelEmbed: (payload: { userId: number }) =>
    ipcInvoke("cancelEmbed", payload) as unknown as Promise<void>,
  systemSpecs: () =>
    ipcInvoke("systemSpecs") as unknown as Promise<{
      cpu: string;
      vram: string;
      GPU_Manufacturer?: string;
    }>,
  checkOllama: () =>
    ipcInvoke("checkOllama") as unknown as Promise<{
      isOllamaRunning: boolean;
    }>,
  getEmbeddingsModels: () =>
    ipcInvoke("getEmbeddingsModels") as unknown as Promise<{
      models: Model[];
    }>,
  getCustomAPI: (userId: number) =>
    ipcInvoke("getCustomAPI", { userId }) as unknown as Promise<{
      api: {
        id: number;
        user_id: number;
        name: string;
        endpoint: string;
        api_key: string;
        model: string;
      }[];
    }>,
  addCustomAPI: (
    userId: number,
    name: string,
    endpoint: string,
    api_key: string,
    model: string
  ) =>
    ipcInvoke("addCustomAPI", {
      userId,
      name,
      endpoint,
      api_key,
      model,
    }) as unknown as Promise<{ id: number }>,
  deleteCustomAPI: (userId: number, id: number) =>
    ipcInvoke("deleteCustomAPI", { userId, id }) as unknown as Promise<void>,
  websiteFetch: (
    url: string,
    userId: number,
    userName: string,
    collectionId: number,
    collectionName: string
  ) =>
    ipcInvoke("websiteFetch", {
      url,
      userId,
      userName,
      collectionId,
      collectionName,
    }) as unknown as Promise<{
      success: boolean;
      content?: string;
      textContent?: string;
      metadata?: {
        title: string;
        description: string;
        author: string;
        keywords: string;
        ogImage: string;
      };
    }>,
  transcribeAudio: (audioData: ArrayBuffer, userId: number) =>
    ipcInvoke("transcribeAudio", {
      audioData: Buffer.from(audioData),
      userId: userId,
    }) as unknown as Promise<{
      success: boolean;
      filepath?: string;
      error?: string;
    }>,
  onIngestProgress: (
    callback: (event: Electron.IpcRendererEvent, message: any) => void
  ) => electron.ipcRenderer.on("ingest-progress", callback),
  addDevAPIKey: (userId: number, name: string, expiration: string | null) =>
    ipcInvoke("addDevAPIKey", {
      userId,
      name,
      expiration,
    }) as unknown as Promise<Keys>,
  getDevAPIKeys: (userId: number) =>
    ipcInvoke("getDevAPIKeys", { userId }) as unknown as Promise<{
      keys: Keys[];
    }>,
  deleteDevAPIKey: (userId: number, id: number) =>
    ipcInvoke("deleteDevAPIKey", { userId, id }) as unknown as Promise<{
      userId: number;
      id: number;
      result: boolean;
    }>,
  getUserCollectionFiles: (userId: number, userName: string) =>
    ipcInvoke("getUserCollectionFiles", {
      userId,
      userName,
    }) as unknown as Promise<{
      files: string[];
    }>,
  removeFileorFolder: (userId: number, userName: string, file: string) =>
    ipcInvoke("removeFileorFolder", { userId, userName, file }).then(
      (result) => ({
        ...result,
        success: true,
      })
    ) as unknown as Promise<{
      userId: number;
      userName: string;
      file: string;
      success: boolean;
    }>,
  renameFile: (
    userId: number,
    userName: string,
    file: string,
    newName: string
  ) =>
    ipcInvoke("renameFile", {
      userId,
      userName,
      file,
      newName,
      success: true,
    }) as Promise<{
      userId: number;
      userName: string;
      file: string;
      newName: string;
      success: boolean;
    }>,
  openCollectionFolderFromFileExplorer: (filepath: string) =>
    ipcInvoke("openCollectionFolderFromFileExplorer", { filepath }) as Promise<{
      filepath: string;
    }>,
  getModelInfo: (payload: {
    model_location: string;
    model_name: string;
    model_type?: string;
    user_id: number;
  }) =>
    ipcInvoke("getModelInfo", payload) as unknown as Promise<{
      model_info: Model;
    }>,
  unloadModel: (payload: {
    model_location: string;
    model_name: string;
    model_type?: string;
    user_id: number;
  }) => ipcInvoke("unloadModel", payload) as unknown as Promise<void>,
  deleteAzureOpenAIModel: (userId: number, id: number) =>
    ipcInvoke("deleteAzureOpenAIModel", { userId, id }) as unknown as Promise<{
      userId: number;
      id: number;
      success: boolean;
    }>,
  getAzureOpenAIModels: (userId: number) =>
    ipcInvoke("getAzureOpenAIModels", { userId }) as unknown as Promise<{
      models: {
        id: number;
        name: string;
        model: string;
        endpoint: string;
        api_key: string;
      }[];
    }>,
  getCustomAPIs: (userId: number) =>
    ipcInvoke("getCustomAPIs", { userId }) as unknown as Promise<{
      api: {
        id: number;
        user_id: number;
        name: string;
        endpoint: string;
        api_key: string;
      }[];
    }>,
  getAzureOpenAIModel: (userId: number, id: number) =>
    ipcInvoke("getAzureOpenAIModel", { userId, id }) as unknown as Promise<{
      id: number;
      name: string;
      model: string;
      endpoint: string;
      api_key: string;
    }>,
  addAzureOpenAIModel: (
    userId: number,
    name: string,
    model: string,
    endpoint: string,
    api_key: string
  ) =>
    ipcInvoke("addAzureOpenAIModel", {
      userId,
      name,
      model,
      endpoint,
      api_key,
    }) as unknown as Promise<{
      id: number;
    }>,
  getCustomModels: (userId: number) =>
    ipcInvoke("getCustomModels", { userId }) as unknown as Promise<{
      models: {
        id: number;
        user_id: number;
        name: string;
        endpoint: string;
        api_key: string;
        model: string;
      }[];
    }>,
  getModelsPath: () => ipcInvoke("getModelsPath") as unknown as Promise<string>,
  getUserTools: (userId: number) =>
    ipcInvoke("getUserTools", { userId }) as unknown as Promise<{
      tools: {
        id: number;
        name: string;
        description: string;
        enabled: number;
        docked: number;
      }[];
    }>,
  addUserTool: (
    userId: number,
    toolId: number,
    enabled: number,
    docked: number
  ) =>
    ipcInvoke("addUserTool", {
      userId,
      toolId,
      enabled,
      docked,
    }) as unknown as Promise<{
      result: number;
    }>,
  removeUserTool: (userId: number, toolId: number) =>
    ipcInvoke("removeUserTool", { userId, toolId }) as unknown as Promise<{
      result: boolean;
    }>,
  updateUserTool: (
    userId: number,
    toolId: number,
    enabled: number,
    docked: number
  ) =>
    ipcInvoke("updateUserTool", {
      userId,
      toolId,
      enabled,
      docked,
    }) as unknown as Promise<{
      result: boolean;
    }>,
  getTools: () =>
    ipcInvoke("getTools") as unknown as Promise<{
      tools: {
        id: number;
        name: string;
        description: string;
      }[];
    }>,
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload?: EventPayloadMapping[Key]
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, payload);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: IpcCallback<EventPayloadMapping[Key]>
) {
  electron.ipcRenderer.on(key, callback);
  return () => electron.ipcRenderer.off(key, callback);
}

function ipcOff<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: IpcCallback<EventPayloadMapping[Key]>
) {
  electron.ipcRenderer.off(key, callback);
}

function ipcSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload?: EventPayloadMapping[Key]
) {
  electron.ipcRenderer.send(key, payload);
}