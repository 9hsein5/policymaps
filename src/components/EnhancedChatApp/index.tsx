import * as React from 'react';
import './style.scss';

interface Props {
  // No props needed for the main index file
}

// This is the main entry point for the EnhancedChatApp component
const EnhancedChatApp: React.FC<Props> = () => {
  // Import the actual EnhancedChatAppContainer component
  const EnhancedChatAppContainer = React.lazy(() => import('./App/EnhancedChatAppContainer'));
  
  return (
    <React.Suspense fallback={<div className="loading-chat-app">Loading Enhanced Chat Application...</div>}>
      <EnhancedChatAppContainer />
    </React.Suspense>
  );
};

export default EnhancedChatApp;
