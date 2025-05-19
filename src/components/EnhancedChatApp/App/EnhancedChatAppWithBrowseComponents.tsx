import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { IGroupCategory } from '@esri/arcgis-rest-portal';
import { SiteContext } from '../../../contexts/SiteContextProvider';
import MapView from '../../BrowseApp/MapView/MapView';
import SideBar from '../../BrowseApp/SideBar';
import EnhancedChatPanel from '../ChatPanel/EnhancedChatPanel';
import EnhancedSearchPanelWrapper from '../SearchPanel/EnhancedSearchPanelWrapper';
import EnhancedResultsPanel from '../ResultsPanel/EnhancedResultsPanel';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import './style.scss';

// Import Redux actions for sidebar
import {
    toggleSidebar,
    hideSideBarSelectore
} from '../../../store/browseApp/reducers/UI';

interface Props {
  searchResults: AgolItem[];
  searchResultsCount: number;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSearchTermChange?: (searchTerm: string) => void;
  onChatMessageSend?: (message: string) => void;
  categorySchema?: IGroupCategory;
  webmapItem?: any;
  onWebmapChange?: (item: any) => void;
}

const EnhancedChatAppWithBrowseComponents: React.FC<Props> = ({
  searchResults,
  searchResultsCount,
  activeTab = 'chat',
  onTabChange,
  onSearchTermChange,
  onChatMessageSend,
  categorySchema,
  webmapItem,
  onWebmapChange
}) => {
  const { isMobile } = React.useContext(SiteContext);
  const dispatch = useDispatch();
  const hideSideBar = useSelector(hideSideBarSelectore);
  
  const [userId] = React.useState<string>('anonymous');
  const [sidebarScrolledToEnd, setSidebarScrolledToEnd] = React.useState<boolean>(false);
  const [mapLocation, setMapLocation] = React.useState({
    lat: 0,
    lon: 0,
    zoom: 2
  });
  
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
  
  const handleTabSelect = (index: number) => {
    setTabIndex(index);
    if (onTabChange) {
      onTabChange(getTabName(index));
    }
  };
  
  const handleSidebarScrollToEnd = () => {
    setSidebarScrolledToEnd(true);
    // Additional logic for loading more content can be added here
  };
  
  const handleMapStationary = (location: any) => {
    setMapLocation(location);
    console.log('Map location updated:', location);
  };
  
  const handleSearchResults = (results: any[], count: number) => {
    console.log('Search results received:', results.length, 'items');
    // Find a webmap in the results to display
    const webmap = results.find(item => item.type === 'Web Map');
    if (webmap && onWebmapChange) {
      console.log('Found webmap in results:', webmap.title);
      onWebmapChange(webmap);
    }
  };
  
  const handleResultItemClick = (item: any) => {
    console.log('Result item clicked:', item);
    if (item.type === 'Web Map' && onWebmapChange) {
      onWebmapChange(item);
    }
  };
  
  // Debug logging for webmapItem
  React.useEffect(() => {
    if (webmapItem) {
      console.log('Current webmapItem:', webmapItem);
    }
  }, [webmapItem]);
  
  return (
    <div className="enhanced-chat-app-container">
      <SideBar
        scrollToBottomHandler={handleSidebarScrollToEnd}
      >
        <div className="enhanced-chat-side-panel">
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
                onChatMessageSend={onChatMessageSend} 
                userId={userId}
                scrollToBottomHandler={handleSidebarScrollToEnd}
              />
            </TabPanel>
            
            <TabPanel className="tab-panel">
              <EnhancedSearchPanelWrapper 
                onSearchResults={handleSearchResults} 
                onSearchTermChange={onSearchTermChange}
                categorySchema={categorySchema}
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
      </SideBar>
      
      <div 
        className="map-container"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: hideSideBar ? 0 : (isMobile ? 0 : 350),
          right: 0,
          transition: 'left 0.3s ease'
        }}
      >
        {webmapItem ? (
          <MapView
            webmapItem={webmapItem}
            initialCenter={mapLocation.lon !== 0 ? { lon: mapLocation.lon, lat: mapLocation.lat } : undefined}
            initialZoom={mapLocation.zoom !== 0 ? mapLocation.zoom : undefined}
            onStationary={handleMapStationary}
          />
        ) : (
          <div className="map-loading-placeholder">
            Loading map...
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatAppWithBrowseComponents;
