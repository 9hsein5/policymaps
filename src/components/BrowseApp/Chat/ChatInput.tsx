import * as React from 'react';

interface Props {
  onSendMessage: (text: string, files: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<Props> = ({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false
}) => {
  const [message, setMessage] = React.useState('');
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSendMessage(message, files);
      setMessage('');
      setFiles([]);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  return (
    <div className="chat-input">
      {files.length > 0 && (
        <div className="chat-input-files">
          {files.map((file, index) => (
            <div key={index} className="chat-input-file">
              <span className="chat-input-file-name">{file.name}</span>
              <button 
                className="chat-input-file-remove" 
                onClick={() => removeFile(index)}
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="chat-input-container">
        <textarea
          className="chat-input-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
        
        <div className="chat-input-actions">
          <button
            className="chat-input-attach"
            onClick={handleAttachClick}
            disabled={disabled}
            aria-label="Attach file"
          >
            <span className="icon-ui-attachment"></span>
          </button>
          
          <button
            className="chat-input-send"
            onClick={handleSend}
            disabled={disabled || (!message.trim() && files.length === 0)}
            aria-label="Send message"
          >
            <span className="icon-ui-send"></span>
          </button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="chat-input-file-hidden"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.geojson,.json,.zip,.shp,.jpg,.jpeg,.png"
          title="Attach files"
          placeholder="Attach files"
        />
      </div>
    </div>
  );
};

export default ChatInput;
