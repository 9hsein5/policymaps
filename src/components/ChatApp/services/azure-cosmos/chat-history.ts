import { getContainer, isCosmosDBConfigured } from './client';
import { ChatMessage } from '../azure-openai/chat';

// Chat history container ID
const CHAT_HISTORY_CONTAINER = 'chat-history';

// Chat history interface
export interface ChatHistoryRecord {
  id?: string;
  userId: string;
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save chat history to Cosmos DB
 * @param userId User ID
 * @param sessionId Session ID
 * @param messages Array of chat messages
 * @returns The saved chat history record
 */
export const saveChatHistory = async (
  userId: string,
  sessionId: string,
  messages: ChatMessage[]
): Promise<ChatHistoryRecord | null> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Chat history will not be saved.');
    return null;
  }

  try {
    const container = await getContainer(CHAT_HISTORY_CONTAINER);
    
    // Check if session already exists
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.sessionId = @sessionId",
      parameters: [
        { name: "@userId", value: userId },
        { name: "@sessionId", value: sessionId }
      ]
    };
    
    const { resources: existingRecords } = await container.items.query(querySpec).fetchAll();
    
    if (existingRecords.length > 0) {
      // Update existing record
      const existingRecord = existingRecords[0];
      const updatedRecord: ChatHistoryRecord = {
        ...existingRecord,
        messages,
        updatedAt: new Date()
      };
      
      const { resource } = await container.item(existingRecord.id).replace(updatedRecord);
      return resource;
    } else {
      // Create new record
      const newRecord: ChatHistoryRecord = {
        userId,
        sessionId,
        messages,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const { resource } = await container.items.create(newRecord);
      return resource;
    }
  } catch (error) {
    console.error('Error saving chat history:', error);
    return null;
  }
};

/**
 * Get chat history from Cosmos DB
 * @param userId User ID
 * @param sessionId Session ID
 * @returns The chat history record or null if not found
 */
export const getChatHistory = async (
  userId: string,
  sessionId: string
): Promise<ChatHistoryRecord | null> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Cannot retrieve chat history.');
    return null;
  }

  try {
    const container = await getContainer(CHAT_HISTORY_CONTAINER);
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.sessionId = @sessionId",
      parameters: [
        { name: "@userId", value: userId },
        { name: "@sessionId", value: sessionId }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    
    if (resources.length > 0) {
      return resources[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting chat history:', error);
    return null;
  }
};

/**
 * Get all chat sessions for a user
 * @param userId User ID
 * @returns Array of chat history records
 */
export const getUserChatSessions = async (
  userId: string
): Promise<ChatHistoryRecord[]> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Cannot retrieve user chat sessions.');
    return [];
  }

  try {
    const container = await getContainer(CHAT_HISTORY_CONTAINER);
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC",
      parameters: [
        { name: "@userId", value: userId }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error('Error getting user chat sessions:', error);
    return [];
  }
};

/**
 * Delete a chat session
 * @param userId User ID
 * @param sessionId Session ID
 * @returns True if successful, false otherwise
 */
export const deleteChatSession = async (
  userId: string,
  sessionId: string
): Promise<boolean> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Cannot delete chat session.');
    return false;
  }

  try {
    const container = await getContainer(CHAT_HISTORY_CONTAINER);
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.sessionId = @sessionId",
      parameters: [
        { name: "@userId", value: userId },
        { name: "@sessionId", value: sessionId }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    
    if (resources.length > 0) {
      await container.item(resources[0].id).delete();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
};
