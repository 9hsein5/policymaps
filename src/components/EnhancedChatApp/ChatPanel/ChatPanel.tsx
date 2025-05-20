import * as React from 'react';
import './style.scss';
import { v4 as uuidv4 } from 'uuid';

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
  const [initialMessageSent, setInitialMessageSent] = React.useState<boolean>(false);
  
  // Use only messages from props if available, otherwise use a welcome message
  const displayMessages = React.useMemo(() => {
    if (messages && messages.length > 0) {
      return messages;
    } else if (!initialMessageSent) {
      // Only show welcome message if no messages from props and we haven't set initial message
      setInitialMessageSent(true);
      return [{
        id: uuidv4(),
        text: 'Welcome to Policy Maps Chat! Ask questions about maps, data layers, or specific geographic areas.',
        sender: 'system',
        timestamp: new Date()
      }];
    }
    return [];
  }, [messages, initialMessageSent]);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };
  
  const handleSendMessage = () => {
    if (message.trim()) {
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
  }, [displayMessages, scrollToBottomHandler]);
  
  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {displayMessages.map((msg, index) => (
          <div 
            key={msg.id || `msg-${index}-${Date.now()}`} // Fallback to index + timestamp if ID is missing
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
