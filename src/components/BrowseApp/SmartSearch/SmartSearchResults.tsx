import * as React from 'react';
import { EnhancedSmartSearchParams } from '../../../services/azure-openai/chat';

interface Props {
  searchParams: EnhancedSmartSearchParams | null;
  onClearFilter: (filterType: 'query' | 'location' | 'category' | 'subcategory' | 'time', value: any) => void;
  isProcessing?: boolean;
}

const SmartSearchResults: React.FC<Props> = ({
  searchParams,
  onClearFilter,
  isProcessing = false
}) => {
  if (!searchParams) {
    return null;
  }
  
  const hasActiveFilters = 
    (searchParams.cleanQuery && searchParams.cleanQuery.length > 0) ||
    (searchParams.location) ||
    (searchParams.categories && searchParams.categories.length > 0) ||
    (searchParams.subcategories && searchParams.subcategories.length > 0) ||
    (searchParams.timeFilter);
  
  if (!hasActiveFilters) {
    return null;
  }
  
  return (
    <div className="smart-search-results">
      <div className="smart-search-filters">
        <h4 className="font-size--1">Active Filters:</h4>
        
        {isProcessing && (
          <div className="smart-search-processing">
            <span className="icon-ui-loading-indicator"></span>
            <span>Processing search...</span>
          </div>
        )}
        
        <div className="smart-search-filter-chips">
          {searchParams.cleanQuery && (
            <div className="filter-chip">
              <span>Query: {searchParams.cleanQuery}</span>
              <button 
                className="filter-chip-remove" 
                onClick={() => onClearFilter('query', searchParams.cleanQuery)}
                aria-label="Remove query filter"
              >
                ×
              </button>
            </div>
          )}
          
          {searchParams.location && (
            <div className="filter-chip">
              <span>Location: {searchParams.location}</span>
              <button 
                className="filter-chip-remove" 
                onClick={() => onClearFilter('location', searchParams.location)}
                aria-label="Remove location filter"
              >
                ×
              </button>
            </div>
          )}
          
          {searchParams.categories && searchParams.categories.map((category, index) => (
            <div className="filter-chip" key={`category-${index}`}>
              <span>Category: {category}</span>
              <button 
                className="filter-chip-remove" 
                onClick={() => onClearFilter('category', category)}
                aria-label={`Remove ${category} category filter`}
              >
                ×
              </button>
            </div>
          ))}
          
          {searchParams.subcategories && searchParams.subcategories.map((subcategory, index) => (
            <div className="filter-chip" key={`subcategory-${index}`}>
              <span>Subcategory: {subcategory}</span>
              <button 
                className="filter-chip-remove" 
                onClick={() => onClearFilter('subcategory', subcategory)}
                aria-label={`Remove ${subcategory} subcategory filter`}
              >
                ×
              </button>
            </div>
          ))}
          
          {searchParams.timeFilter && (
            <div className="filter-chip">
              <span>Time: {searchParams.timeFilter}</span>
              <button 
                className="filter-chip-remove" 
                onClick={() => onClearFilter('time', searchParams.timeFilter)}
                aria-label="Remove time filter"
              >
                ×
              </button>
            </div>
          )}
        </div>
        
        {searchParams.confidence && searchParams.confidence > 0 && (
          <div className="smart-search-confidence">
            <span className="font-size--3">
              Confidence: {Math.round(searchParams.confidence * 100)}%
            </span>
          </div>
        )}
        
        {searchParams.spatialRelationships && searchParams.spatialRelationships.length > 0 && (
          <div className="smart-search-spatial">
            <span className="font-size--3">
              Spatial context: {searchParams.spatialRelationships.join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSearchResults;
