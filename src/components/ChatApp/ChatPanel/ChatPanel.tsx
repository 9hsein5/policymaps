import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { ChatMessage, generateStreamingChatCompletion, extractSearchKeywords } from '../services/azure-openai/chat';
import { searchForContext } from '../services/azure-search/search';
import './style.scss';

interface Props {
  onChatMessageSend?: (message: string) => void;
}

const ChatPanel: React.FC<Props> = ({ onChatMessageSend }) => {
  const [message, setMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'Welcome to the Lebanese Red Cross Map Chat! Ask me about available datasets or how to find specific information.'
    },
    {
      role: 'assistant',
      content: 'Hello! I can help you find geospatial datasets and information. Try asking about "flood maps", "refugee camps", or "healthcare facilities in Lebanon".'
    }
  ]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [currentResponse, setCurrentResponse] = React.useState('');
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat history
    const userMessage: ChatMessage = {
      role: 'user',
      content: message
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    // Call the callback function if provided
    if (onChatMessageSend) {
      onChatMessageSend(message);
    }
    
    // Set typing indicator
    setIsTyping(true);
    setCurrentResponse('');
    
    try {
      // Get relevant context from Azure AI Search
      const contextResults = await searchForContext(message);
      
      // Prepare messages for completion
      const messagesForCompletion = [...chatHistory, userMessage];
      
      // Add context if available
      if (contextResults.length > 0) {
        const contextMessage: ChatMessage = {
          role: 'system',
          content: `Here is some relevant information that might help with the response:\n\n${contextResults.join('\n\n')}`
        };
        messagesForCompletion.push(contextMessage);
      }
      
      // Generate streaming completion
      await generateStreamingChatCompletion(
        messagesForCompletion,
        (chunk: string) => {
          setCurrentResponse(prev => prev + chunk);
        }
      );
      
      // Add assistant response to chat history
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: currentResponse
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
      setCurrentResponse('');
    } catch (error) {
      console.error('Error generating chat response:', error);
      
      // Add error message to chat history
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error while generating a response. Please try again later.'
        }
      ]);
    } finally {
      setIsTyping(false);
      setMessage('');
    }
  };

  // Auto-scroll to bottom when chat history or current response changes
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, currentResponse]);

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={chatContainerRef}>
        {chatHistory.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="chat-message assistant">
            <div className="message-content">
              {currentResponse || <span className="typing-indicator">...</span>}
            </div>
          </div>
        )}
      </div>
      
      <form className="chat-input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask about datasets or locations..."
          value={message}
          onChange={handleInputChange}
          disabled={isTyping}
        />
        <button type="submit" className="chat-send-button" disabled={isTyping || !message.trim()}>
          <span className="icon-ui-send"></span>
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
