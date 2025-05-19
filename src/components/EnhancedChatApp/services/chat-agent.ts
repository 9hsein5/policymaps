import { ChatMessage } from '../services/azure-openai/chat';
import { SearchResult, searchGeospatialDocuments } from '../services/azure-search/search';
import { saveChatHistory, getChatHistory } from '../services/azure-cosmos/chat-history';
import { 
  generateChatCompletion, 
  generateStreamingChatCompletion,
  analyzeSpatialContext,
  extractSearchKeywords
} from '../services/azure-openai/chat';
import { v4 as uuidv4 } from 'uuid';

// Enhanced chat agent interface
export interface EnhancedChatAgent {
  sendMessage: (message: string) => Promise<{
    response: ChatMessage;
    relatedItems?: SearchResult[];
    suggestedQueries?: string[];
  }>;
  sendStreamingMessage: (
    message: string, 
    onUpdate: (text: string) => void,
    onComplete: (relatedItems?: SearchResult[], suggestedQueries?: string[]) => void
  ) => Promise<void>;
  loadChatHistory: () => Promise<ChatMessage[]>;
  clearChatHistory: () => Promise<void>;
}

// Create enhanced chat agent
export const createEnhancedChatAgent = (
  userId: string,
  options: {
    onSearchResults?: (results: SearchResult[]) => void;
  } = {}
): EnhancedChatAgent => {
  // Generate a unique session ID if not provided
  const sessionId = uuidv4();
  
  // Chat history
  let chatHistory: ChatMessage[] = [];
  
  // Agent context
  const agentContext = {
    recentTopics: [] as string[],
    recentLocations: [] as string[],
    activeMapLayers: [] as string[]
  };
  
  // Load chat history from Cosmos DB
  const loadChatHistory = async (): Promise<ChatMessage[]> => {
    try {
      const historyRecord = await getChatHistory(userId, sessionId);
      
      if (historyRecord && historyRecord.messages) {
        chatHistory = historyRecord.messages;
      } else {
        // Initialize with system message if no history
        chatHistory = [{
          role: 'system',
          content: 'You are a helpful assistant for the Policy Maps application, which provides access to curated maps and data layers about humanitarian and resilience-related facts.'
        }];
      }
      
      return chatHistory.filter(msg => msg.role !== 'system');
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  };
  
  // Save chat history to Cosmos DB
  const saveChatHistoryToDb = async (): Promise<void> => {
    try {
      await saveChatHistory(userId, sessionId, chatHistory);
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };
  
  // Clear chat history
  const clearChatHistory = async (): Promise<void> => {
    chatHistory = [{
      role: 'system',
      content: 'You are a helpful assistant for the Policy Maps application, which provides access to curated maps and data layers about humanitarian and resilience-related facts.'
    }];
    
    await saveChatHistoryToDb();
  };
  
  // Send message to chat agent
  const sendMessage = async (message: string): Promise<{
    response: ChatMessage;
    relatedItems?: SearchResult[];
    suggestedQueries?: string[];
  }> => {
    // Add user message to chat history
    const userMessage: ChatMessage = {
      role: 'user',
      content: message
    };
    
    chatHistory.push(userMessage);
    
    try {
      // Analyze spatial context
      const spatialContext = await analyzeSpatialContext(message);
      
      // Update agent context with new locations
      if (spatialContext.locations && spatialContext.locations.length > 0) {
        agentContext.recentLocations = [
          ...spatialContext.locations,
          ...agentContext.recentLocations
        ].slice(0, 5);
      }
      
      // Extract search keywords
      const searchKeywords = await extractSearchKeywords(message);
      
      // Update agent context with new topics
      if (searchKeywords.length > 0) {
        agentContext.recentTopics = [
          ...searchKeywords,
          ...agentContext.recentTopics
        ].slice(0, 5);
      }
      
      // Search for related documents
      const searchQuery = searchKeywords.join(' ');
      const { results: searchResults } = await searchGeospatialDocuments(
        searchQuery,
        spatialContext
      );
      
      // Generate chat completion
      const assistantMessage = await generateChatCompletion(chatHistory);
      
      // Add assistant message to chat history
      chatHistory.push(assistantMessage);
      
      // Save chat history
      await saveChatHistoryToDb();
      
      // Generate suggested queries based on context
      const suggestedQueries = generateSuggestedQueries(
        message,
        assistantMessage.content,
        spatialContext,
        agentContext
      );
      
      // Notify about search results if callback provided
      if (options.onSearchResults && searchResults.length > 0) {
        options.onSearchResults(searchResults);
      }
      
      return {
        response: assistantMessage,
        relatedItems: searchResults.length > 0 ? searchResults : undefined,
        suggestedQueries: suggestedQueries.length > 0 ? suggestedQueries : undefined
      };
    } catch (error) {
      console.error('Error in chat agent:', error);
      
      // Create error response
      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again later.'
      };
      
      // Add error response to chat history
      chatHistory.push(errorResponse);
      
      // Save chat history
      await saveChatHistoryToDb();
      
      return {
        response: errorResponse
      };
    }
  };
  
  // Send streaming message to chat agent
  const sendStreamingMessage = async (
    message: string,
    onUpdate: (text: string) => void,
    onComplete: (relatedItems?: SearchResult[], suggestedQueries?: string[]) => void
  ): Promise<void> => {
    // Add user message to chat history
    const userMessage: ChatMessage = {
      role: 'user',
      content: message
    };
    
    chatHistory.push(userMessage);
    
    try {
      // Analyze spatial context
      const spatialContext = await analyzeSpatialContext(message);
      
      // Update agent context with new locations
      if (spatialContext.locations && spatialContext.locations.length > 0) {
        agentContext.recentLocations = [
          ...spatialContext.locations,
          ...agentContext.recentLocations
        ].slice(0, 5);
      }
      
      // Extract search keywords
      const searchKeywords = await extractSearchKeywords(message);
      
      // Update agent context with new topics
      if (searchKeywords.length > 0) {
        agentContext.recentTopics = [
          ...searchKeywords,
          ...agentContext.recentTopics
        ].slice(0, 5);
      }
      
      // Search for related documents
      const searchQuery = searchKeywords.join(' ');
      const { results: searchResults } = await searchGeospatialDocuments(
        searchQuery,
        spatialContext
      );
      
      // Collect streaming response
      let streamingResponse = '';
      
      // Generate streaming chat completion
      await generateStreamingChatCompletion(
        chatHistory,
        (chunk) => {
          streamingResponse += chunk;
          onUpdate(chunk);
        }
      );
      
      // Add assistant message to chat history
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: streamingResponse
      };
      
      chatHistory.push(assistantMessage);
      
      // Save chat history
      await saveChatHistoryToDb();
      
      // Generate suggested queries based on context
      const suggestedQueries = generateSuggestedQueries(
        message,
        streamingResponse,
        spatialContext,
        agentContext
      );
      
      // Notify about search results if callback provided
      if (options.onSearchResults && searchResults.length > 0) {
        options.onSearchResults(searchResults);
      }
      
      // Call onComplete with results
      onComplete(
        searchResults.length > 0 ? searchResults : undefined,
        suggestedQueries.length > 0 ? suggestedQueries : undefined
      );
    } catch (error) {
      console.error('Error in streaming chat agent:', error);
      
      // Send error message
      onUpdate('\n\nSorry, I encountered an error while processing your request. Please try again later.');
      
      // Create error response
      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again later.'
      };
      
      // Add error response to chat history
      chatHistory.push(errorResponse);
      
      // Save chat history
      await saveChatHistoryToDb();
      
      // Call onComplete with no results
      onComplete();
    }
  };
  
  // Generate suggested queries based on context
  const generateSuggestedQueries = (
    userMessage: string,
    assistantResponse: string,
    spatialContext: {
      locations?: string[];
      spatialRelations?: string[];
      suggestedMapTypes?: string[];
    },
    agentContext: {
      recentTopics: string[];
      recentLocations: string[];
      activeMapLayers: string[];
    }
  ): string[] => {
    const suggestions: string[] = [];
    
    // Add suggestions based on spatial context
    if (spatialContext.locations && spatialContext.locations.length > 0) {
      const location = spatialContext.locations[0];
      suggestions.push(`Show me more maps about ${location}`);
      
      if (spatialContext.suggestedMapTypes && spatialContext.suggestedMapTypes.length > 0) {
        const mapType = spatialContext.suggestedMapTypes[0];
        suggestions.push(`Show ${mapType} data for ${location}`);
      }
    }
    
    // Add suggestions based on agent context
    if (agentContext.recentTopics.length > 0) {
      const topic = agentContext.recentTopics[0];
      suggestions.push(`How does ${topic} relate to disaster risk?`);
      
      if (agentContext.recentLocations.length > 0) {
        const location = agentContext.recentLocations[0];
        suggestions.push(`Compare ${topic} between different regions near ${location}`);
      }
    }
    
    // Add general suggestions if needed
    if (suggestions.length < 2) {
      suggestions.push('What are the most viewed maps in the collection?');
      suggestions.push('Show me the latest data layers added');
    }
    
    // Limit to 3 suggestions
    return suggestions.slice(0, 3);
  };
  
  return {
    sendMessage,
    sendStreamingMessage,
    loadChatHistory,
    clearChatHistory
  };
};
