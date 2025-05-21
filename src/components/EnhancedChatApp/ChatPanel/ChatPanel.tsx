import * as React from 'react';
import './style.scss';
import { v4 as uuidv4 } from 'uuid';
import { createEnhancedChatAgent, EnhancedChatAgent } from '../services/chat-agent';
import { SearchResult } from '../services/azure-search/search';
import { 
  getChatHistory, 
  saveChatHistory,
  addMessageToChatHistory,
  ChatHistoryRecord 
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

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  userId = 'anonymous', 
  onChatMessageSend,
  scrollToBottomHandler,
  messages = [],
  onSearchResults
}) => {
  const [message, setMessage] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [localMessages, setLocalMessages] = React.useState<UIMessage[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [chatAgent, setChatAgent] = React.useState<EnhancedChatAgent | null>(null);
  const [streamingResponse, setStreamingResponse] = React.useState<string>('');
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [isSessionLoading, setIsSessionLoading] = React.useState<boolean>(true);
  const [cosmosDbAvailable, setCosmosDbAvailable] = React.useState<boolean>(false);
  const [hasLoadedHistory, setHasLoadedHistory] = React.useState<boolean>(false);
  
  // Use only messages from props if available, otherwise use local messages
  const displayMessages = React.useMemo(() => {
    if (messages && messages.length > 0) {
      return messages;
    }
    
    return localMessages;
  }, [messages, localMessages]);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Initialize session ID once on component mount
  React.useEffect(() => {
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
  }, []); // Empty dependency array ensures this runs only once
  
  // Initialize chat agent when sessionId is available
  React.useEffect(() => {
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
  React.useEffect(() => {
    if (!sessionId) return; // Wait for sessionId to be set
    if (hasLoadedHistory) return; // Don't reload if already loaded
    
    const checkCosmosAndLoadHistory = async () => {
      setIsSessionLoading(true);
      
      try {
        // First check if Cosmos DB is configured
        const isConfigured = isCosmosDBConfigured();
        debugLog('Cosmos DB configured:', isConfigured);
        
        if (isConfigured) {
          try {
            // Verify connectivity by making a test call
            await getChatHistory(userId, sessionId);
            debugLog('Cosmos DB connection verified successfully');
            setCosmosDbAvailable(true);
            
            // Load chat history
            const historyLoaded = await loadChatHistory();
            setHasLoadedHistory(true);
            
            // If no history was loaded, add welcome message
            if (!historyLoaded) {
              debugLog('No history loaded, adding welcome message');
              addWelcomeMessage();
            }
          } catch (err) {
            console.error('Cosmos DB connection failed:', err);
            setCosmosDbAvailable(false);
            setError('Failed to connect to Cosmos DB. Chat history will not be persisted.');
            
            // Add welcome message as fallback
            addWelcomeMessage();
            setHasLoadedHistory(true);
          }
        } else {
          debugLog('Cosmos DB not configured, using local storage only');
          setCosmosDbAvailable(false);
          
          // Add welcome message as fallback
          addWelcomeMessage();
          setHasLoadedHistory(true);
        }
      } catch (err) {
        console.error('Error checking Cosmos DB:', err);
        setError('Failed to check Cosmos DB. Some features may be limited.');
        
        // Add welcome message as fallback
        addWelcomeMessage();
        setHasLoadedHistory(true);
      } finally {
        setIsSessionLoading(false);
      }
    };
    
    checkCosmosAndLoadHistory();
  }, [sessionId, userId, hasLoadedHistory]);
  
  // Load chat history from Cosmos DB
  const loadChatHistory = async (): Promise<boolean> => {
    if (!sessionId) return false;
    
    debugLog(`Loading chat history for session ${sessionId}`);
    
    try {
      // Get existing session from Cosmos DB
      const existingSession = await getChatHistory(userId, sessionId);
      
      if (existingSession && existingSession.messages && existingSession.messages.length > 0) {
        debugLog('Loaded existing session from Cosmos DB:', existingSession);
        
        // Log the raw messages array for debugging
        debugLog('Raw messages array:', JSON.stringify(existingSession.messages, null, 2));
        debugLog('Total messages in Cosmos DB:', existingSession.messages.length);
        
        // Create UI messages from the messages array
        const uiMessages: UIMessage[] = [];
        
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
          
          // Debug log each message
          debugLog('Processing message:', JSON.stringify(msg, null, 2));
          debugLog(`Message role: ${msg.role}, content: ${msg.content?.substring(0, 50)}...`);
          
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
          // Sort messages by timestamp to ensure correct order
          uiMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
  
  // Helper function to add welcome message to local state
  const addWelcomeMessage = () => {
    const welcomeUIMessage: UIMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: 'Welcome to Policy Maps Chat! Ask questions about maps, data layers, or specific geographic areas.',
      timestamp: new Date()
    };
    
    debugLog('Adding welcome message:', welcomeUIMessage);
    setLocalMessages([welcomeUIMessage]);
  };
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };
  
  const handleSendMessage = async () => {
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
          // Use the new addMessageToChatHistory function to append the message
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
        // Reset streaming response
        setStreamingResponse('');
        
        // Create a temporary loading message
        const loadingId = uuidv4();
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
            setStreamingResponse(fullResponse);
            
            // Update the loading message with the current response
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
                
                // Use the new addMessageToChatHistory function to append the message
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
              } catch (err) {
                console.error('Error saving assistant response to Cosmos DB:', err);
                setError('Failed to save response to Cosmos DB. Using local storage only.');
              }
            }
          }
        );
        
        // Clear the input field
        setMessage('');
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message. Please try again.');
        
        // Remove the loading message
        setLocalMessages(prev => prev.filter(msg => msg.role !== 'assistant' || msg.content !== 'Thinking...'));
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Call the scrollToBottomHandler if provided
    if (scrollToBottomHandler) {
      scrollToBottomHandler();
    }
  }, [displayMessages, scrollToBottomHandler]);
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Render loading state
  if (isSessionLoading) {
    return (
      <div className="chat-panel">
        <div className="chat-messages">
          <div className="loading-message">
            <p>Loading chat session...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !displayMessages.length) {
    return (
      <div className="chat-panel">
        <div className="chat-messages">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {displayMessages.map((msg) => {
          // Debug log for message rendering
          debugLog(`Rendering message: ${msg.role} - ${msg.content.substring(0, 20)}...`);
          
          return (
            <div 
              key={msg.id} 
              className={`chat-message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-header">
                <span className="message-sender">{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="message-content">
                {msg.content}
              </div>
              {msg.references && msg.references.length > 0 && (
                <div className="message-references">
                  <h4>Related Items:</h4>
                  <ul>
                    {msg.references.map((ref, index) => (
                      <li key={index}>
                        <a href={`#item=${ref.id}`}>{ref.title}</a>
                        {ref.snippet && <p>{ref.snippet}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Error message display */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && !displayMessages.some(msg => msg.content === 'Thinking...') && (
          <div className="loading-indicator">
            <p>Loading...</p>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={isLoading}
        />
        <div className="chat-actions">
          <button 
            className="send-button" 
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
          >
            Send
          </button>
          <span className="chat-tip">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
