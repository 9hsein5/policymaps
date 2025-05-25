import * as React from 'react';
import { SmartSearchService } from '../../../services/SmartSearchService';

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
  const searchService = new SmartSearchService();
  
  const handleSearch = () => {
    if (!query.trim()) return;
    
    const searchParams = searchService.processNaturalLanguageQuery(query);
    onSearch(searchParams);
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
        />
        <button 
          className="smart-search-button" 
          onClick={handleSearch}
          aria-label="Search"
        >
          <span className="icon-ui-search"></span>
        </button>
      </div>
      
      {isExpanded && (
        <div className="smart-search-helper">
          <p className="font-size--3">Try queries like:</p>
          <ul className="font-size--3">
            <li>"healthcare facilities in Chicago"</li>
            <li>"education data from 2020"</li>
            <li>"housing affordability near coastal areas"</li>
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
