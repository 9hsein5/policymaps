import * as React from 'react';
import EnhancedSidePanel from '../SidePanel/EnhancedSidePanel';
import MapViewComponent from '../MapView/MapViewComponent';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { IGroupCategory } from '@esri/arcgis-rest-portal';
import './style.scss';

interface Props {
  isOpen?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  searchResults?: AgolItem[];
  searchResultsCount?: number;
  onSearchTermChange?: (term: string) => void;
  onChatMessageSend?: (message: string) => void;
  onChatMessage?: (message: string) => void; // Added for compatibility
  userId?: string;
  scrollToBottomHandler?: () => void;
  categorySchema?: IGroupCategory; // Added missing prop
}

const EnhancedChatApp: React.FC<Props> = ({
  isOpen = true,
  activeTab = 'chat',
  onTabChange,
  searchResults = [],
  searchResultsCount = 0,
  onSearchTermChange,
  onChatMessageSend,
  onChatMessage, // Added for compatibility
  userId,
  scrollToBottomHandler,
  categorySchema
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(isOpen);
  const [localActiveTab, setLocalActiveTab] = React.useState<string>(activeTab);
  const [mapLoaded, setMapLoaded] = React.useState<boolean>(false);
  const [localSearchResults, setLocalSearchResults] = React.useState<AgolItem[]>(searchResults);
  const [localSearchResultsCount, setLocalSearchResultsCount] = React.useState<number>(searchResultsCount);
  
  // Update local state when props change
  React.useEffect(() => {
    setLocalActiveTab(activeTab);
  }, [activeTab]);
  
  React.useEffect(() => {
    setLocalSearchResults(searchResults);
    setLocalSearchResultsCount(searchResultsCount);
  }, [searchResults, searchResultsCount]);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setLocalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  
  // Handle map load
  const handleMapLoad = (map: __esri.Map, view: __esri.MapView) => {
    console.log('Map loaded successfully', map, view);
    setMapLoaded(true);
  };
  
  // Handle search results
  const handleSearchResults = (results: AgolItem[], count: number) => {
    console.log('Search results received:', results.length, 'items');
    setLocalSearchResults(results);
    setLocalSearchResultsCount(count);
    
    // Automatically switch to results tab when search results are available
    if (results.length > 0) {
      handleTabChange('results');
    }
  };
  
  // Handle search term change
  const handleSearchTermChange = (term: string) => {
    if (onSearchTermChange) {
      onSearchTermChange(term);
    }
  };
  
  // Handle chat message
  const handleChatMessage = (message: string) => {
    console.log('Chat message sent:', message);
    if (onChatMessageSend) {
      onChatMessageSend(message);
    }
    if (onChatMessage) {
      onChatMessage(message);
    }
  };
  
  return (
    <div className="enhanced-chat-app-container">
      <div className={`sidebar-container ${sidebarOpen ? 'open' : 'closed'}`}>
        <EnhancedSidePanel 
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          activeTab={localActiveTab}
          onTabChange={handleTabChange}
          onSearchResults={handleSearchResults}
          onChatMessage={handleChatMessage}
          onSearchTermChange={handleSearchTermChange}
          searchResults={localSearchResults}
          searchResultsCount={localSearchResultsCount}
          userId={userId}
          scrollToBottomHandler={scrollToBottomHandler}
          categorySchema={categorySchema}
        />
      </div>
      
      <div className={`map-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Use the custom MapViewComponent instead of @esri/react-arcgis MapView */}
        <MapViewComponent
          mapProperties={{
            basemap: 'streets-vector'
          }}
          viewProperties={{
            center: [0, 0],
            zoom: 2
          }}
          onLoad={handleMapLoad}
        />
        
        {/* Remove any duplicate chat interface elements here */}
      </div>
      
      {/* Toggle button for mobile */}
      <button 
        className={`sidebar-toggle-button ${sidebarOpen ? 'open' : 'closed'}`}
        onClick={toggleSidebar}
      >
        {sidebarOpen ? '←' : '→'}
      </button>
    </div>
  );
};

export default EnhancedChatApp;
