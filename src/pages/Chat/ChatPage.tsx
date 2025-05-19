import './style.scss';
import * as React from 'react';
// import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { 
    PageLayout,
    ChatApp
} from '../../components'

import { decodeSearchParams } from '../../utils/url-manager/BrowseAppUrlManager';

import SiteWrapper from '../SiteWrapper/SiteWrapper';

import configureStore, { getPreloadedState, PartialRootState } from '../../store/browseApp/configureStore';

import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));

const urlParamsData = decodeSearchParams()

const ChatPage:React.FC = ()=>{

    const [preloadedState, setPreloadedState] = React.useState<PartialRootState>()
  
    const init = async()=>{
    
        const preloadedState = await getPreloadedState(urlParamsData)

        setPreloadedState(preloadedState)

    }

    React.useEffect(()=>{
        init()
    }, [])

    return (
        <PageLayout
            shouldHideEsriFooter={true}
        >
            <Provider
                store={configureStore(preloadedState)}
            >
                <ChatApp/>
            </Provider>

        </PageLayout>
    )
}

const initChatPage = async () => {
    root.render(
        <SiteWrapper
            isEmbedded={urlParamsData.isEmbedded}
            isSearchDisabled={urlParamsData.isSearchDisabled}
        >
            <ChatPage />
        </SiteWrapper>
    );
}

initChatPage();
