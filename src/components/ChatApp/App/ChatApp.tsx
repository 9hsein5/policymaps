import * as React from 'react';
import SidePanel from '../SidePanel/SidePanel';
import MapView from '../MapView/MapViewContainer';
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
}

const ChatApp: React.FC<Props> = ({
    searchResults,
    searchResultsCount,
    activeTab = 'chat',
    onTabChange,
    onSearchTermChange,
    onChatMessageSend
}) => {
    const { isEmbedded } = React.useContext(SiteContext);
    const [userId] = React.useState<string>('anonymous');

    return (
        <div className="chat-app-container">
            <div className="chat-app-content">
                <SidePanel
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    searchResults={searchResults}
                    searchResultsCount={searchResultsCount}
                    onSearchTermChange={onSearchTermChange}
                    onChatMessageSend={onChatMessageSend}
                    userId={userId}
                />

                <div className="map-container">
                    <MapView />
                </div>
            </div>
        </div>
    );
};

export default ChatApp;
