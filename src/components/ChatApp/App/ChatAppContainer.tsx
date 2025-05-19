import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    SiteContext
} from '../../../contexts/SiteContextProvider';

import ChatApp from './ChatApp';
import { itemsSelector, loadMoreItems, searchItems, searchResultSelector, updateSearchTerm } from '../../../store/browseApp/reducers/groupContent';

const ChatAppContainer: React.FC = () => {
    const dispatch = useDispatch();
    const { isSearchDisabled } = React.useContext(SiteContext);
    const items = useSelector(itemsSelector);
    const searchResponse = useSelector(searchResultSelector);
    
    const [activeTab, setActiveTab] = React.useState('chat');
    const [chatMessages, setChatMessages] = React.useState<Array<{type: string, content: string}>>([
        {type: 'system', content: 'Welcome to the Lebanese Red Cross Map Chat! Ask me about available datasets or how to find specific information.'}
    ]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleSearchTermChange = (val: string) => {
        dispatch(updateSearchTerm(val));
    };

    const handleChatMessageSend = (message: string) => {
        // Add user message to chat
        setChatMessages(prev => [...prev, {type: 'user', content: message}]);
        
        // Simulate response - in a real app, this would call an API
        setTimeout(() => {
            // Simple response logic - in production this would be connected to a real chat service
            let responseMessage = '';
            
            if (message.toLowerCase().includes('flood') || message.toLowerCase().includes('flooding')) {
                responseMessage = 'I found some flood-related datasets. Check the results tab to see them.';
                dispatch(updateSearchTerm('flood'));
                setActiveTab('results');
            } else if (message.toLowerCase().includes('earthquake')) {
                responseMessage = 'Here are some earthquake datasets that might be helpful.';
                dispatch(updateSearchTerm('earthquake'));
                setActiveTab('results');
            } else if (message.toLowerCase().includes('refugee') || message.toLowerCase().includes('camp')) {
                responseMessage = 'I found some refugee camp datasets. See the results tab.';
                dispatch(updateSearchTerm('refugee camp'));
                setActiveTab('results');
            } else {
                responseMessage = 'I\'ll search for relevant datasets based on your query.';
                dispatch(updateSearchTerm(message));
                setActiveTab('results');
            }
            
            setChatMessages(prev => [...prev, {type: 'system', content: responseMessage}]);
        }, 1000);
    };

    React.useEffect(() => {
        if (!isSearchDisabled) {
            dispatch(searchItems());
        }
    }, []);

    return (
        <ChatApp
            searchResults={items}
            searchResultsCount={searchResponse ? searchResponse.total : 0}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onSearchTermChange={handleSearchTermChange}
            onChatMessageSend={handleChatMessageSend}
        />
    );
};

export default ChatAppContainer;
