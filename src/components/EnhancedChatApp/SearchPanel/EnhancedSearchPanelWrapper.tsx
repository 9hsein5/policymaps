import * as React from 'react';
import EnhancedSearchPanel from '../SearchPanel/EnhancedSearchPanel';
import { IGroupCategory } from '@esri/arcgis-rest-portal';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';

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

interface Props {
  onSearchResults?: (results: any[], count: number) => void;
  onSearchTermChange?: (term: string) => void;
  categorySchema?: IGroupCategory;
}

// Transform IGroupCategory to CategorySchemaDataItem
const transformCategorySchema = (groupCategory: IGroupCategory): CategorySchemaDataItem => {
  if (!groupCategory) return null;
  
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

const EnhancedSearchPanelWrapper: React.FC<Props> = ({
  onSearchResults,
  onSearchTermChange,
  categorySchema
}) => {
  // Transform the category schema
  const transformedCategorySchema = React.useMemo(() => 
    transformCategorySchema(categorySchema), [categorySchema]);
  
  // We're not passing categorySchema to EnhancedSearchPanel since it doesn't accept it
  return (
    <EnhancedSearchPanel
      onSearchResults={onSearchResults}
      onSearchTermChange={onSearchTermChange}
    />
  );
};

export default EnhancedSearchPanelWrapper;
