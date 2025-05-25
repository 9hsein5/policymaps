import * as React from 'react';

export interface ChatMessageProps {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'document' | 'image' | 'geojson' | 'shapefile';
  url: string;
  appliedToMap?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  text,
  isUser,
  timestamp,
  attachments = []
}) => {
  return (
    <div className={`chat-message ${isUser ? 'chat-message-user' : 'chat-message-system'}`}>
      <div className="chat-message-content">
        <div className="chat-message-text">{text}</div>
        
        {attachments.length > 0 && (
          <div className="chat-message-attachments">
            {attachments.map(attachment => (
              <div key={attachment.id} className="chat-attachment">
                <span className="chat-attachment-icon">
                  {attachment.type === 'document' && <span className="icon-ui-documentation"></span>}
                  {attachment.type === 'image' && <span className="icon-ui-image"></span>}
                  {attachment.type === 'geojson' && <span className="icon-ui-map"></span>}
                  {attachment.type === 'shapefile' && <span className="icon-ui-layers"></span>}
                </span>
                <span className="chat-attachment-name">{attachment.name}</span>
                {attachment.appliedToMap && (
                  <span className="chat-attachment-applied">Applied to map</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="chat-message-meta">
        <span className="chat-message-time">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
