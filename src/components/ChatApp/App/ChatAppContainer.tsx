import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    SiteContext
} from '../../../contexts/SiteContextProvider';

import ChatApp from './ChatApp';
import { itemsSelector, loadMoreItems, searchItems, searchResultSelector, updateSearchTerm } from '../../../store/browseApp/reducers/groupContent';
import { ChatMessage } from '../services/azure-openai/chat';
import { saveChatHistory, getChatHistory } from '../services/azure-cosmos/chat-history';
import { v4 as uuidv4 } from 'uuid';

const ChatAppContainer: React.FC = () => {
    const dispatch = useDispatch();
    const { isSearchDisabled, isEmbedded } = React.useContext(SiteContext);
    const items = useSelector(itemsSelector);
    const searchResponse = useSelector(searchResultSelector);
    
    const [activeTab, setActiveTab] = React.useState('chat');
    const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
        {
            role: 'system',
            content: 'Welcome to the Lebanese Red Cross Map Chat! Ask me about available datasets or how to find specific information.'
        },
        {
            role: 'assistant',
            content: 'Hello! I can help you find geospatial datasets and information. Try asking about "flood maps", "refugee camps", or "healthcare facilities in Lebanon".'
        }
    ]);
    const [sessionId, setSessionId] = React.useState<string>('');
    const [userId, setUserId] = React.useState<string>('anonymous');

    // Initialize session ID and load chat history
    React.useEffect(() => {
        // Generate a session ID if not exists
        const newSessionId = uuidv4();
        setSessionId(newSessionId);

        // Load chat history (in a real app, this would use actual user authentication)
        const loadChatHistory = async () => {
            try {
                const history = await getChatHistory(userId, newSessionId);
                if (history && history.messages && history.messages.length > 0) {
                    setChatMessages(history.messages);
                }
            } catch (error) {
                console.error('Error loading chat history:', error);
            }
        };

        loadChatHistory();
    }, [userId]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleSearchTermChange = (val: string) => {
        dispatch(updateSearchTerm(val));
        dispatch(searchItems());
    };

    const handleChatMessageSend = async (message: string) => {
        // Add user message to chat
        const userMessage: ChatMessage = {
            role: 'user',
            content: message
        };
        
        const updatedMessages = [...chatMessages, userMessage];
        setChatMessages(updatedMessages);
        
        // Save chat history
        try {
            await saveChatHistory(userId, sessionId, updatedMessages);
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
        
        // Trigger search based on message
        handleSearchTermChange(message);
        
        // In a real implementation, the response would come from Azure OpenAI
        // This is handled in the ChatPanel component now
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
