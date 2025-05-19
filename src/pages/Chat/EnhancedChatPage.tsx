import './style.scss';
import * as React from 'react';
import { Provider } from 'react-redux';

import { 
    PageLayout,
} from '../../components'

import SiteWrapper from '../SiteWrapper/SiteWrapper';
import configureStore, { getPreloadedState, PartialRootState } from '../../store/browseApp/configureStore';

import {
    setDefaultOptions,
    loadGroupCategorySchema,
} from '@vannizhang/arcgis-rest-helper';
import { Tier } from '../../AppConfig';
import { IGroupCategory } from '@esri/arcgis-rest-portal';
import { decodeSearchParams } from '../../utils/url-manager/BrowseAppUrlManager';
import { createRoot } from 'react-dom/client';
import { GroupData } from '../../utils/arcgis-online-group-data';
import EnhancedChatAppWithBrowseComponents from '../../components/EnhancedChatApp/App/EnhancedChatAppWithBrowseComponents';

// Define the types expected by GroupData
interface CategorySchemaDataItem {
    title: string;
    categories: CategorySchemaMainCategory[];
}

interface CategorySchemaMainCategory {
    title: string;
    categories: CategorySchemaSubCategory[];
    selected?: boolean;
}

interface CategorySchemaSubCategory {
    title: string;
    categories: [];
    selected?: boolean;
}

const root = createRoot(document.getElementById('root'));

const urlParamsData = decodeSearchParams()

// Transform IGroupCategory to CategorySchemaDataItem
const transformCategorySchema = (groupCategory: IGroupCategory): CategorySchemaDataItem => {
    return {
        title: groupCategory.title || 'Categories',
        categories: groupCategory.categories.map(mainCat => ({
            title: mainCat.title,
            selected: false,
            categories: mainCat.categories.map(subCat => ({
                title: subCat.title,
                categories: [],
                selected: false
            }))
        }))
    };
};

const EnhancedChatPage:React.FC = ()=>{

    const [preloadedState, setPreloadedState] = React.useState<PartialRootState>()
    const [categorySchema, setCategorySchema] = React.useState<IGroupCategory>()
    const [searchResults, setSearchResults] = React.useState<any[]>([])
    const [searchResultsCount, setSearchResultsCount] = React.useState<number>(0)
    const [activeTab, setActiveTab] = React.useState<string>('chat')
    const [searchTerm, setSearchTerm] = React.useState<string>('')
    const [webmapItem, setWebmapItem] = React.useState<any>(null)

    const init = async()=>{
        setDefaultOptions({
            groupId: Tier.PROD.AGOL_GROUP_ID,
        });
    
        const preloadedState = await getPreloadedState(urlParamsData)
    
        const categorySchemaJSON = await loadGroupCategorySchema();
    
        const categorySchema:IGroupCategory = categorySchemaJSON.categorySchema[0];
    
        // filter out 'Resources' category
        categorySchema.categories = categorySchema.categories.filter(item=>{
            return item.title !== 'Resources';
        });

        setPreloadedState(preloadedState)
        setCategorySchema(categorySchema)
        
        // Initialize with some search results
        fetchInitialResults(Tier.PROD.AGOL_GROUP_ID, categorySchema);
        
        // Set a default webmap for the MapView
        setWebmapItem({
            id: "30d6b8271e1849cd9c3042060001f425", // Default Policy Maps webmap
            type: "Web Map",
            title: "Policy Maps"
        });
    }

    const fetchInitialResults = async (groupId: string, categorySchema: IGroupCategory) => {
        try {
            console.log('Fetching initial results for group:', groupId);
            
            // Transform IGroupCategory to CategorySchemaDataItem
            const transformedCategorySchema = transformCategorySchema(categorySchema);
            
            // Create a new GroupData instance with transformed schema
            // Pass sortField and sortOrder inside the filters object
            const groupDataHelper = new GroupData({
                groupId,
                categorySchema: transformedCategorySchema,
                filters: {
                    sortField: 'modified',
                    contentType: '',
                    searchTerm: ''
                }
            });
            
            // Search for items
            const response = await groupDataHelper.search({
                num: 10,
                start: 1
            });
            
            console.log('Initial search results:', response);
            
            if (response && response.results) {
                setSearchResults(response.results);
                setSearchResultsCount(response.total);
                
                // Find a webmap in the results to display
                const webmap = response.results.find(item => item.type === 'Web Map');
                if (webmap) {
                    setWebmapItem(webmap);
                }
            }
        } catch (error) {
            console.error('Error fetching initial results:', error);
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleSearchTermChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleChatMessageSend = (message: string) => {
        console.log('Chat message sent:', message);
        // Handle chat message logic here
    };
    
    const handleWebmapChange = (item: any) => {
        console.log('Webmap changed:', item);
        setWebmapItem(item);
    };

    React.useEffect(()=>{
        init()
    }, [])

    if(!preloadedState || !categorySchema){
        return null
    }

    return (
        <PageLayout
            shouldHideEsriFooter={true}
        >
            <Provider
                store={configureStore(preloadedState)}
            >
                <EnhancedChatAppWithBrowseComponents 
                    searchResults={searchResults} 
                    searchResultsCount={searchResultsCount}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    onSearchTermChange={handleSearchTermChange}
                    onChatMessageSend={handleChatMessageSend}
                    categorySchema={categorySchema}
                    webmapItem={webmapItem}
                    onWebmapChange={handleWebmapChange}
                />
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
            <EnhancedChatPage />
        </SiteWrapper>
    );
}

initChatPage();
