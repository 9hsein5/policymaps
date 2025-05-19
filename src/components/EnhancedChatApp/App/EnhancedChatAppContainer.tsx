import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import EnhancedChatApp from './EnhancedChatApp';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { Tier } from '../../../AppConfig';
import {
  setDefaultOptions,
  loadGroupCategorySchema,
} from '@vannizhang/arcgis-rest-helper';
import { IGroupCategory } from '@esri/arcgis-rest-portal';

interface Props {}

const EnhancedChatAppContainer: React.FC<Props> = () => {
  const [activeTab, setActiveTab] = React.useState<string>('chat');
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [searchResults, setSearchResults] = React.useState<AgolItem[]>([]);
  const [searchResultsCount, setSearchResultsCount] = React.useState<number>(0);
  const [categorySchema, setCategorySchema] = React.useState<IGroupCategory>();
  
  // Initialize with ArcGIS Online group configuration
  React.useEffect(() => {
    const initApp = async () => {
      setDefaultOptions({
        groupId: Tier.PROD.AGOL_GROUP_ID,
      });
      
      // Load category schema for filters
      const categorySchemaJSON = await loadGroupCategorySchema();
      const schema: IGroupCategory = categorySchemaJSON.categorySchema[0];
      
      // Filter out 'Resources' category (same as in BrowseApp)
      schema.categories = schema.categories.filter(item => {
        return item.title !== 'Resources';
      });
      
      setCategorySchema(schema);
    };
    
    initApp();
  }, []);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    // In a real implementation, this would trigger a search
    // For now, we'll just simulate some results
    if (term.trim()) {
      // Simulate search results (will be replaced with actual API calls)
      setSearchResultsCount(5);
      // Actual search implementation will be added in the next step
    } else {
      setSearchResultsCount(0);
      setSearchResults([]);
    }
  };
  
  const handleChatMessageSend = (message: string) => {
    // This will be enhanced with chat2geo agentic features in a later step
    console.log('Chat message sent:', message);
    
    // For now, just switch to results tab to simulate response
    if (message.trim().toLowerCase().includes('map') || 
        message.trim().toLowerCase().includes('show') || 
        message.trim().toLowerCase().includes('find')) {
      setActiveTab('results');
    }
  };
  
  return (
    <EnhancedChatApp
      activeTab={activeTab}
      onTabChange={handleTabChange}
      searchResults={searchResults}
      searchResultsCount={searchResultsCount}
      onSearchTermChange={handleSearchTermChange}
      onChatMessageSend={handleChatMessageSend}
      categorySchema={categorySchema}
    />
  );
};

export default EnhancedChatAppContainer;
