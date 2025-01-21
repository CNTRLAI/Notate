import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { app } from "electron";
import { isDev } from "./util.js";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
  db: Database.Database;

  constructor() {
    let dbPath: string;
    if (isDev()) {
      dbPath = path.join(__dirname, "..", "..", "Database", "database.sqlite");
    } else {
      const userDataPath = app.getPath("userData");
      dbPath = path.join(userDataPath, "Database", "database.sqlite");
    }
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath, {});
  }

  initializeDBTables = () => {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
  
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          model TEXT,
          promptId INTEGER,
          temperature FLOAT,
          provider TEXT,
          maxTokens INTEGER,
          vectorstore TEXT,
          modelDirectory TEXT,
          modelType TEXT,
          modelLocation TEXT,
          ollamaIntegration INTEGER DEFAULT 0,
          ollamaModel TEXT,
          baseUrl TEXT,
          selectedAzureId INTEGER,
          selectedCustomId INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS openrouter_models (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          model TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS azure_openai_models (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          model TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          api_key TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_api (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          api_key TEXT NOT NULL,
          model TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
          
        CREATE TABLE IF NOT EXISTS api_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          key TEXT NOT NULL,
          provider TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS prompts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT,
          prompt TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          title TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
  
        CREATE TABLE IF NOT EXISTS collections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT,
          description TEXT,
          is_local BOOLEAN DEFAULT FALSE,
          local_embedding_model TEXT,
          type TEXT,
          files TEXT, 
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER,
          user_id INTEGER,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          is_retrieval BOOLEAN DEFAULT FALSE,
          collection_id INTEGER,
          data_id INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
          FOREIGN KEY (data_id) REFERENCES retrieved_data(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS retrieved_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id INTEGER UNIQUE,
          data_content TEXT NOT NULL,
          FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS dev_api_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          user_id INTEGER,
          key TEXT NOT NULL,
          expiration DATETIME DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log("Database initialized successfully");
      this.migrateSettingsTable();
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  };
  migrateSettingsTable = () => {
    try {
      // Check if old columns exist
      const tableInfo = this.db
        .prepare("PRAGMA table_info(settings)")
        .all() as { name: string; type: string }[];

      const hasOldSchema = tableInfo.some(
        (col) => col.name === "key" || col.name === "value"
      );

      if (hasOldSchema) {
        // Create new table with correct schema
        this.db.exec(`
          CREATE TABLE settings_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            model TEXT,
            promptId INTEGER,
            temperature FLOAT,
            provider TEXT,
            maxTokens INTEGER,
            vectorstore TEXT,
            modelDirectory TEXT,
            modelType TEXT,
            modelLocation TEXT,
            ollamaIntegration INTEGER,
            ollamaModel TEXT,
            baseUrl TEXT,
            selectedAzureId INTEGER,
            selectedCustomId INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          -- Copy existing data with correct types
          INSERT INTO settings_new (
            id, user_id, model, promptId, temperature, provider, maxTokens,
            vectorstore, modelDirectory, modelType, modelLocation,
            ollamaIntergration, ollamaModel, baseUrl, selectedAzureId, selectedCustomId
          )
          SELECT 
            id, user_id,
            CASE WHEN key = 'model' THEN value ELSE model END,
            CASE WHEN key = 'promptId' THEN CAST(value AS INTEGER) ELSE CAST(promptId AS INTEGER) END,
            CASE WHEN key = 'temperature' THEN CAST(value AS FLOAT) ELSE CAST(temperature AS FLOAT) END,
            CASE WHEN key = 'provider' THEN value ELSE provider END,
            CASE WHEN key = 'maxTokens' THEN CAST(value AS INTEGER) ELSE CAST(maxTokens AS INTEGER) END,
            CASE WHEN key = 'vectorstore' THEN value ELSE vectorstore END,
            CASE WHEN key = 'modelDirectory' THEN value ELSE modelDirectory END,
            CASE WHEN key = 'modelType' THEN value ELSE modelType END,
            CASE WHEN key = 'modelLocation' THEN value ELSE modelLocation END,
            CASE WHEN key = 'ollamaIntegration' THEN CAST(value AS INTEGER) ELSE CAST(ollamaIntegration AS INTEGER) END,
            CASE WHEN key = 'ollamaModel' THEN value ELSE ollamaModel END,
            CASE WHEN key = 'baseUrl' THEN value ELSE baseUrl END,
            CASE WHEN key = 'selectedAzureId' THEN CAST(value AS INTEGER) ELSE CAST(selectedAzureId AS INTEGER) END,
            CASE WHEN key = 'selectedCustomId' THEN CAST(value AS INTEGER) ELSE CAST(selectedCustomId AS INTEGER) END
          FROM settings;

          -- Drop old table
          DROP TABLE settings;

          -- Rename new table
          ALTER TABLE settings_new RENAME TO settings;
        `);
        console.log("Settings table migrated successfully");
      }
    } catch (error) {
      console.error("Error migrating settings table:", error);
    }
  };

  checkAndAddMissingColumns = () => {
    try {
      // Get table info for each table
      interface TableInfo {
        name: string;
      }
      const tables = this.db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
        .all() as TableInfo[];

      // Expected schema for each table
      type TableName = keyof typeof expectedColumns;
      const expectedColumns = {
        openrouter_models: ["id", "user_id", "model"],
        azure_openai_models: [
          "id",
          "user_id",
          "name",
          "model",
          "endpoint",
          "api_key",
        ],
        custom_api: ["id", "user_id", "name", "endpoint", "api_key", "model"],
        users: ["id", "name", "created_at"],
        settings: [
          "id",
          "user_id",
          "model",
          "promptId",
          "temperature",
          "provider",
          "maxTokens",
          "vectorstore",
          "modelDirectory",
          "modelType",
          "modelLocation",
          "ollamaIntegration",
          "ollamaModel",
          "baseUrl",
          "selectedAzureId",
          "selectedCustomId",
        ],
        api_keys: ["id", "user_id", "key", "provider", "created_at"],
        prompts: ["id", "user_id", "name", "prompt", "created_at"],
        conversations: ["id", "user_id", "title", "created_at"],
        collections: [
          "id",
          "user_id",
          "name",
          "description",
          "is_local",
          "local_embedding_model",
          "type",
          "files",
          "created_at",
        ],
        messages: [
          "id",
          "conversation_id",
          "user_id",
          "role",
          "content",
          "is_retrieval",
          "collection_id",
          "data_id",
          "timestamp",
        ],
        retrieved_data: ["id", "message_id", "data_content"],
      } as const;

      tables.forEach((table) => {
        const tableName = table.name as TableName;
        if (expectedColumns[tableName]) {
          // Get current columns for the table
          interface ColumnInfo {
            name: string;
            type: string;
          }
          const tableInfo = this.db
            .prepare(`PRAGMA table_info(${tableName})`)
            .all() as ColumnInfo[];
          const currentColumns = tableInfo.map((col) => col.name);

          // Find missing columns
          const missingColumns = expectedColumns[tableName].filter(
            (col) => !currentColumns.includes(col)
          );

          // Add missing columns
          missingColumns.forEach((column) => {
            try {
              let columnDef = "";
              // Define column types based on the original schema
              switch (column) {
                case "id":
                  columnDef = "INTEGER PRIMARY KEY AUTOINCREMENT";
                  break;
                case "created_at":
                case "timestamp":
                  columnDef = "DATETIME DEFAULT CURRENT_TIMESTAMP";
                  break;
                case "is_local":
                case "is_retrieval":
                  columnDef = "BOOLEAN DEFAULT FALSE";
                  break;
                case "user_id":
                case "conversation_id":
                case "collection_id":
                case "data_id":
                case "message_id":
                  columnDef = "INTEGER";
                  break;
                default:
                  columnDef = "TEXT";
              }

              const alterQuery = `ALTER TABLE ${tableName} ADD COLUMN ${column} ${columnDef}`;
              this.db.exec(alterQuery);
            } catch (error) {
              console.error(
                `Error adding column ${column} to table ${tableName}:`,
                error
              );
            }
          });
        }
      });
      console.log("Database columns checked and updated successfully");
    } catch (error) {
      console.error("Error checking and adding columns:", error);
    }
  };

  init() {
    this.initializeDBTables();
    this.checkAndAddMissingColumns();
  }

  getUsers() {
    return this.db.prepare("SELECT * FROM users").all() as {
      id: number;
      name: string;
    }[];
  }

  getUserSettings(userId: string | number): Promise<UserSettings> {
    const settings = this.db
      .prepare("SELECT * FROM settings WHERE user_id = ?")
      .get(userId) as UserSettings;

    return Promise.resolve(settings || {});
  }

  updateUserSettings(
    userId: number,
    key: keyof UserSettings,
    value: string | number | boolean
  ): Promise<UserSettings> {
    const existingSettings = this.db
      .prepare("SELECT * FROM settings WHERE user_id = ?")
      .get(userId);

    if (existingSettings) {
      this.db
        .prepare(`UPDATE settings SET ${key} = ? WHERE user_id = ?`)
        .run(value, userId);
    } else {
      this.db
        .prepare(`INSERT INTO settings (user_id, ${key}) VALUES (?, ?)`)
        .run(userId, value);
    }

    return this.getUserSettings(userId);
  }

  getUserPrompts(userId: number) {
    const prompts = this.db
      .prepare("SELECT * FROM prompts WHERE user_id = ?")
      .all(userId);
    return prompts as UserPrompts[];
  }

  addUserPrompt(
    userId: number,
    name: string,
    prompt: string
  ): {
    id: number;
    name: string;
    prompt: string;
    userId: number;
  } {
    const result = this.db
      .prepare("INSERT INTO prompts (user_id, name, prompt) VALUES (?, ?, ?)")
      .run(userId, name, prompt);
    return {
      id: result.lastInsertRowid as number,
      name,
      prompt,
      userId,
    };
  }

  addAPIKey(userId: number, key: string, provider: string) {
    const existingKey = this.db
      .prepare("SELECT * FROM api_keys WHERE user_id = ? AND provider = ?")
      .get(userId, provider) as { id: number };
    if (existingKey) {
      return this.db
        .prepare("UPDATE api_keys SET key = ? WHERE id = ?")
        .run(key, existingKey.id);
    } else {
      return this.db
        .prepare(
          "INSERT INTO api_keys (user_id, key, provider) VALUES (?, ?, ?)"
        )
        .run(userId, key, provider);
    }
  }

  updateUserPrompt(userId: number, id: number, name: string, prompt: string) {
    return this.db
      .prepare(
        "UPDATE prompts SET name = ?, prompt = ? WHERE id = ? AND user_id = ?"
      )
      .run(name, prompt, id, userId);
  }

  isCollectionLocal(collectionId: number): boolean {
    const collection = this.db
      .prepare("SELECT is_local FROM collections WHERE id = ?")
      .get(collectionId) as { is_local: boolean };
    return collection.is_local;
  }

  getCollectionLocalEmbeddingModel(collectionId: number): string {
    const collection = this.db
      .prepare("SELECT local_embedding_model FROM collections WHERE id = ?")
      .get(collectionId) as { local_embedding_model: string };
    return collection.local_embedding_model;
  }
  createCollection(
    userId: number,
    name: string,
    description: string,
    type: string,
    isLocal: number,
    localEmbeddingModel: string
  ) {
    const checkIfExists = this.db
      .prepare("SELECT * FROM collections WHERE user_id = ? AND name = ?")
      .get(userId, name);
    if (checkIfExists) {
      return {
        error: "Collection name already exists",
      };
    }
    const result = this.db
      .prepare(
        "INSERT INTO collections (user_id, name, description, type, is_local, local_embedding_model) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(userId, name, description, type, isLocal, localEmbeddingModel);
    return {
      id: result.lastInsertRowid as number,
      name,
      description,
      type,
      userId,
    };
  }
  addFileToCollection(userId: number, id: number, file: string) {
    const collection = this.db
      .prepare("SELECT * FROM collections WHERE id = ? AND user_id =?")
      .get(id, userId) as Collection;
    if (collection) {
      // files is a string and needs to be split into an array
      const files = collection.files ? collection.files.split(",") : [];
      files.push(file);
      return this.db
        .prepare(
          "UPDATE collections SET files = ? WHERE id = ? AND user_id = ?"
        )
        .run(files.join(","), id, userId);
    }
  }

  deleteCollection(userId: number, id: number) {
    return this.db
      .prepare("DELETE FROM collections WHERE id = ? AND user_id = ?")
      .run(id, userId);
  }
  getCollection(collectionId: number) {
    return this.db
      .prepare("SELECT * FROM collections WHERE id = ?")
      .get(collectionId) as Collection;
  }
  getCollectionName(collectionId: number) {
    return this.db
      .prepare("SELECT name FROM collections WHERE id = ?")
      .get(collectionId) as { name: string };
  }
  getFilesInCollection(userId: number, collectionId: number) {
    return this.db
      .prepare("SELECT files FROM collections WHERE id = ? AND user_id = ?")
      .get(collectionId, userId) as { files: string };
  }
  getUserCollections(userId: number) {
    return this.db
      .prepare("SELECT * FROM collections WHERE user_id = ?")
      .all(userId);
  }

  addUser(name: string): { id: number; name: string; error?: string } {
    const existingUser = this.db
      .prepare("SELECT * FROM users WHERE name = ?")
      .get(name);
    if (existingUser) {
      return {
        id: -1,
        name: "",
        error: "User already exists",
      };
    }
    const user = this.db
      .prepare("INSERT INTO users (name) VALUES (?)")
      .run(name);
    const defaultPrompt = "You are a helpful assistant";
    const promptName = "Default Prompt";
    const addDefaultPrompt = this.db
      .prepare("INSERT INTO prompts (user_id, name, prompt) VALUES (?, ?, ?)")
      .run(user.lastInsertRowid, promptName, defaultPrompt);
    const promptId = addDefaultPrompt.lastInsertRowid;
    this.db
      .prepare("INSERT INTO settings (user_id, promptId) VALUES (?, ?)")
      .run(user.lastInsertRowid, promptId);
    return { id: user.lastInsertRowid as number, name };
  }

  getUserApiKeys(userId: number): Promise<ApiKey[]> {
    const apiKeys = this.db
      .prepare("SELECT * FROM api_keys WHERE user_id = ?")
      .all(userId);
    return Promise.resolve(apiKeys as unknown as ApiKey[]);
  }

  getApiKey(userId: number, provider: string): string {
    const apiKey = this.db
      .prepare("SELECT * FROM api_keys WHERE user_id = ? AND provider = ?")
      .get(userId, provider) as { key: string };
    return apiKey.key;
  }

  getUserConversations(userId: number) {
    return this.db
      .prepare("SELECT * FROM conversations WHERE user_id = ?")
      .all(userId);
  }

  getUserConversationTitle(userId: number, conversationId: number) {
    return this.db
      .prepare("SELECT title FROM conversations WHERE id = ? AND user_id =?")
      .get(conversationId, userId) as { title: string };
  }

  addUserConversation(userId: number, title: string) {
    const result = this.db
      .prepare("INSERT INTO conversations (user_id, title) VALUES (?, ?)")
      .run(userId, title);

    return {
      id: result.lastInsertRowid as number,
      title,
      userId,
    };
  }

  deleteUserConversation(userId: number, id: number) {
    return this.db
      .prepare("DELETE FROM conversations WHERE id = ? AND user_id = ?")
      .run(id, userId);
  }

  getConversationMessages(userId: number, conversationId: number) {
    return this.db
      .prepare(
        "SELECT * FROM messages WHERE user_id = ? AND conversation_id = ?"
      )
      .all(userId, conversationId);
  }
  addUserMessage(
    userId: number,
    conversationId: number,
    role: string,
    content: string,
    collectionId?: number,
    dataId?: number
  ) {
    const timestamp = new Date().toISOString();
    return this.db
      .prepare(
        "INSERT INTO messages (user_id, conversation_id, role, content, collection_id, data_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        userId,
        conversationId,
        role,
        content,
        collectionId || null,
        dataId || null,
        timestamp
      );
  }
  deleteUserMessage(userId: number, id: number) {
    return this.db
      .prepare("DELETE FROM messages WHERE id = ? AND user_id = ?")
      .run(id, userId);
  }

  getUserPrompt(userId: number, promptId: number) {
    return this.db
      .prepare("SELECT * FROM prompts WHERE id = ? AND user_id =?")
      .get(promptId, userId) as { prompt: string };
  }
  updateMessageDataId(messageId: number, dataId: number) {
    return this.db
      .prepare("UPDATE messages SET data_id = ? WHERE id = ?")
      .run(dataId, messageId);
  }
  addRetrievedData(messageId: number, data: string): number {
    const result = this.db
      .prepare(
        "INSERT INTO retrieved_data (message_id, data_content) VALUES (?, ?)"
      )
      .run(messageId, data);
    const dataId = result.lastInsertRowid as number;
    this.updateMessageDataId(messageId, dataId);
    return dataId;
  }
  getConversationMessagesWithData(userId: number, conversationId: number) {
    const messages = this.db
      .prepare(
        `
        SELECT m.*, rd.data_content 
        FROM messages m
        LEFT JOIN retrieved_data rd ON m.data_id = rd.id
        WHERE m.user_id = ? AND m.conversation_id = ?
      `
      )
      .all(userId, conversationId);
    return messages;
  }

  addDevAPIKey(
    userId: number,
    name: string,
    key: string,
    expiration: string | null
  ) {
    return this.db
      .prepare(
        "INSERT INTO dev_api_keys (user_id, name, key, expiration) VALUES (?, ?, ?, ?)"
      )
      .run(userId, name, key, expiration);
  }
  getDevAPIKeys(userId: number) {
    return this.db
      .prepare("SELECT * FROM dev_api_keys WHERE user_id = ?")
      .all(userId);
  }
  deleteDevAPIKey(userId: number, id: number) {
    return this.db
      .prepare("DELETE FROM dev_api_keys WHERE id = ? AND user_id = ?")
      .run(id, userId);
  }

  getOpenRouterModel(userId: number) {
    return this.db
      .prepare("SELECT model FROM openrouter_models WHERE user_id = ?")
      .get(userId) as { model: string };
  }
  addOpenRouterModel(userId: number, model: string) {
    const existingModel = this.db
      .prepare(
        "SELECT * FROM openrouter_models WHERE user_id = ? AND model = ?"
      )
      .get(userId, model);
    if (existingModel) {
      return {
        error: "Model already exists",
      };
    }
    return this.db
      .prepare("INSERT INTO openrouter_models (user_id, model) VALUES (?, ?)")
      .run(userId, model);
  }
  deleteOpenRouterModel(userId: number, id: number) {
    return this.db
      .prepare("DELETE FROM openrouter_models WHERE id = ? AND user_id = ?")
      .run(id, userId);
  }
  getOpenRouterModels(userId: number) {
    const rows = this.db
      .prepare("SELECT model FROM openrouter_models WHERE user_id = ?")
      .all(userId) as { model: string }[];
    return rows.map((row) => row.model);
  }

  getAzureOpenAIModels(userId: number) {
    const rows = this.db
      .prepare("SELECT * FROM azure_openai_models WHERE user_id = ?")
      .all(userId) as {
      id: number;
      name: string;
      model: string;
      endpoint: string;
      api_key: string;
    }[];
    return rows;
  }
  addAzureOpenAIModel(
    userId: number,
    name: string,
    model: string,
    endpoint: string,
    api_key: string
  ) {
    const result = this.db
      .prepare(
        "INSERT INTO azure_openai_models (user_id, name, model, endpoint, api_key) VALUES (?, ?, ?, ?, ?)"
      )
      .run(userId, name, model, endpoint, api_key);
    return result.lastInsertRowid as number;
  }
  deleteAzureOpenAIModel(userId: number, id: number) {
    return this.db
      .prepare("DELETE FROM azure_openai_models WHERE id = ? AND user_id = ?")
      .run(id, userId);
  }
  getAzureOpenAIModel(userId: number, id: number) {
    return this.db
      .prepare("SELECT * FROM azure_openai_models WHERE id = ? AND user_id =?")
      .get(id, userId) as {
      name: string;
      model: string;
      endpoint: string;
      api_key: string;
    };
  }
  getCustomAPI(userId: number) {
    return this.db
      .prepare("SELECT * FROM custom_api WHERE user_id = ?")
      .all(userId) as {
      id: number;
      user_id: number;
      name: string;
      endpoint: string;
      api_key: string;
      model: string;
    }[];
  }
  getCustomAPIs(userId: number) {
    return this.db
      .prepare("SELECT * FROM custom_api WHERE user_id = ?")
      .all(userId) as {
      id: number;
      user_id: number;
      name: string;
      endpoint: string;
      api_key: string;
      model: string;
    }[];
  }
  deleteCustomAPI(userId: number, id: number) {
    return this.db
      .prepare("DELETE FROM custom_api WHERE id = ? AND user_id = ?")
      .run(id, userId);
  }
  addCustomAPI(
    userId: number,
    name: string,
    endpoint: string,
    api_key: string,
    model: string
  ) {
    const result = this.db
      .prepare(
        "INSERT INTO custom_api (user_id, name, endpoint, api_key, model) VALUES (?, ?, ?, ?, ?)"
      )
      .run(userId, name, endpoint, api_key, model);
    return result.lastInsertRowid as number;
  }
}

export default new DatabaseService();
