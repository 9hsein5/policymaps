import * as React from 'react';
import EnhancedSidePanel from '../SidePanel/EnhancedSidePanel';
import EnhancedChatAgentPanel from '../ChatPanel/EnhancedChatAgentPanel';
import EnhancedSearchPanel from '../SearchPanel/EnhancedSearchPanel';
import EnhancedResultsPanel from '../ResultsPanel/EnhancedResultsPanel';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { SiteContext } from '../../../contexts/SiteContextProvider';
import './style.scss';

interface Props {
  searchResults: AgolItem[];
  searchResultsCount: number;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSearchTermChange?: (searchTerm: string) => void;
  onChatMessageSend?: (message: string) => void;
  categorySchema?: any;
}

const EnhancedChatAppIntegrated: React.FC<Props> = ({
  searchResults,
  searchResultsCount,
  activeTab = 'chat',
  onTabChange,
  onSearchTermChange,
  onChatMessageSend,
  categorySchema
}) => {
  const { isEmbedded } = React.useContext(SiteContext);
  const [userId] = React.useState<string>('anonymous');
  const [sidebarScrolledToEnd, setSidebarScrolledToEnd] = React.useState<boolean>(false);

  const handleSidebarScrollToEnd = () => {
    setSidebarScrolledToEnd(true);
    // Additional logic for loading more content can be added here
  };
  
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Render the appropriate panel based on active tab
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <EnhancedChatAgentPanel 
            onChatMessageSend={onChatMessageSend}
            searchResults={searchResults}
            onTabChange={handleTabChange}
          />
        );
      case 'search':
        return (
          <EnhancedSearchPanel 
            onSearchTermChange={onSearchTermChange}
          />
        );
      case 'results':
        return (
          <EnhancedResultsPanel 
            searchResults={searchResults}
            searchResultsCount={searchResultsCount}
          />
        );
      default:
        return (
          <EnhancedChatAgentPanel 
            onChatMessageSend={onChatMessageSend}
            searchResults={searchResults}
            onTabChange={handleTabChange}
          />
        );
    }
  };

  return (
    <div className="enhanced-chat-app-container">
      <div className="enhanced-chat-app-content">
        <div className="side-panel-container">
          <EnhancedSidePanel
            activeTab={activeTab}
            onTabChange={handleTabChange}
            searchResults={searchResults}
            searchResultsCount={searchResultsCount}
            onSearchTermChange={onSearchTermChange}
            onChatMessage={onChatMessageSend}
            userId={userId}
            scrollToBottomHandler={handleSidebarScrollToEnd}
          />
          <div className="side-panel-content">
            {renderActivePanel()}
          </div>
        </div>
        <div className="map-container">
          {/* Map view will be implemented in a separate component */}
          <div className="map-placeholder">
            <span>Map View</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatAppIntegrated;
