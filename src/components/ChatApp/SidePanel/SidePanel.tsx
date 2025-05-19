import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SiteContext } from '../../../contexts/SiteContextProvider';

import ChatPanel from '../ChatPanel/ChatPanel';
import SearchPanel from '../SearchPanel/SearchPanel';
import ResultsPanel from '../ResultsPanel/ResultsPanel';
import { toggleSidebar, hideSideBarSelectore } from '../../../store/browseApp/reducers/UI';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';

import './style.scss';

interface Props {
    width?: number;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    searchResults: AgolItem[];
    searchResultsCount: number;
    onSearchTermChange?: (searchTerm: string) => void;
    onChatMessageSend?: (message: string) => void;
}

const SidePanel: React.FC<Props> = ({
    width = 320,
    activeTab = 'chat',
    onTabChange,
    searchResults,
    searchResultsCount,
    onSearchTermChange,
    onChatMessageSend
}) => {
    const dispatch = useDispatch();
    const { isMobile } = React.useContext(SiteContext);
    const hideSideBar = useSelector(hideSideBarSelectore);
    const sidebarRef = React.createRef<HTMLDivElement>();

    const handleTabClick = (tab: string) => {
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    const getToogleBtnOnSide = () => {
        if (isMobile) {
            return null;
        }

        const ExpandIcon = (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" className="svg-icon">
                <path d="M7 4h5l12 12-12 12H7l12-12L7 4z" />
            </svg>
        );

        const CloseBtn = (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" className="svg-icon">
                <path d="M25 28h-5L8 16 20 4h5L13 16l12 12z" />
            </svg>
        );

        return (
            <div
                style={{
                    position: 'absolute',
                    top: '95px',
                    left: hideSideBar ? 0 : width,
                    width: '25px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.6)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.24)',
                    zIndex: 5,
                    cursor: 'pointer',
                    color: '#fff'
                }}
                onClick={() => {
                    dispatch(toggleSidebar());
                }}
            >
                {hideSideBar ? ExpandIcon : CloseBtn}
            </div>
        );
    };

    const getCloseBtn4MobileView = () => {
        if (!isMobile) {
            return null;
        }

        return (
            <div
                className='text-center'
                onClick={() => {
                    dispatch(toggleSidebar());
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" height="32" width="32">
                    <path d="M16 22.207l-9-9v-1.414l9 9 9-9v1.414z" /><path fill="none" d="M0 0h32v32H0z" />
                </svg>
            </div>
        );
    };

    const getOpenBtn4MobileView = () => {
        if (!isMobile || !hideSideBar) {
            return null;
        }

        return (
            <div
                className='text-center'
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    background: '#595959',
                    color: '#fff',
                    zIndex: 5,
                    padding: '.5rem 0',
                    boxShadow: 'rgb(0 0 0 / 10%) 0px 0px 0px 1px, rgb(0 0 0 / 5%) 0px 0px 16px 0px'
                }}
                onClick={() => {
                    dispatch(toggleSidebar());
                }}
            >
                <span className='icon-ui-up'></span>
                <span>Show Chat and Search</span>
            </div>
        );
    };

    return (
        <>
            {
                !hideSideBar ? (
                    <div
                        ref={sidebarRef}
                        className='fancy-scrollbar chat-app-side-panel'
                        style={{
                            "width": isMobile ? '100%' : width,
                            "boxSizing": "border-box",
                            "overflowY": "auto",
                            "boxShadow": "0 2px 6px rgba(0,0,0,.24)",
                            "display": "flex",
                            "flexDirection": "column"
                        }}
                    >
                        {getCloseBtn4MobileView()}
                        
                        <div className="chat-app-tabs">
                            <div 
                                className={`chat-app-tab ${activeTab === 'chat' ? 'active' : ''}`}
                                onClick={() => handleTabClick('chat')}
                            >
                                <span className="icon-ui-chat"></span> Chat
                            </div>
                            <div 
                                className={`chat-app-tab ${activeTab === 'search' ? 'active' : ''}`}
                                onClick={() => handleTabClick('search')}
                            >
                                <span className="icon-ui-search"></span> Search
                            </div>
                            <div 
                                className={`chat-app-tab ${activeTab === 'results' ? 'active' : ''}`}
                                onClick={() => handleTabClick('results')}
                            >
                                <span className="icon-ui-layer-list"></span> Results
                            </div>
                        </div>
                        
                        <div className="chat-app-content">
                            {activeTab === 'chat' && (
                                <ChatPanel onChatMessageSend={onChatMessageSend} />
                            )}
                            
                            {activeTab === 'search' && (
                                <SearchPanel onSearchTermChange={onSearchTermChange} />
                            )}
                            
                            {activeTab === 'results' && (
                                <ResultsPanel 
                                    searchResults={searchResults}
                                    searchResultsCount={searchResultsCount}
                                />
                            )}
                        </div>
                    </div>
                ) : null
            }
            {getToogleBtnOnSide()}
            {getOpenBtn4MobileView()}
        </>
    );
};

export default SidePanel;
