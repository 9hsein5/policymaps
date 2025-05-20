import './style.scss';
import * as React from 'react';
import { Provider } from 'react-redux';

import { 
    PageLayout,
    ChatApp
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
    }

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
                <ChatApp 
                    categorySchema={categorySchema}
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
