import * as React from 'react';
import { createEnhancedChatAgent } from '../services/chat-agent';
import { ChatMessage } from '../services/azure-openai/chat';
import { SearchResult } from '../services/azure-search/search';
import './enhanced-chat-agent-style.scss';

interface Props {
  onChatMessageSend?: (message: string) => void;
  searchResults?: any[];
  onTabChange?: (tab: string) => void;
}

const EnhancedChatAgentPanel: React.FC<Props> = ({
  onChatMessageSend,
  searchResults = [],
  onTabChange
}) => {
  const [message, setMessage] = React.useState<string>('');
  const [chatHistory, setChatHistory] = React.useState<Array<{
    type: 'system' | 'user' | 'assistant';
    text: string;
    timestamp: number;
    relatedItems?: SearchResult[];
    suggestedQueries?: string[];
  }>>([
    {
      type: 'system',
      text: 'Welcome to Policy Maps Chat! Ask questions about maps, data layers, or specific geographic areas.',
      timestamp: Date.now()
    }
  ]);
  
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [streamingResponse, setStreamingResponse] = React.useState<string>('');
  const [userId] = React.useState<string>('anonymous');
  
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const chatAgentRef = React.useRef(createEnhancedChatAgent(userId, {
    onSearchResults: (results) => {
      if (onTabChange && results.length > 0) {
        // Optionally switch to results tab when search results are available
        // onTabChange('results');
      }
    }
  }));
  
  // Load chat history on component mount
  React.useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await chatAgentRef.current.loadChatHistory();
        
        if (history.length > 0) {
          const formattedHistory = history.map(msg => ({
            type: msg.role as 'user' | 'assistant',
            text: msg.content,
            timestamp: Date.now() - (history.indexOf(msg) * 60000) // Approximate timestamps
          }));
          
          setChatHistory(prev => [
            prev[0], // Keep the system welcome message
            ...formattedHistory
          ]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    
    loadHistory();
  }, []);
  
  // Scroll to bottom of chat when history changes
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, streamingResponse]);
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;
    
    // Add user message to chat history
    const userMessage = {
      type: 'user' as const,
      text: message,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    // Call the onChatMessageSend callback if provided
    if (onChatMessageSend) {
      onChatMessageSend(message);
    }
    
    // Clear the input
    setMessage('');
    
    // Set loading state
    setIsLoading(true);
    setStreamingResponse('');
    
    try {
      // Use streaming response for better UX
      await chatAgentRef.current.sendStreamingMessage(
        message,
        (chunk) => {
          setStreamingResponse(prev => prev + chunk);
        },
        (relatedItems, suggestedQueries) => {
          // When streaming is complete, add the full response to chat history
          setChatHistory(prev => [
            ...prev,
            {
              type: 'assistant',
              text: streamingResponse,
              timestamp: Date.now(),
              relatedItems,
              suggestedQueries
            }
          ]);
          
          // Clear streaming response and loading state
          setStreamingResponse('');
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat history
      setChatHistory(prev => [
        ...prev,
        {
          type: 'assistant',
          text: 'Sorry, I encountered an error while processing your request. Please try again later.',
          timestamp: Date.now()
        }
      ]);
      
      // Clear streaming response and loading state
      setStreamingResponse('');
      setIsLoading(false);
    }
  };
  
  // Function to format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="enhanced-chat-agent-panel">
      <div className="chat-history" ref={chatContainerRef}>
        {chatHistory.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.type}`}>
            <div className="message-content">
              <span className="message-text">{msg.text}</span>
              
              {/* Display related items if available */}
              {msg.relatedItems && msg.relatedItems.length > 0 && (
                <div className="related-items">
                  <div className="related-items-header">Related Maps:</div>
                  {msg.relatedItems.slice(0, 3).map((item, itemIndex) => (
                    <div key={itemIndex} className="related-item">
                      <span className="icon-ui-map"></span>
                      <span>{item.title}</span>
                    </div>
                  ))}
                  <button 
                    className="view-results-btn"
                    onClick={() => onTabChange && onTabChange('results')}
                  >
                    View in Results
                  </button>
                </div>
              )}
              
              {/* Display suggested queries if available */}
              {msg.suggestedQueries && msg.suggestedQueries.length > 0 && (
                <div className="suggested-queries">
                  <div className="suggested-queries-header">You might want to ask:</div>
                  <div className="suggested-queries-list">
                    {msg.suggestedQueries.map((query, queryIndex) => (
                      <button 
                        key={queryIndex} 
                        className="suggested-query"
                        onClick={() => {
                          setMessage(query);
                          // Focus the textarea
                          const textarea = document.querySelector('.chat-input') as HTMLTextAreaElement;
                          if (textarea) {
                            textarea.focus();
                          }
                        }}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}
        
        {/* Show streaming response if available */}
        {streamingResponse && (
          <div className="chat-message assistant">
            <div className="message-content">
              <span className="message-text">{streamingResponse}</span>
              <span className="message-time">{formatTime(Date.now())}</span>
            </div>
          </div>
        )}
        
        {/* Show typing indicator when loading */}
        {isLoading && !streamingResponse && (
          <div className="chat-message assistant">
            <div className="message-content typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="chat-input-container">
          <textarea
            className="chat-input"
            placeholder="Ask about maps, data layers, or geographic areas..."
            value={message}
            onChange={handleMessageChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isLoading}
          />
          <button type="submit" className="send-button" disabled={isLoading}>
            <span className="icon-ui-send"></span>
          </button>
        </div>
        <div className="chat-input-help">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
};

export default EnhancedChatAgentPanel;
