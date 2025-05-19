import * as React from 'react';
import './style.scss';

interface Props {
  // No props needed for the main index file
}

// This is the main entry point for the EnhancedChatApp component
const EnhancedChatApp: React.FC<Props> = () => {
  // Import the actual EnhancedChatAppWithBrowseComponents component
  const EnhancedChatAppWithBrowseComponents = React.lazy(() => import('./App/EnhancedChatAppWithBrowseComponents'));
  
  // Initialize with empty arrays/values that will be populated by the actual implementation
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searchResultsCount, setSearchResultsCount] = React.useState<number>(0);
  
  return (
    <React.Suspense fallback={<div className="loading-chat-app">Loading Enhanced Chat Application...</div>}>
      <EnhancedChatAppWithBrowseComponents 
        searchResults={searchResults}
        searchResultsCount={searchResultsCount}
      />
    </React.Suspense>
  );
};

export default EnhancedChatApp;
