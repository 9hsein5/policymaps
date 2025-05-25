import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import ChatPanel from './ChatPanel';
import { ChatMessageProps, ChatAttachment } from './ChatMessage';
import { sendChatMessage, uploadChatAttachment } from '../../../store/browseApp/thunks/chat';
import { selectChatMessages, selectChatLoading } from '../../../store/browseApp/reducers/chat';
import { processDocumentForMap } from '../../../services/DocumentProcessingService';

interface Props {
  isVisible: boolean;
}

const ChatContainer: React.FC<Props> = ({
  isVisible
}) => {
  const dispatch = useDispatch();
  const messages = useSelector(selectChatMessages);
  const isLoading = useSelector(selectChatLoading);
  
  const handleSendMessage = async (text: string, files: File[]) => {
    // Generate a unique ID for the message
    const messageId = uuidv4();
    
    // Handle file uploads first
    let attachments: ChatAttachment[] = [];
    
    if (files.length > 0) {
      // Process each file
      for (const file of files) {
        try {
          // Upload the file
          const uploadResult = await dispatch(uploadChatAttachment(file));
          
          // Determine file type
          let fileType: 'document' | 'image' | 'geojson' | 'shapefile' = 'document';
          if (file.type.startsWith('image/')) {
            fileType = 'image';
          } else if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
            fileType = 'geojson';
          } else if (file.name.endsWith('.shp') || file.name.endsWith('.zip')) {
            fileType = 'shapefile';
          }
          
          // Create attachment object
          const attachment: ChatAttachment = {
            id: uuidv4(),
            name: file.name,
            type: fileType,
            url: (uploadResult.payload as { url: string }).url,
            appliedToMap: false
          };
          
          attachments.push(attachment);
          
          // Process document for map if applicable
          if (fileType === 'geojson' || fileType === 'shapefile') {
            try {
              await processDocumentForMap(attachment.url);
              
              // Update attachment to show it's applied to map
              attachments = attachments.map(a => 
                a.id === attachment.id ? { ...a, appliedToMap: true } : a
              );
            } catch (error) {
              console.error('Error processing document for map:', error);
            }
          }
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
    }
    
    // Send the message
    dispatch(sendChatMessage({
      id: messageId,
      text,
      isUser: true,
      timestamp: new Date(),
      attachments
    }));
  };
  
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }
  
  return (
    <ChatPanel
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
    />
  );
};

export default ChatContainer;
