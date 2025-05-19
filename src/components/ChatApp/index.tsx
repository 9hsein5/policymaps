import * as React from 'react';
import './style.scss';

interface Props {
  // No props needed for the main index file
}

// This is the main entry point for the ChatApp component
const ChatApp: React.FC<Props> = () => {
  // Import the actual ChatAppContainer component
  const ChatAppContainer = React.lazy(() => import('./App/ChatAppContainer'));

  return (
    <React.Suspense fallback={<div className="loading-chat-app">Loading Chat Application...</div>}>
      <ChatAppContainer />
    </React.Suspense>
  );
};

export default ChatApp;
