import { createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { 
  sendMessageStart, 
  sendMessageSuccess, 
  sendMessageFailure,
  receiveMessage
} from '../reducers/chat';
import { ChatMessageProps } from '../../../components/BrowseApp/Chat/ChatMessage';
import { SmartSearchService } from '../../../services/SmartSearchService';
import { searchByTerm, searchByCategorySchema } from '../reducers/search';
import { setCenterLocation } from '../reducers/map';
import { geocodeLocation } from '../../../services/GeocodingService';

// Simulate API call for sending a message
export const sendChatMessage = createAsyncThunk(
  'browseApp/sendChatMessage',
  async (message: ChatMessageProps, { dispatch, getState }) => {
    try {
      dispatch(sendMessageStart());
      
      // Add user message to chat
      dispatch(sendMessageSuccess(message));
      
      // Process the message with smart search if it's text
      if (message.text) {
        const searchService = new SmartSearchService();
        const searchParams = await searchService.processNaturalLanguageQuery(message.text);
        
        // Dispatch search by term
        if (searchParams.cleanQuery) {
          dispatch(searchByTerm(searchParams.cleanQuery));
        }
        
        // Dispatch category search if categories found
        if (searchParams.categories.length > 0) {
          searchParams.categories.forEach(category => {
            dispatch(searchByCategorySchema({ category }));
          });
        }
        
        // Handle location if present
        if (searchParams.location) {
          try {
            const geocodeResult = await geocodeLocation(searchParams.location);
            if (geocodeResult) {
              dispatch(setCenterLocation({
                lat: geocodeResult.y,
                lon: geocodeResult.x,
                zoom: 10
              }));
            }
          } catch (error) {
            console.error('Error geocoding location:', error);
          }
        }
        
        // Generate a response based on the search parameters
        let responseText = 'I\'ll help you with that.';
        
        if (searchParams.location) {
          responseText += ` I'll look for information near ${searchParams.location}.`;
        }
        
        if (searchParams.categories.length > 0) {
          responseText += ` I'll focus on ${searchParams.categories.join(', ')}.`;
        }
        
        // Add system response
        setTimeout(() => {
          dispatch(receiveMessage({
            id: uuidv4(),
            text: responseText,
            isUser: false,
            timestamp: new Date()
          }));
        }, 1000);
      }
      
      return message;
    } catch (error) {
      dispatch(sendMessageFailure(error.message));
      throw error;
    }
  }
);

// Upload chat attachment
export const uploadChatAttachment = createAsyncThunk(
  'browseApp/uploadChatAttachment',
  async (file: File, { dispatch }) => {
    // In a real implementation, this would upload to a server
    // For now, we'll create a local object URL
    const url = URL.createObjectURL(file);
    
    return {
      name: file.name,
      url,
      size: file.size,
      type: file.type
    };
  }
);
