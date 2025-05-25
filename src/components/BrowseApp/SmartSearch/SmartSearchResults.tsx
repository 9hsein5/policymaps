import * as React from 'react';

interface SearchParams {
  originalQuery: string;
  location: string | null;
  categories: string[];
  timeFilter: string | null;
  cleanQuery: string;
}

interface Props {
  searchParams: SearchParams | null;
  onClearFilter: (filterType: string, value: string) => void;
}

const SmartSearchResults: React.FC<Props> = ({
  searchParams,
  onClearFilter
}) => {
  if (!searchParams) return null;
  
  return (
    <div className="smart-search-results padding-leader-half padding-trailer-half">
      <div className="font-size--2 avenir-demi">Search interpretation:</div>
      
      <div className="smart-search-filters">
        {searchParams.cleanQuery && (
          <span className="smart-search-filter">
            Keywords: {searchParams.cleanQuery}
            <button 
              className="smart-search-filter-remove" 
              onClick={() => onClearFilter('query', searchParams.cleanQuery)}
            >
              ×
            </button>
          </span>
        )}
        
        {searchParams.location && (
          <span className="smart-search-filter">
            Location: {searchParams.location}
            <button 
              className="smart-search-filter-remove" 
              onClick={() => onClearFilter('location', searchParams.location)}
            >
              ×
            </button>
          </span>
        )}
        
        {searchParams.categories.map(category => (
          <span key={category} className="smart-search-filter">
            Category: {category}
            <button 
              className="smart-search-filter-remove" 
              onClick={() => onClearFilter('category', category)}
            >
              ×
            </button>
          </span>
        ))}
        
        {searchParams.timeFilter && (
          <span className="smart-search-filter">
            Time: {searchParams.timeFilter}
            <button 
              className="smart-search-filter-remove" 
              onClick={() => onClearFilter('time', searchParams.timeFilter)}
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default SmartSearchResults;
