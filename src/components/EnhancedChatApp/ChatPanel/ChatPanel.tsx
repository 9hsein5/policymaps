import * as React from 'react';
import './style.scss';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

interface ChatPanelProps {
  userId?: string;
  onChatMessageSend?: (message: string) => void;
  scrollToBottomHandler?: () => void;
  messages?: any[];
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  userId = 'anonymous', 
  onChatMessageSend,
  scrollToBottomHandler,
  messages = []
}) => {
  const [message, setMessage] = React.useState<string>('');
  const [localMessages, setLocalMessages] = React.useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Welcome to Policy Maps Chat! Ask questions about maps, data layers, or specific geographic areas.',
      sender: 'system',
      timestamp: new Date()
    }
  ]);
  
  // Combine local messages with passed-in messages
  const allMessages = React.useMemo(() => {
    if (messages && messages.length > 0) {
      return [...localMessages, ...messages];
    }
    return localMessages;
  }, [localMessages, messages]);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };
  
  const handleSendMessage = () => {
    if (message.trim()) {
      // Add user message to local state
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message,
        sender: 'user',
        timestamp: new Date()
      };
      
      setLocalMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Call the onChatMessageSend callback if provided
      if (onChatMessageSend) {
        onChatMessageSend(message);
      }
      
      // Clear the input
      setMessage('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Call the scrollToBottomHandler if provided
    if (scrollToBottomHandler) {
      scrollToBottomHandler();
    }
  }, [allMessages]);
  
  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {allMessages.map(msg => (
          <div 
            key={msg.id} 
            className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'system-message'}`}
          >
            <div className="message-content">{msg.text}</div>
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="Ask about maps, data layers, or specific geographic areas..."
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
        />
        <div className="chat-actions">
          <button className="send-button" onClick={handleSendMessage}>
            Send
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
