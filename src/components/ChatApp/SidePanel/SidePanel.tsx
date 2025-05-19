import * as React from 'react';
import ChatPanel from '../ChatPanel/ChatPanel';
import SearchPanel from '../SearchPanel/SearchPanel';
import ResultsPanel from '../ResultsPanel/ResultsPanel';
import DocumentPanel from '../DocumentPanel/DocumentPanel';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import './style.scss';

interface Props {
    activeTab: string;
    onTabChange: (tab: string) => void;
    searchResults: AgolItem[];
    searchResultsCount: number;
    onSearchTermChange?: (searchTerm: string) => void;
    onChatMessageSend?: (message: string) => void;
    userId: string;
}

const SidePanel: React.FC<Props> = ({
    activeTab,
    onTabChange,
    searchResults,
    searchResultsCount,
    onSearchTermChange,
    onChatMessageSend,
    userId
}) => {
    const handleTabClick = (tab: string) => {
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    const handleDocumentUploaded = (documentId: string) => {
        // Switch to chat tab after document upload
        handleTabClick('chat');
    };

    return (
        <div className="chat-app-side-panel">
            <div className="side-panel-tabs">
                <button
                    className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
                    onClick={() => handleTabClick('chat')}
                >
                    <span className="icon-ui-chat"></span>
                    <span className="tab-label">Chat</span>
                </button>
                <button
                    className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => handleTabClick('search')}
                >
                    <span className="icon-ui-search"></span>
                    <span className="tab-label">Search</span>
                </button>
                <button
                    className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => handleTabClick('results')}
                >
                    <span className="icon-ui-collection"></span>
                    <span className="tab-label">Results</span>
                    {searchResultsCount > 0 && (
                        <span className="result-count">{searchResultsCount}</span>
                    )}
                </button>
                <button
                    className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
                    onClick={() => handleTabClick('documents')}
                >
                    <span className="icon-ui-attachment"></span>
                    <span className="tab-label">Documents</span>
                </button>
            </div>
            
            <div className="side-panel-content">
                {activeTab === 'chat' && (
                    <ChatPanel onChatMessageSend={onChatMessageSend} />
                )}
                
                {activeTab === 'search' && (
                    <SearchPanel onSearchTermChange={onSearchTermChange} />
                )}
                
                {activeTab === 'results' && (
                    <ResultsPanel searchResults={searchResults} searchResultsCount={searchResultsCount}  />
                )}
                
                {activeTab === 'documents' && (
                    <DocumentPanel 
                        userId={userId}
                        onDocumentUploaded={handleDocumentUploaded}
                    />
                )}
            </div>
        </div>
    );
};

export default SidePanel;
