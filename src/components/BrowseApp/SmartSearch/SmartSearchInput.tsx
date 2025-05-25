import * as React from 'react';
import { smartSearchService } from '../../../services/SmartSearchService';

interface Props {
  onSearch: (params: any) => void;
  placeholder?: string;
}

const SmartSearchInput: React.FC<Props> = ({
  onSearch,
  placeholder = 'Search using natural language (e.g., "healthcare facilities near Boston")'
}) => {
  const [query, setQuery] = React.useState<string>('');
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [isSearching, setIsSearching] = React.useState<boolean>(false);
  
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Use the enhanced smart search service with Azure OpenAI
      const searchParams = await smartSearchService.processNaturalLanguageQuery(query);
      onSearch(searchParams);
    } catch (error) {
      console.error('Error processing search query:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="smart-search-container">
      <div className="smart-search-input-container">
        <input
          type="text"
          className="smart-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          onFocus={() => setIsExpanded(true)}
          disabled={isSearching}
        />
        <button 
          className="smart-search-button" 
          onClick={handleSearch}
          aria-label="Search"
          disabled={isSearching}
        >
          {isSearching ? (
            <span className="icon-ui-loading-indicator"></span>
          ) : (
            <span className="icon-ui-search"></span>
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="smart-search-helper">
          <p className="font-size--3">Try advanced queries like:</p>
          <ul className="font-size--3">
            <li>"healthcare facilities in Chicago with pediatric services"</li>
            <li>"education data from 2020 showing achievement gaps"</li>
            <li>"affordable housing near public transit in coastal areas"</li>
            <li>"economic opportunities within 5 miles of downtown Seattle"</li>
          </ul>
          <button 
            className="btn btn-small btn-transparent"
            onClick={() => setIsExpanded(false)}
          >
            Hide tips
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartSearchInput;
