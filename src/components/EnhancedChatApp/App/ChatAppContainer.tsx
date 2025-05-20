import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    SiteContext
} from '../../../contexts/SiteContextProvider';

import ChatApp from './ChatApp';

import { SelectedCategory } from '../../BrowseApp/CategoryFilter';
import { 
  itemsSelector, 
  loadMoreItems, 
  searchItems, 
  searchResultSelector, 
  updateCategory, 
  updateSearchTerm 
} from '../../../store/browseApp/reducers/groupContent';
import { 
  activeWebmapSelector, 
  setActiveWebmap 
} from '../../../store/browseApp/reducers/map';
import { 
  hideSideBarSelectore, 
  toggleSidebar 
} from '../../../store/browseApp/reducers/UI';
import { IGroupCategory } from '@esri/arcgis-rest-portal';

type Props = {
    categorySchema: IGroupCategory
}

const ChatAppContainer: React.FC<Props> = ({
    categorySchema
}: Props) => {
    const dispatch = useDispatch();
    const { isSearchDisabled } = React.useContext(SiteContext);
    
    // Redux selectors
    const items = useSelector(itemsSelector);
    const searchResponse = useSelector(searchResultSelector);
    const activeWebmap = useSelector(activeWebmapSelector);
    const hideSideBar = useSelector(hideSideBarSelectore);

    // Local state for chat and document features
    const [chatMessages, setChatMessages] = React.useState<any[]>([]);
    const [uploadedDocuments, setUploadedDocuments] = React.useState<any[]>([]);
    const [activeTab, setActiveTab] = React.useState<number>(0);

    const categoryFilterOnChange = (data: SelectedCategory) => {
        dispatch(updateCategory(data.title, data.subcategories));
    };

    const searchAutoCompleteOnChange = (val: string) => {
        dispatch(updateSearchTerm(val));
        // Switch to results tab after search
        setActiveTab(2);
    };

    const searchMoreItems = () => {
        if (isSearchDisabled) {
            return;
        }
        dispatch(loadMoreItems());
    };
    
    const handleToggleSidebar = () => {
        dispatch(toggleSidebar());
    };
    
    const handleItemSelect = (item: any) => {
        if (item && item.type === 'Web Map') {
            dispatch(setActiveWebmap(item));
        }
    };
    
    const handleChatMessageSend = (message: string) => {
        // Add message to local state
        setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: message,
            sender: 'user',
            timestamp: new Date()
        }]);
        
        // In a real implementation, this would send the message to a backend service
        // and handle the response
        setTimeout(() => {
            setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: 'I\'m processing your request. This is a placeholder for the actual chat response.',
                sender: 'system',
                timestamp: new Date()
            }]);
        }, 1000);
    };
    
    const handleDocumentUpload = (file: File) => {
        // Add document to local state
        setUploadedDocuments(prev => [...prev, {
            id: Date.now().toString(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date()
        }]);
        
        // In a real implementation, this would upload the document to a backend service
    };
    
    const handleTabChange = (index: number) => {
        setActiveTab(index);
    };

    React.useEffect(() => {
        if (!isSearchDisabled) {
            dispatch(searchItems());
        }
    }, []);

    return (
        <ChatApp
            disableSearch={isSearchDisabled}
            searchResults={items}
            searchResultsCount={searchResponse ? searchResponse.total : 0}
            categorySchema={categorySchema}
            activeWebmap={activeWebmap}
            hideSideBar={hideSideBar}
            chatMessages={chatMessages}
            uploadedDocuments={uploadedDocuments}
            activeTabIndex={activeTab}
            
            onTabChange={handleTabChange}
            onToggleSidebar={handleToggleSidebar}
            onItemSelect={handleItemSelect}
            sidebarScrolledToEnd={searchMoreItems}
            categoryFilterOnChange={categoryFilterOnChange}
            searchAutoCompleteOnChange={searchAutoCompleteOnChange}
            onChatMessageSend={handleChatMessageSend}
            onDocumentUpload={handleDocumentUpload}
        />
    );
};

export default ChatAppContainer;
