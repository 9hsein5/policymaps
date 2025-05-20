import * as React from 'react';
import { useDispatch } from 'react-redux';
import { updateSearchTerm } from '../../../store/browseApp/reducers/groupContent';
import './style.scss';

interface NaturalLanguageSearchProps {
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

const NaturalLanguageSearch: React.FC<NaturalLanguageSearchProps> = ({ 
  onSearch,
  initialQuery = ''
}) => {
  const [query, setQuery] = React.useState<string>(initialQuery);
  const dispatch = useDispatch();

  // Update query when initialQuery prop changes
  React.useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    if (query.trim()) {
      // Update Redux store with search term
      dispatch(updateSearchTerm(query));
      
      // Call the onSearch callback if provided
      if (onSearch) {
        onSearch(query);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="natural-language-search">
      <h3>Natural Language Search</h3>
      <p>Describe what you're looking for in natural language</p>
      
      <textarea
        className="search-textarea"
        placeholder="Example: Show me maps related to climate change impacts on coastal communities in the United States"
        value={query}
        onChange={handleQueryChange}
        onKeyDown={handleKeyDown}
      />
      
      <div className="search-actions">
        <button className="search-button" onClick={handleSearch}>
          Search
        </button>
        <div className="search-tip">
          Tip: Press Ctrl+Enter to search
        </div>
      </div>
    </div>
  );
};

export default NaturalLanguageSearch;
