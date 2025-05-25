import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessageProps } from '../../../components/BrowseApp/Chat/ChatMessage';
import { RootState } from '../configureStore';

interface ChatState {
  messages: ChatMessageProps[];
  isLoading: boolean;
  error: string | null;
  isChatOpen: boolean;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  isChatOpen: false
};

const chatSlice = createSlice({
  name: 'browseApp/chat',
  initialState,
  reducers: {
    sendMessageStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    sendMessageSuccess: (state, action: PayloadAction<ChatMessageProps>) => {
      state.messages.push(action.payload);
      state.isLoading = false;
    },
    receiveMessage: (state, action: PayloadAction<ChatMessageProps>) => {
      state.messages.push(action.payload);
    },
    sendMessageFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
    },
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
    },
    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isChatOpen = action.payload;
    }
  }
});

export const {
  sendMessageStart,
  sendMessageSuccess,
  receiveMessage,
  sendMessageFailure,
  clearChat,
  toggleChat,
  setChatOpen
} = chatSlice.actions;

export const selectChatMessages = (state: RootState) => state.chat.messages;
export const selectChatLoading = (state: RootState) => state.chat.isLoading;
export const selectChatError = (state: RootState) => state.chat.error;
export const selectIsChatOpen = (state: RootState) => state.chat.isChatOpen;

export default chatSlice.reducer;
