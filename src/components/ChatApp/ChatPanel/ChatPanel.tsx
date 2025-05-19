import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import './style.scss';

interface Props {
  onChatMessageSend?: (message: string) => void;
}

const ChatPanel: React.FC<Props> = ({ onChatMessageSend }) => {
  const [message, setMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<Array<{type: string, content: string}>>([
    {type: 'system', content: 'Welcome to the Lebanese Red Cross Map Chat! Ask me about available datasets or how to find specific information.'},
    {type: 'system', content: 'Try asking about "flood maps", "refugee camps", or "healthcare facilities in Lebanon".'}
  ]);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat history
    setChatHistory(prev => [...prev, {type: 'user', content: message}]);
    
    // Call the callback function if provided
    if (onChatMessageSend) {
      onChatMessageSend(message);
    }
    
    // Add a "typing" indicator
    setChatHistory(prev => [...prev, {type: 'system-typing', content: '...'}]);
    
    // Simulate response delay
    setTimeout(() => {
      // Remove typing indicator
      setChatHistory(prev => prev.filter(msg => msg.type !== 'system-typing'));
      
      // Add system response based on message content
      let responseMessage = '';
      
      if (message.toLowerCase().includes('flood') || message.toLowerCase().includes('flooding')) {
        responseMessage = 'I found some flood-related datasets. Check the results tab to see them.';
      } else if (message.toLowerCase().includes('earthquake')) {
        responseMessage = 'Here are some earthquake datasets that might be helpful.';
      } else if (message.toLowerCase().includes('refugee') || message.toLowerCase().includes('camp')) {
        responseMessage = 'I found some refugee camp datasets. See the results tab.';
      } else if (message.toLowerCase().includes('health') || message.toLowerCase().includes('hospital')) {
        responseMessage = 'I found healthcare facility datasets in Lebanon. Check the results tab.';
      } else {
        responseMessage = 'I\'ll search for relevant datasets based on your query. Please check the results tab.';
      }
      
      setChatHistory(prev => [...prev, {type: 'system', content: responseMessage}]);
    }, 1500);
    
    setMessage('');
  };

  // Auto-scroll to bottom when chat history changes
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={chatContainerRef}>
        {chatHistory.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.type}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      <form className="chat-input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask about datasets or locations..."
          value={message}
          onChange={handleInputChange}
        />
        <button type="submit" className="chat-send-button">
          <span className="icon-ui-send"></span>
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
