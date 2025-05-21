import * as React from 'react';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import './style.scss';
import { v4 as uuidv4 } from 'uuid';
import { createEnhancedChatAgent, EnhancedChatAgent } from '../services/chat-agent';
import { SearchResult } from '../services/azure-search/search';
import { 
  getChatHistory, 
  addMessageToChatHistory
} from '../services/azure-cosmos/chat-history';
import { isCosmosDBConfigured } from '../services/azure-cosmos/client';
import { ChatMessage } from '../services/azure-openai/chat';

// UI Message interface
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  references?: any[];
}

interface ChatPanelProps {
  userId?: string;
  onChatMessageSend?: (message: string) => void;
  scrollToBottomHandler?: () => void;
  messages?: UIMessage[];
  onSearchResults?: (results: SearchResult[]) => void;
}

// Session storage key
const SESSION_ID_STORAGE_KEY = 'policymaps_chat_session_id';

// Debug utility function
const debugLog = (message: string, data?: any) => {
  console.log(`[ChatPanel Debug] ${message}`, data ? data : '');
};

// Individual message component with memoization to prevent unnecessary re-renders
// Renamed from ChatMessage to MemoizedChatMessage to avoid duplicate declaration
const MemoizedChatMessage = React.memo(({ message }: { message: UIMessage }) => {
  // Only log once during initial render, not on every re-render
  // This prevents the excessive debug logs we were seeing
  const hasLoggedRef = useRef(false);
  
  if (!hasLoggedRef.current) {
    debugLog(`Rendering message: ${message.role} - ${message.content.substring(0, 50)}...`);
    hasLoggedRef.current = true;
  }
  
  return (
    <div className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
      <div className="message-header">
        <span className="message-sender">{message.role === 'assistant' ? 'Assistant' : 'You'}</span>
        <span className="message-time">{message.timestamp.toLocaleTimeString()}</span>
      </div>
      <div className="message-content">{message.content}</div>
      {message.references && message.references.length > 0 && (
        <div className="message-references">
          <div className="references-header">References:</div>
          <ul className="references-list">
            {message.references.map((ref, index) => (
              <li key={index} className="reference-item">
                <span className="reference-number">[{index + 1}]</span>
                <span className="reference-title">{ref.title}</span>
                {ref.snippet && <span className="reference-snippet">{ref.snippet}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  userId = 'anonymous', 
  onChatMessageSend,
  scrollToBottomHandler,
  messages = [],
  onSearchResults
}) => {
  // Use explicit named hooks instead of React.useState for better readability
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localMessages, setLocalMessages] = useState<UIMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chatAgent, setChatAgent] = useState<EnhancedChatAgent | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  const [cosmosDbAvailable, setCosmosDbAvailable] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Use only messages from props if available, otherwise use local messages
  // Memoize to prevent unnecessary re-renders
  const displayMessages = useMemo(() => {
    if (messages && messages.length > 0) {
      return messages;
    }
    return localMessages;
  }, [messages, localMessages]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Helper function to add welcome message to local state and Cosmos DB
  // IMPORTANT: Moved this declaration before the useEffect hooks that reference it
  const addWelcomeMessage = useCallback(async () => {
    // Check if welcome message already exists in local state to prevent duplicates
    const welcomeMessageExists = localMessages.some(
      msg => msg.role === 'assistant' && msg.content.includes('Welcome to Policy Maps Chat')
    );
    
    if (welcomeMessageExists) {
      debugLog('Welcome message already exists in local state, skipping addition');
      return;
    }
    
    const welcomeUIMessage: UIMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: 'Welcome to Policy Maps Chat! Ask questions about maps, data layers, or specific geographic areas.',
      timestamp: new Date()
    };
    
    debugLog('Adding welcome message:', welcomeUIMessage);
    
    // Use a functional update to ensure we're working with the latest state
    setLocalMessages(prev => {
      // Double-check that welcome message doesn't already exist in the state
      const hasWelcome = prev.some(msg => 
        msg.role === 'assistant' && msg.content.includes('Welcome to Policy Maps Chat')
      );
      
      if (hasWelcome) {
        debugLog('Welcome message found during state update, not adding duplicate');
        return prev;
      }
      
      // FIXED: Append welcome message to existing messages instead of replacing them
      return [...prev, welcomeUIMessage];
    });
    
    // Also save welcome message to Cosmos DB if available
    if (cosmosDbAvailable && sessionId) {
      try {
        const welcomeChatMessage: ChatMessage = {
          role: 'assistant',
          content: welcomeUIMessage.content,
          timestamp: new Date()
        };
        
        // Check if there's already a history record
        const existingHistory = await getChatHistory(userId, sessionId);
        
        // Only add welcome message if there's no history or no messages
        if (!existingHistory || !existingHistory.messages || existingHistory.messages.length === 0) {
          await addMessageToChatHistory(userId, sessionId, welcomeChatMessage);
          debugLog('Welcome message saved to Cosmos DB');
        } else {
          // Check if welcome message already exists in Cosmos DB
          const welcomeExists = existingHistory.messages.some(
            msg => msg.role === 'assistant' && msg.content.includes('Welcome to Policy Maps Chat')
          );
          
          if (!welcomeExists) {
            await addMessageToChatHistory(userId, sessionId, welcomeChatMessage);
            debugLog('Welcome message saved to Cosmos DB (existing history but no welcome)');
          } else {
            debugLog('Welcome message already exists in Cosmos DB, skipping save');
          }
        }
      } catch (err) {
        console.error('Error saving welcome message to Cosmos DB:', err);
      }
    }
  }, [cosmosDbAvailable, sessionId, userId, localMessages]);
  
  // Initialize session ID once on component mount with persistence
  useEffect(() => {
    // Get existing session ID from storage or create a new one
    const getOrCreateSessionId = () => {
      const storedSessionId = localStorage.getItem(SESSION_ID_STORAGE_KEY);
      if (storedSessionId) {
        debugLog('Using existing session ID from storage:', storedSessionId);
        return storedSessionId;
      } else {
        const newSessionId = uuidv4();
        debugLog('Created new session ID:', newSessionId);
        localStorage.setItem(SESSION_ID_STORAGE_KEY, newSessionId);
        return newSessionId;
      }
    };
    
    // Set the session ID in state
    setSessionId(getOrCreateSessionId());
  }, []); // Empty dependency array ensures this runs only once per component mount
  
  // Initialize chat agent when sessionId is available
  useEffect(() => {
    if (!sessionId) return; // Wait for sessionId to be set
    
    const initializeChat = async () => {
      try {
        // Initialize chat agent
        const agent = createEnhancedChatAgent(userId, {
          sessionId: sessionId,
          onSearchResults: (results) => {
            if (onSearchResults) {
              onSearchResults(results);
            }
          }
        });
        
        setChatAgent(agent);
        debugLog('Chat agent initialized with session ID:', sessionId);
      } catch (err) {
        console.error('Error initializing chat agent:', err);
        setError('Failed to initialize chat. Please try again later.');
      }
    };
    
    initializeChat();
  }, [sessionId, userId, onSearchResults]);
  
  // Check Cosmos DB availability and load history when sessionId is available
  useEffect(() => {
    if (!sessionId || isInitialized) return; // Wait for sessionId to be set and only run once
    
    const checkCosmosAndLoadHistory = async () => {
      setIsSessionLoading(true);
      
      try {
        // First check if Cosmos DB is configured
        const isConfigured = isCosmosDBConfigured();
        debugLog('Cosmos DB configured:', isConfigured);
        
        if (isConfigured) {
          try {
            // Verify connectivity by making a test call
            const existingHistory = await getChatHistory(userId, sessionId);
            debugLog('Cosmos DB connection verified successfully');
            setCosmosDbAvailable(true);
            
            // Conflict resolution: Check if Cosmos DB has more messages than local state
            if (existingHistory && existingHistory.messages && existingHistory.messages.length > 0) {
              debugLog(`Found existing history in Cosmos DB with ${existingHistory.messages.length} messages`);
              
              // If local state is empty or has fewer messages than Cosmos DB, use Cosmos DB data
              if (localMessages.length === 0 || existingHistory.messages.length > localMessages.length) {
                debugLog('Cosmos DB has more messages than local state, syncing...');
                
                // Create UI messages from the messages array with deduplication
                const uiMessages: UIMessage[] = [];
                const processedIds = new Set<string>();
                
                // Process all messages except pure system configuration messages
                for (const msg of existingHistory.messages) {
                  if (!msg) {
                    debugLog('Skipping null or undefined message');
                    continue;
                  }
                  
                  // Skip pure system messages that are just configuration
                  if (msg.role === 'system' && msg.content && msg.content.includes('You are a helpful assistant')) {
                    debugLog('Skipping system configuration message');
                    continue;
                  }
                  
                  // Create a unique ID for deduplication based on content and role
                  const contentHash = `${msg.role}:${msg.content}`;
                  
                  // Skip if we've already processed this message
                  if (processedIds.has(contentHash)) {
                    debugLog('Skipping duplicate message:', contentHash);
                    continue;
                  }
                  
                  processedIds.add(contentHash);
                  
                  try {
                    // Create a new UI message with explicit type checking
                    const uiMsg: UIMessage = {
                      id: uuidv4(),
                      role: msg.role as 'user' | 'assistant' | 'system',
                      content: msg.content || 'No content available',
                      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
                    };
                    
                    debugLog(`Created UI message: ${uiMsg.role} - ${uiMsg.content.substring(0, 50)}...`);
                    uiMessages.push(uiMsg);
                  } catch (msgErr) {
                    console.error('Error processing message:', msgErr, msg);
                    // Continue with next message instead of failing the entire history load
                  }
                }
                
                // Only update if we have messages to display
                if (uiMessages.length > 0) {
                  debugLog(`Setting ${uiMessages.length} local messages from Cosmos DB`);
                  // Use a functional update to ensure we're working with the latest state
                  setLocalMessages(uiMessages);
                  
                  // Check if welcome message exists in loaded history
                  const welcomeExists = uiMessages.some(
                    msg => msg.role === 'assistant' && msg.content.includes('Welcome to Policy Maps Chat')
                  );
                  
                  if (!welcomeExists) {
                    debugLog('History loaded but no welcome message found, adding welcome message');
                    await addWelcomeMessage();
                  }
                } else {
                  debugLog('No valid messages found in history, adding welcome message');
                  await addWelcomeMessage();
                }
              } else {
                debugLog('Local state has same or more messages than Cosmos DB, keeping local state');
                
                // Check if welcome message exists in local state
                const welcomeExists = localMessages.some(
                  msg => msg.role === 'assistant' && msg.content.includes('Welcome to Policy Maps Chat')
                );
                
                if (!welcomeExists) {
                  debugLog('Local state has no welcome message, adding welcome message');
                  await addWelcomeMessage();
                }
              }
            } else {
              // No history in Cosmos DB, add welcome message
              debugLog('No history found in Cosmos DB, adding welcome message');
              await addWelcomeMessage();
            }
          } catch (err) {
            console.error('Cosmos DB connection failed:', err);
            setCosmosDbAvailable(false);
            setError('Failed to connect to Cosmos DB. Chat history will not be persisted.');
            
            // Add welcome message as fallback
            await addWelcomeMessage();
          }
        } else {
          debugLog('Cosmos DB not configured, using local storage only');
          setCosmosDbAvailable(false);
          
          // Add welcome message as fallback
          await addWelcomeMessage();
        }
      } catch (err) {
        console.error('Error checking Cosmos DB:', err);
        setError('Failed to check Cosmos DB. Some features may be limited.');
        
        // Add welcome message as fallback
        await addWelcomeMessage();
      } finally {
        setIsSessionLoading(false);
        setIsInitialized(true); // Mark as initialized to prevent multiple runs
      }
    };
    
    checkCosmosAndLoadHistory();
  }, [sessionId, userId, isInitialized, localMessages, addWelcomeMessage]);
  
  // Load chat history from Cosmos DB
  const loadChatHistory = async (): Promise<boolean> => {
    if (!sessionId) return false;
    
    debugLog(`Loading chat history for session ${sessionId}`);
    
    try {
      // Get existing session from Cosmos DB
      const existingSession = await getChatHistory(userId, sessionId);
      
      if (existingSession && existingSession.messages && existingSession.messages.length > 0) {
        debugLog('Loaded existing session from Cosmos DB:', existingSession);
        
        // Create UI messages from the messages array
        const uiMessages: UIMessage[] = [];
        const processedIds = new Set<string>();
        
        // Process all messages except pure system configuration messages
        for (const msg of existingSession.messages) {
          if (!msg) {
            debugLog('Skipping null or undefined message');
            continue;
          }
          
          // Skip pure system messages that are just configuration
          if (msg.role === 'system' && msg.content && msg.content.includes('You are a helpful assistant')) {
            debugLog('Skipping system configuration message');
            continue;
          }
          
          // Create a unique ID for deduplication based on content and role
          const contentHash = `${msg.role}:${msg.content}`;
          
          // Skip if we've already processed this message
          if (processedIds.has(contentHash)) {
            debugLog('Skipping duplicate message:', contentHash);
            continue;
          }
          
          processedIds.add(contentHash);
          
          try {
            // Create a new UI message with explicit type checking
            const uiMsg: UIMessage = {
              id: uuidv4(),
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content || 'No content available',
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
            };
            
            debugLog(`Created UI message: ${uiMsg.role} - ${uiMsg.content.substring(0, 50)}...`);
            uiMessages.push(uiMsg);
          } catch (msgErr) {
            console.error('Error processing message:', msgErr, msg);
            // Continue with next message instead of failing the entire history load
          }
        }
        
        // Only update if we have messages to display
        if (uiMessages.length > 0) {
          debugLog(`Setting ${uiMessages.length} local messages`);
          // Use a functional update to ensure we're working with the latest state
          setLocalMessages(uiMessages);
          return true; // Successfully loaded history
        } else {
          debugLog('No valid messages found in history');
          return false;
        }
      } else {
        debugLog('No existing session found');
        return false;
      }
      
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError('Failed to load chat history. Some features may be limited.');
      return false;
    }
  };
  
  // This section intentionally left empty to remove the duplicate declaration of addWelcomeMessage
  
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);
  
  const handleSendMessage = useCallback(async () => {
    if (message.trim() && !isLoading && chatAgent && sessionId) {
      setIsLoading(true);
      setError(null);
      
      // Add user message to local state
      const userUIMessage: UIMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      debugLog('Adding user message to local state:', userUIMessage);
      
      // Important: Append to existing messages, not replace them
      // Use a functional update to ensure we're working with the latest state
      setLocalMessages(prev => [...prev, userUIMessage]);
      
      // Create backend ChatMessage
      const userChatMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      // Save user message to Cosmos DB
      if (cosmosDbAvailable) {
        try {
          // First get the latest history from Cosmos DB to ensure we're working with the most up-to-date data
          const latestHistory = await getChatHistory(userId, sessionId);
          
          // If we have history in Cosmos DB but our local state doesn't match it,
          // update our local state first to ensure consistency
          if (latestHistory && latestHistory.messages && latestHistory.messages.length > 0) {
            const cosmosMessages = latestHistory.messages;
            
            // Only update local state if it's different from Cosmos DB
            // This prevents losing local messages that haven't been saved yet
            if (localMessages.length === 0 || 
                cosmosMessages.length > localMessages.length) {
              debugLog('Syncing local state with Cosmos DB before saving new message');
              
              // Convert Cosmos DB messages to UI messages with deduplication
              const processedIds = new Set<string>();
              const syncedUIMessages = cosmosMessages
                .map(msg => {
                  // Skip system configuration messages
                  if (msg.role === 'system' && msg.content && msg.content.includes('You are a helpful assistant')) {
                    return null;
                  }
                  
                  // Create a unique ID for deduplication based on content and role
                  const contentHash = `${msg.role}:${msg.content}`;
                  
                  // Skip if we've already processed this message
                  if (processedIds.has(contentHash)) {
                    return null;
                  }
                  
                  processedIds.add(contentHash);
                  
                  return {
                    id: uuidv4(),
                    role: msg.role as 'user' | 'assistant' | 'system',
                    content: msg.content || 'No content available',
                    timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
                  };
                })
                .filter(Boolean) as UIMessage[];
              
              // Only update if we have messages to display and they're different from current
              if (syncedUIMessages.length > 0 && 
                  (localMessages.length === 0 || 
                   syncedUIMessages.length !== localMessages.length)) {
                debugLog(`Updating local state with ${syncedUIMessages.length} messages from Cosmos DB`);
                
                // Add the new user message to the synced messages
                const updatedMessages = [
                  ...syncedUIMessages,
                  userUIMessage
                ];
                
                // Update local state with synced messages plus new user message
                setLocalMessages(updatedMessages);
              }
            }
          }
          
          // Now use addMessageToChatHistory to properly append the message
          await addMessageToChatHistory(userId, sessionId, userChatMessage);
          debugLog('User message appended to Cosmos DB');
        } catch (err) {
          console.error('Error saving user message to Cosmos DB:', err);
          // Continue with local processing even if Cosmos DB save fails
          setError('Failed to save message to Cosmos DB. Using local storage only.');
        }
      }
      
      // Call the onChatMessageSend callback if provided
      if (onChatMessageSend) {
        onChatMessageSend(message);
      }
      
      try {
        // Create a temporary loading message
        const loadingId = uuidv4();
        
        // Use a functional update to ensure we're working with the latest state
        setLocalMessages(prev => [
          ...prev, 
          {
            id: loadingId,
            role: 'assistant',
            content: 'Thinking...',
            timestamp: new Date()
          }
        ]);
        
        // Use streaming response for better UX
        let fullResponse = '';
        
        await chatAgent.sendStreamingMessage(
          message,
          (chunk) => {
            fullResponse += chunk;
            
            // Update the loading message with the current response
            // Use a functional update to ensure we're working with the latest state
            setLocalMessages(prev => 
              prev.map(msg => 
                msg.id === loadingId 
                  ? { ...msg, content: fullResponse || 'Thinking...' } 
                  : msg
              )
            );
          },
          async (relatedItems, suggestedQueries) => {
            // Update the final message with references if available
            if (relatedItems && relatedItems.length > 0) {
              // Use a functional update to ensure we're working with the latest state
              setLocalMessages(prev => 
                prev.map(msg => 
                  msg.id === loadingId 
                    ? { 
                        ...msg, 
                        content: fullResponse || 'No response generated.',
                        references: relatedItems.map(item => ({
                          id: item.id,
                          title: item.title,
                          snippet: item.description || ''
                        }))
                      } 
                    : msg
                )
              );
            }
            
            // Save assistant response to Cosmos DB
            if (cosmosDbAvailable) {
              try {
                // Create assistant ChatMessage
                const assistantChatMessage: ChatMessage = {
                  role: 'assistant',
                  content: fullResponse || 'No response generated.',
                  timestamp: new Date()
                };
                
                // Check if this exact message already exists to prevent duplicates
                // Enhanced deduplication check - check against Cosmos DB history, not just local state
                const historyRecord = await getChatHistory(userId, sessionId);
                const hasDuplicate = historyRecord?.messages.some(
                  msg => msg.role === 'assistant' && msg.content === fullResponse
                ) || false;
                
                if (!hasDuplicate) {
                  // Use addMessageToChatHistory instead of direct saveChatHistory
                  let retryCount = 0;
                  const maxRetries = 3;
                  
                  while (retryCount < maxRetries) {
                    try {
                      await addMessageToChatHistory(userId, sessionId, assistantChatMessage);
                      debugLog('Assistant message appended to Cosmos DB');
                      break; // Success, exit retry loop
                    } catch (saveErr) {
                      retryCount++;
                      console.error(`Error saving assistant response to Cosmos DB (attempt ${retryCount}):`, saveErr);
                      
                      if (retryCount >= maxRetries) {
                        setError('Failed to save response to Cosmos DB after multiple attempts. Using local storage only.');
                      } else {
                        // Exponential backoff
                        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount)));
                      }
                    }
                  }
                } else {
                  debugLog('Skipping save to Cosmos DB - duplicate assistant message detected');
                }
              } catch (err) {
                console.error('Error saving assistant response to Cosmos DB:', err);
                setError('Failed to save response to Cosmos DB. Using local storage only.');
              }
            }
            
            // Reset loading state
            setIsLoading(false);
            
            // Reset message input
            setMessage('');
            
            // Scroll to bottom
            if (scrollToBottomHandler) {
              scrollToBottomHandler();
            } else if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }
        );
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message. Please try again later.');
        setIsLoading(false);
        
        // Remove the loading message if it exists
        // Use a functional update to ensure we're working with the latest state
        setLocalMessages(prev => 
          prev.filter(msg => msg.content !== 'Thinking...')
        );
        
        // Add error message
        // Use a functional update to ensure we're working with the latest state
        setLocalMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            role: 'assistant',
            content: 'Sorry, I encountered an error while processing your request. Please try again later.',
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [message, isLoading, chatAgent, sessionId, userId, cosmosDbAvailable, localMessages, onChatMessageSend, scrollToBottomHandler]);
  
  // Handle key down (replacing deprecated onKeyPress)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayMessages]);
  
  // Create a new chat session
  const handleNewSession = useCallback(() => {
    if (isLoading) return;
    
    // Generate new session ID
    const newSessionId = uuidv4();
    
    // Save to local storage
    localStorage.setItem(SESSION_ID_STORAGE_KEY, newSessionId);
    
    // Update state
    setSessionId(newSessionId);
    setLocalMessages([]);
    setError(null);
    setIsInitialized(false); // Reset initialization flag to trigger welcome message
    
    debugLog('Created new session with ID:', newSessionId);
  }, [isLoading]);
  
  return (
    <div className="chat-panel">
      {error && <div className="chat-error-banner">{error}</div>}
      
      <div className="chat-session-info">
        <div className="session-details">
          <span className="session-label">Session:</span>
          <span className="session-id">{sessionId?.substring(0, 8)}</span>
          <span className={`session-status ${cosmosDbAvailable ? 'connected' : 'offline'}`}>
            {cosmosDbAvailable ? 'Connected' : 'Local Only'}
          </span>
        </div>
        <button 
          type="button"
          className="new-session-button" 
          onClick={handleNewSession}
          disabled={isLoading}
        >
          New Session
        </button>
      </div>
      
      <div className="chat-messages">
        {isSessionLoading ? (
          <div className="chat-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading chat history...</div>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-message">No messages yet. Start a conversation!</div>
          </div>
        ) : (
          // Use the memoized MemoizedChatMessage component for each message
          displayMessages.map(msg => (
            <MemoizedChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          disabled={isLoading || isSessionLoading}
        />
        <div className="chat-actions">
          <button 
            type="button"
            className={`send-button ${(!message.trim() || isLoading || isSessionLoading) ? 'disabled' : ''}`}
            onClick={handleSendMessage} 
            disabled={!message.trim() || isLoading || isSessionLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
          <div className="chat-tip">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
