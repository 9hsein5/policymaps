import * as React from 'react';

import {
    SiteContext
} from '../../../contexts/SiteContextProvider';

import SidePanel from '../SidePanel/SidePanel';
import MapView from '../MapView/MapViewContainer';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';

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
                <SidePanel
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    searchResults={searchResults}
                    searchResultsCount={searchResultsCount}
                    onSearchTermChange={onSearchTermChange}
                    onChatMessageSend={onChatMessageSend}
                />

                <div style={{
                    "position": "relative",
                    "flexGrow": 1
                }}>
                    <MapView />
                </div>
            </div>
        </>
    );
};

export default ChatApp;
