import * as React from 'react';
import ChatAppContainer from './App/ChatAppContainer';
import { IGroupCategory } from '@esri/arcgis-rest-portal';

interface Props {
  categorySchema?: IGroupCategory;
}

// This is the main entry point for the EnhancedChatApp component
const EnhancedChatApp: React.FC<Props> = ({ categorySchema }) => {
  // Use a default category schema if none is provided
  const defaultCategorySchema: IGroupCategory = categorySchema || {
    title: 'Categories',
    categories: []
  };
  
  return (
    <ChatAppContainer 
      categorySchema={defaultCategorySchema}
    />
  );
};

// Export the main component and all sub-components that might be needed elsewhere
export default EnhancedChatApp;
export { default as ChatAppContainer } from './App/ChatAppContainer';
export { default as ChatApp } from './App/ChatApp';
export { default as ChatPanel } from './ChatPanel/ChatPanel';
export { default as NaturalLanguageSearch } from './SearchPanel/NaturalLanguageSearch';
export { default as ResultsPanel } from './ResultsPanel/ResultsPanel';
export { default as DocumentUpload } from './DocumentUpload/DocumentUpload';
export { default as MapViewWrapper } from './MapView/MapViewWrapper';
