import * as React from 'react';
import './style.scss';
import ChatContainer from './ChatContainer';
import ChatToggle from './ChatToggle';
import { useDispatch, useSelector } from 'react-redux';
import { toggleChat, selectIsChatOpen } from '../../../store/browseApp/reducers/chat';

export { ChatContainer, ChatToggle };

// Export a default component that combines both
const Chat: React.FC = () => {
  const dispatch = useDispatch();
  const isChatOpen = useSelector(selectIsChatOpen);
  
  const handleToggleChat = () => {
    dispatch(toggleChat());
  };
  
  return (
    <>
      <div className={`chat-container ${isChatOpen ? 'chat-container-open' : ''}`}>
        <ChatContainer isVisible={isChatOpen} />
      </div>
      <ChatToggle isOpen={isChatOpen} onClick={handleToggleChat} />
    </>
  );
};

export default Chat;
