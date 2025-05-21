import { getContainer, isCosmosDBConfigured, getDocumentById } from './client';
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

// Debug utility function
const debugLog = (message: string, data?: any) => {
  console.log(`[ChatHistory Debug] ${message}`, data ? data : '');
};

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
    
    debugLog(`Checking for existing session: ${userId}/${sessionId}`);
    const { resources: existingRecords } = await container.items.query(querySpec).fetchAll();
    
    if (existingRecords.length > 0) {
      // Update existing record
      const existingRecord = existingRecords[0];
      debugLog(`Updating existing session: ${existingRecord.id}`);
      
      // Ensure all messages have timestamps
      const messagesWithTimestamps = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date()
      }));
      
      // IMPORTANT: Log the messages array length to debug replacement issue
      debugLog(`Saving messages array with ${messagesWithTimestamps.length} messages`);
      
      // FIXED: Merge existing messages with new ones instead of replacing
      // Get existing messages from the record
      const existingMessages = existingRecord.messages || [];
      
      // Create a set of existing message content hashes for deduplication
      const existingContentHashes = new Set(
        existingMessages.map((msg: ChatMessage) => `${msg.role}:${msg.content}`)
      );
      
      // Filter out any new messages that are duplicates of existing ones
      const uniqueNewMessages = messagesWithTimestamps.filter(msg => {
        const contentHash = `${msg.role}:${msg.content}`;
        return !existingContentHashes.has(contentHash);
      });
      
      debugLog(`Found ${existingMessages.length} existing messages, adding ${uniqueNewMessages.length} new unique messages`);
      
      // Combine existing and new messages
      const combinedMessages = [...existingMessages, ...uniqueNewMessages];
      
      const updatedRecord: ChatHistoryRecord = {
        ...existingRecord,
        messages: combinedMessages,
        updatedAt: new Date()
      };
      
      // Use sessionId as the partition key when replacing the item
      const { resource } = await container.item(existingRecord.id, sessionId).replace(updatedRecord);
      debugLog(`Successfully updated session: ${resource?.id} with ${combinedMessages.length} total messages`);
      return resource;
    } else {
      // Create new record
      debugLog(`Creating new session for: ${userId}/${sessionId}`);
      
      // Ensure all messages have timestamps
      const messagesWithTimestamps = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date()
      }));
      
      const newRecord: ChatHistoryRecord = {
        userId,
        sessionId,
        messages: messagesWithTimestamps,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Use sessionId as the partition key when creating the item
      const { resource } = await container.items.create(newRecord);
      debugLog(`Successfully created new session: ${resource?.id}`);
      return resource;
    }
  } catch (error) {
    console.error('Error saving chat history:', error);
    return null;
  }
};

/**
 * Get chat history from Cosmos DB with retry logic
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
  
  // Retry parameters
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: any = null;
  
  while (retryCount < maxRetries) {
    try {
      debugLog(`Getting chat history for: ${userId}/${sessionId} (attempt ${retryCount + 1})`);
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
        debugLog(`Found chat history: ${resources[0].id} with ${resources[0].messages?.length || 0} messages`);
        
        // Log the first few messages for debugging
        if (resources[0].messages && resources[0].messages.length > 0) {
          debugLog('First few messages:', resources[0].messages.slice(0, 3));
        }
        
        return resources[0];
      } else {
        debugLog(`No chat history found for: ${userId}/${sessionId}`);
        return null;
      }
    } catch (error) {
      lastError = error;
      retryCount++;
      console.error(`Error getting chat history (attempt ${retryCount}):`, error);
      
      if (retryCount < maxRetries) {
        // Exponential backoff
        const backoffTime = 500 * Math.pow(2, retryCount);
        debugLog(`Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  
  console.error(`Failed to get chat history after ${maxRetries} attempts:`, lastError);
  return null;
};

/**
 * Add a single message to chat history
 * @param userId User ID
 * @param sessionId Session ID
 * @param message Chat message to add
 * @returns The updated chat history record
 */
export const addMessageToChatHistory = async (
  userId: string,
  sessionId: string,
  message: ChatMessage
): Promise<ChatHistoryRecord | null> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Cannot add message to chat history.');
    return null;
  }
  
  try {
    // Get current history
    const historyRecord = await getChatHistory(userId, sessionId);
    
    if (historyRecord) {
      // Ensure message has timestamp
      const messageWithTimestamp = {
        ...message,
        timestamp: message.timestamp || new Date()
      };
      
      // Enhanced deduplication check for assistant messages
      if (message.role === 'assistant') {
        // Check if this exact message content already exists in the history
        const hasDuplicate = historyRecord.messages.some(existingMsg => 
          existingMsg.role === 'assistant' && 
          existingMsg.content === message.content
        );
        
        if (hasDuplicate) {
          debugLog('Duplicate assistant message detected, skipping addition to history');
          return historyRecord; // Return existing record without changes
        }
      }
      
      // Add message to existing messages array
      const updatedMessages = [
        ...historyRecord.messages,
        messageWithTimestamp
      ];
      
      debugLog(`Adding message to history. New total: ${updatedMessages.length} messages`);
      
      // Save updated history
      return await saveChatHistory(userId, sessionId, updatedMessages);
    } else {
      // Create new history if none exists
      debugLog('Creating new chat history with initial message');
      
      const initialMessages: ChatMessage[] = [
        {
          role: 'system' as const,
          content: 'You are a helpful assistant for the Policy Maps application, which provides access to curated maps and data layers about humanitarian and resilience-related facts.',
          timestamp: new Date()
        },
        {
          ...message,
          timestamp: message.timestamp || new Date()
        }
      ];
      
      return await saveChatHistory(userId, sessionId, initialMessages);
    }
  } catch (error) {
    console.error('Error adding message to chat history:', error);
    return null;
  }
};

/**
 * Get chat history by document ID
 * @param documentId Document ID
 * @param sessionId Session ID (partition key)
 * @returns The chat history record or null if not found
 */
export const getChatHistoryById = async (
  documentId: string,
  sessionId: string
): Promise<ChatHistoryRecord | null> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Cannot retrieve chat history by ID.');
    return null;
  }
  
  try {
    debugLog(`Getting chat history by ID: ${documentId}`);
    return await getDocumentById(CHAT_HISTORY_CONTAINER, documentId, sessionId);
  } catch (error) {
    console.error('Error getting chat history by ID:', error);
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
    debugLog(`Getting all chat sessions for user: ${userId}`);
    const container = await getContainer(CHAT_HISTORY_CONTAINER);
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC",
      parameters: [
        { name: "@userId", value: userId }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    debugLog(`Found ${resources.length} sessions for user: ${userId}`);
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
    debugLog(`Deleting chat session: ${userId}/${sessionId}`);
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
      // Use sessionId as the partition key when deleting the item
      await container.item(resources[0].id, sessionId).delete();
      debugLog(`Successfully deleted session: ${resources[0].id}`);
      return true;
    } else {
      debugLog(`No session found to delete: ${userId}/${sessionId}`);
      return false;
    }
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
};
