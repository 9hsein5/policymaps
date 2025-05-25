import * as React from 'react';
import ChatMessage, { ChatMessageProps } from './ChatMessage';
import ChatInput from './ChatInput';

interface Props {
  messages: ChatMessageProps[];
  onSendMessage: (text: string, files: File[]) => void;
  isLoading?: boolean;
}

const ChatPanel: React.FC<Props> = ({
  messages,
  onSendMessage,
  isLoading = false
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <span className="icon-ui-chat"></span>
            </div>
            <div className="chat-empty-text">
              <p>Ask questions about the data or upload documents to analyze.</p>
              <p>Examples:</p>
              <ul>
                <li>"Show me healthcare facilities in Chicago"</li>
                <li>"What's the population density in coastal areas?"</li>
                <li>"Upload and analyze my demographic data"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <ChatMessage
              key={message.id}
              {...message}
            />
          ))
        )}
        
        {isLoading && (
          <div className="chat-loading">
            <div className="chat-loading-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput
        onSendMessage={onSendMessage}
        disabled={isLoading}
      />
    </div>
  );
};

export default ChatPanel;
