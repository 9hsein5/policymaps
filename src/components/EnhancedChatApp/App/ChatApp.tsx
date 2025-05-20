import * as React from 'react';

import {
    SiteContext
} from '../../../contexts/SiteContextProvider';

import SideBar from '../../BrowseApp/SideBar';
import TopNav from '../../BrowseApp/TopNav';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import './style.scss';

import { 
    SearchWidget,
    LegendWidget
} from '../../index';

import {
    AgolItem
} from '../../../utils/arcgis-online-item-formatter';
import { IGroupCategory } from '@esri/arcgis-rest-portal';
import { SelectedCategory } from '../../BrowseApp/CategoryFilter';

// Import the individual tab components
import ChatPanel from '../ChatPanel/ChatPanel';
import NaturalLanguageSearch from '../SearchPanel/NaturalLanguageSearch';
import ResultsPanel from '../ResultsPanel/ResultsPanel';
import DocumentUpload from '../DocumentUpload/DocumentUpload';

// Import the map wrapper for consistent behavior with Browse App
import MapViewWrapper from '../MapView/MapViewWrapper';
// Remove the MapInteractivityManager import as it's causing issues
// We'll handle map interactivity directly in this component

interface Props {
    disableSearch?: boolean;
    searchResults: AgolItem[];
    searchResultsCount: number;
    categorySchema: IGroupCategory;
    activeWebmap?: any;
    hideSideBar?: boolean;
    chatMessages?: any[];
    uploadedDocuments?: any[];
    activeTabIndex?: number;

    onTabChange?: (index: number) => void;
    onToggleSidebar?: () => void;
    onItemSelect?: (item: any) => void;
    sidebarScrolledToEnd?: () => void;
    categoryFilterOnChange?: (data: SelectedCategory) => void;
    searchAutoCompleteOnChange?: (searchTerm: string) => void;
    onChatMessageSend?: (message: string) => void;
    onDocumentUpload?: (file: File) => void;
}

const ChatApp: React.FC<Props> = ({
    disableSearch,
    searchResults,
    searchResultsCount,
    categorySchema,
    activeWebmap,
    hideSideBar = false,
    chatMessages = [],
    uploadedDocuments = [],
    activeTabIndex = 0,

    onTabChange,
    onToggleSidebar,
    onItemSelect,
    sidebarScrolledToEnd,
    categoryFilterOnChange,
    searchAutoCompleteOnChange,
    onChatMessageSend,
    onDocumentUpload
}) => {
    const { isEmbedded } = React.useContext(SiteContext);
    const [tabIndex, setTabIndex] = React.useState<number>(activeTabIndex);
    
    // Update tabIndex when activeTabIndex prop changes
    React.useEffect(() => {
        setTabIndex(activeTabIndex);
    }, [activeTabIndex]);
    
    const handleTabSelect = (index: number) => {
        setTabIndex(index);
        if (onTabChange) {
            onTabChange(index);
        }
    };
    
    const handleSearch = (query: string) => {
        if (searchAutoCompleteOnChange) {
            searchAutoCompleteOnChange(query);
        }
    };
    
    const handleChatMessageSend = (message: string) => {
        if (onChatMessageSend) {
            onChatMessageSend(message);
        }
    };
    
    const handleDocumentUpload = (file: File) => {
        if (onDocumentUpload) {
            onDocumentUpload(file);
        }
    };
    
    const handleItemClick = (item: any) => {
        if (onItemSelect) {
            onItemSelect(item);
        }
    };

    return (
        <>
            <div style={{
                "position": "absolute",
                "top": isEmbedded ? '0' : "117px",
                "left": "0",
                "bottom": "0",
                "width": "100%",
                "display": "flex",
                "flexDirection": "row",
                "flexWrap": "nowrap",
                "justifyContent": "flex-start",
                "alignContent": "stretch",
                "alignItems": "stretch"
            }}>
                {/* SideBar component doesn't accept 'hide' prop, it uses Redux state internally */}
                <SideBar
                    scrollToBottomHandler={sidebarScrolledToEnd}
                >
                    <div className="chat-side-panel">
                        <Tabs
                            selectedIndex={tabIndex}
                            onSelect={handleTabSelect}
                            className="side-panel-tabs"
                        >
                            <TabList className="tab-list">
                                <Tab className="tab" selectedClassName="tab-selected">Chat</Tab>
                                <Tab className="tab" selectedClassName="tab-selected">Search</Tab>
                                <Tab className="tab" selectedClassName="tab-selected">Results</Tab>
                                <Tab className="tab" selectedClassName="tab-selected">Documents</Tab>
                            </TabList>
                            
                            <TabPanel className="tab-panel">
                                <ChatPanel 
                                    onChatMessageSend={handleChatMessageSend}
                                    scrollToBottomHandler={sidebarScrolledToEnd}
                                    messages={chatMessages}
                                />
                            </TabPanel>
                            
                            <TabPanel className="tab-panel">
                                <NaturalLanguageSearch 
                                    onSearch={handleSearch}
                                />
                            </TabPanel>
                            
                            <TabPanel className="tab-panel">
                                <ResultsPanel 
                                    title="Search Results"
                                />
                            </TabPanel>
                            
                            <TabPanel className="tab-panel">
                                <DocumentUpload 
                                    onDocumentUpload={handleDocumentUpload}
                                    uploadedFiles={uploadedDocuments.map(doc => doc.name)}
                                />
                            </TabPanel>
                        </Tabs>
                    </div>
                </SideBar>

                <div style={{
                    "position": "relative",
                    "flexGrow": 1
                }}>
                    <TopNav />
                    
                    {/* Use MapViewWrapper instead of direct MapView for consistent behavior */}
                    <MapViewWrapper>
                        <SearchWidget />
                        <LegendWidget />
                    </MapViewWrapper>
                </div>
            </div>
        </>
    );
};

export default ChatApp;
