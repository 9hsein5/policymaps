import * as React from 'react';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { Tier } from '../../../AppConfig';
import './style.scss';

// Interface for chat2geo-like agent capabilities
interface ChatAgentCapabilities {
  understandSpatialQueries: boolean;
  suggestRelevantLayers: boolean;
  processNaturalLanguage: boolean;
  contextualAwareness: boolean;
}

// Interface for chat message
interface ChatMessage {
  type: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  relatedItems?: AgolItem[];
  suggestedQueries?: string[];
}

interface Props {
  onChatMessageSend?: (message: string) => void;
  searchResults?: AgolItem[];
  onTabChange?: (tab: string) => void;
}

const EnhancedChatAgentPanel: React.FC<Props> = ({
  onChatMessageSend,
  searchResults = [],
  onTabChange
}) => {
  const [message, setMessage] = React.useState<string>('');
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([
    {
      type: 'system',
      text: 'Welcome to Policy Maps Chat! Ask questions about maps, data layers, or specific geographic areas.',
      timestamp: Date.now()
    }
  ]);
  
  // Chat agent capabilities - mimicking chat2geo agentic features
  const agentCapabilities: ChatAgentCapabilities = {
    understandSpatialQueries: true,
    suggestRelevantLayers: true,
    processNaturalLanguage: true,
    contextualAwareness: true
  };
  
  // Context for the chat agent
  const [agentContext, setAgentContext] = React.useState({
    currentLocation: null,
    recentTopics: [],
    activeMapLayers: [],
    userPreferences: {
      preferredDataTypes: [],
      recentSearches: []
    }
  });
  
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when history changes
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  // Update agent context when search results change
  React.useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      // Extract topics from search results to inform agent context
      const topics = searchResults.map(item => item.title.toLowerCase())
        .filter(title => title.length > 0);
      
      setAgentContext(prev => ({
        ...prev,
        recentTopics: Array.from(new Set([...topics, ...prev.recentTopics])).slice(0, 5)
      }));
    }
  }, [searchResults]);
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat history
    const userMessage: ChatMessage = {
      type: 'user',
      text: message,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    // Call the onChatMessageSend callback if provided
    if (onChatMessageSend) {
      onChatMessageSend(message);
    }
    
    // Process the message with chat2geo-like agent
    processMessageWithAgent(message);
    
    // Clear the input
    setMessage('');
  };
  
  // Process message with chat2geo-like agent capabilities
  const processMessageWithAgent = (userMessage: string) => {
    // Simulate processing delay
    setTimeout(() => {
      const response = generateAgentResponse(userMessage);
      setChatHistory(prev => [...prev, response]);
      
      // If the response has related items, suggest switching to results tab
      if (response.relatedItems && response.relatedItems.length > 0) {
        if (onTabChange) {
          setTimeout(() => {
            onTabChange('results');
          }, 1000);
        }
      }
      
      // Update agent context based on the interaction
      updateAgentContext(userMessage, response);
    }, 1000);
  };
  
  // Generate agent response with chat2geo-like capabilities
  const generateAgentResponse = (userMessage: string): ChatMessage => {
    const lowerMessage = userMessage.toLowerCase();
    let response: ChatMessage = {
      type: 'assistant',
      text: '',
      timestamp: Date.now()
    };
    
    // Detect spatial queries
    if (containsSpatialQuery(lowerMessage)) {
      response.text = "I've identified your spatial query. Let me find relevant map layers for this area.";
      response.relatedItems = generateMockRelatedItems('spatial');
      response.suggestedQueries = [
        "Show me more details about this area",
        "What other data is available for this region?",
        "Compare this with neighboring areas"
      ];
    }
    // Detect topic-specific queries
    else if (containsTopicQuery(lowerMessage)) {
      const topic = extractTopic(lowerMessage);
      response.text = `I found several ${topic}-related maps and data layers that might be helpful. You can view them in the Results tab.`;
      response.relatedItems = generateMockRelatedItems(topic);
      response.suggestedQueries = [
        `Show me more ${topic} data`,
        `How does ${topic} compare across different regions?`,
        `What factors influence ${topic} in this area?`
      ];
    }
    // Handle help requests
    else if (lowerMessage.includes('help') || lowerMessage.includes('how to')) {
      response.text = "You can ask me questions about maps and data layers in our collection. Try asking about specific topics like 'health', 'housing', or 'disaster risk'. You can also ask about specific geographic areas.";
    }
    // Default response with contextual awareness
    else {
      response.text = "I understand you're looking for information. Could you provide more details about what specific maps or data you're interested in? You can ask about topics like health, housing, or specific geographic areas.";
      
      // Add contextual suggestions based on recent topics
      if (agentContext.recentTopics.length > 0) {
        response.text += ` Based on your recent interests, you might want to explore data related to ${agentContext.recentTopics[0]}.`;
        response.suggestedQueries = [
          `Show me maps related to ${agentContext.recentTopics[0]}`,
          "What are the most viewed maps in the collection?",
          "Show me the latest data layers added"
        ];
      }
    }
    
    return response;
  };
  
  // Helper functions for chat2geo-like capabilities
  
  // Detect if message contains spatial query
  const containsSpatialQuery = (message: string): boolean => {
    const spatialKeywords = ['where', 'location', 'area', 'region', 'city', 'country', 'near', 'around', 'map of'];
    return spatialKeywords.some(keyword => message.includes(keyword));
  };
  
  // Detect if message contains topic query
  const containsTopicQuery = (message: string): boolean => {
    const topicKeywords = ['health', 'hospital', 'housing', 'home', 'disaster', 'risk', 'emergency', 'inclusion', 'equity', 'transportation'];
    return topicKeywords.some(keyword => message.includes(keyword));
  };
  
  // Extract topic from message
  const extractTopic = (message: string): string => {
    const topics = {
      health: ['health', 'hospital', 'medical', 'healthcare'],
      housing: ['housing', 'home', 'apartment', 'residence'],
      disaster: ['disaster', 'risk', 'emergency', 'hazard'],
      inclusion: ['inclusion', 'equity', 'diversity', 'accessibility'],
      transportation: ['transportation', 'transit', 'commute', 'travel']
    };
    
    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return topic;
      }
    }
    
    return 'general';
  };
  
  // Generate mock related items based on query type
  const generateMockRelatedItems = (queryType: string): AgolItem[] => {
    // In a real implementation, this would query ArcGIS Online
    // For now, return mock items based on query type
    const mockItems: AgolItem[] = [];
    
    if (queryType === 'health') {
      mockItems.push({
        id: 'health1',
        title: 'Healthcare Facilities Map',
        type: 'Web Map',
        snippet: 'Map showing hospitals, clinics, and other healthcare facilities',
        thumbnailUrl: '',
        modified: Date.now()
      });
    } else if (queryType === 'housing') {
      mockItems.push({
        id: 'housing1',
        title: 'Housing Affordability Index',
        type: 'Web Map',
        snippet: 'Map showing housing affordability across different regions',
        thumbnailUrl: '',
        modified: Date.now()
      });
    } else if (queryType === 'spatial') {
      mockItems.push({
        id: 'spatial1',
        title: 'Regional Analysis Map',
        type: 'Web Map',
        snippet: 'Detailed map of the requested region with multiple data layers',
        thumbnailUrl: '',
        modified: Date.now()
      });
    }
    
    return mockItems;
  };
  
  // Update agent context based on interaction
  const updateAgentContext = (userMessage: string, response: ChatMessage) => {
    const topic = extractTopic(userMessage);
    
    setAgentContext(prev => ({
      ...prev,
      recentTopics: [topic, ...prev.recentTopics.filter(t => t !== topic)].slice(0, 5),
      userPreferences: {
        ...prev.userPreferences,
        recentSearches: [userMessage, ...prev.userPreferences.recentSearches].slice(0, 5)
      }
    }));
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
                  {msg.relatedItems.map((item, itemIndex) => (
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
          />
          <button type="submit" className="send-button">
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
