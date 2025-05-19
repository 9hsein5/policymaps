import * as React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import EnhancedChatPanel from '../ChatPanel/EnhancedChatPanel';
import EnhancedSearchPanel from '../SearchPanel/EnhancedSearchPanel';
import EnhancedResultsPanel from '../ResultsPanel/EnhancedResultsPanel';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { IGroupCategory } from '@esri/arcgis-rest-portal';
import './style.scss';

interface Props {
  isOpen?: boolean;
  onToggle?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSearchResults?: (results: any[], count: number) => void;
  onChatMessage?: (message: string) => void;
  onSearchTermChange?: (term: string) => void;
  searchResults?: AgolItem[];
  searchResultsCount?: number;
  userId?: string;
  scrollToBottomHandler?: () => void;
  categorySchema?: IGroupCategory; // Added missing prop
}

const EnhancedSidePanel: React.FC<Props> = ({
  isOpen = true,
  onToggle,
  activeTab = 'chat',
  onTabChange,
  onSearchResults,
  onChatMessage,
  onSearchTermChange,
  searchResults = [],
  searchResultsCount = 0,
  userId,
  scrollToBottomHandler,
  categorySchema
}) => {
  // Map activeTab string to tab index
  const getTabIndex = (tab: string): number => {
    switch (tab) {
      case 'chat': return 0;
      case 'search': return 1;
      case 'results': return 2;
      default: return 0;
    }
  };
  
  // Map tab index to activeTab string
  const getTabName = (index: number): string => {
    switch (index) {
      case 0: return 'chat';
      case 1: return 'search';
      case 2: return 'results';
      default: return 'chat';
    }
  };
  
  const [tabIndex, setTabIndex] = React.useState<number>(getTabIndex(activeTab));
  
  // Update tabIndex when activeTab prop changes
  React.useEffect(() => {
    setTabIndex(getTabIndex(activeTab));
  }, [activeTab]);
  
  // Handle tab selection
  const handleTabSelect = (index: number) => {
    setTabIndex(index);
    if (onTabChange) {
      onTabChange(getTabName(index));
    }
  };
  
  // Handle search results
  const handleSearchResults = (results: any[], count: number) => {
    if (onSearchResults) {
      onSearchResults(results, count);
    }
  };
  
  // Handle chat message
  const handleChatMessage = (message: string) => {
    if (onChatMessage) {
      onChatMessage(message);
    }
  };
  
  // Handle search term change
  const handleSearchTermChange = (term: string) => {
    if (onSearchTermChange) {
      onSearchTermChange(term);
    }
  };
  
  // Reset tab state when panel is closed
  React.useEffect(() => {
    if (!isOpen) {
      // Don't change the active tab, just ensure UI is updated
      console.log('Side panel closed, maintaining tab state for when reopened');
    }
  }, [isOpen]);
  
  // Debug logging
  React.useEffect(() => {
    console.log('EnhancedSidePanel - isOpen:', isOpen);
    console.log('EnhancedSidePanel - activeTab:', activeTab);
    console.log('EnhancedSidePanel - tabIndex:', tabIndex);
  }, [isOpen, activeTab, tabIndex]);
  
  if (!isOpen) {
    return (
      <div className="enhanced-side-panel-collapsed">
        <button className="open-panel-button" onClick={onToggle}>
          Open Panel
        </button>
      </div>
    );
  }
  
  return (
    <div className="enhanced-chat-side-panel">
      <div className="panel-header">
        <h2>Policy Maps</h2>
        <button className="close-panel-button" onClick={onToggle}>
          ×
        </button>
      </div>
      
      <Tabs
        selectedIndex={tabIndex}
        onSelect={handleTabSelect}
        className="side-panel-tabs"
      >
        <TabList className="tab-list">
          <Tab className="tab" selectedClassName="tab-selected">Chat</Tab>
          <Tab className="tab" selectedClassName="tab-selected">Search</Tab>
          <Tab className="tab" selectedClassName="tab-selected">Results</Tab>
        </TabList>
        
        <TabPanel className="tab-panel">
          <EnhancedChatPanel 
            onChatMessageSend={handleChatMessage} 
            userId={userId}
            scrollToBottomHandler={scrollToBottomHandler}
          />
        </TabPanel>
        
        <TabPanel className="tab-panel">
          <EnhancedSearchPanel 
            onSearchResults={handleSearchResults} 
            onSearchTermChange={handleSearchTermChange}
          />
        </TabPanel>
        
        <TabPanel className="tab-panel">
          <EnhancedResultsPanel 
            searchResults={searchResults}
            searchResultsCount={searchResultsCount}
            onSearchResults={handleSearchResults}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default EnhancedSidePanel;
