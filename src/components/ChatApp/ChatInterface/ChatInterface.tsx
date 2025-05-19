import * as React from 'react';
import './style.scss';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

interface Props {
  messages: Message[];
  onSendMessage: (message: string) => void;
}

const ChatInterface: React.FC<Props> = ({
  messages = [],
  onSendMessage
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender === 'user' ? 'user-message' : 'system-message'}`}
          >
            <div className="message-content">{message.text}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask about maps and datasets..."
          value={inputValue}
          onChange={handleInputChange}
        />
        <button type="submit" className="send-button">
          <span className="icon-ui-send"></span>
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
