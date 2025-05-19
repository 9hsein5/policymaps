import * as React from 'react';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { GroupData } from '../../../utils/arcgis-online-group-data';
import './style.scss';

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
  searchResults?: AgolItem[];
  searchResultsCount?: number;
  onSearchResults?: (results: AgolItem[], count: number) => void;
  categorySchema?: CategorySchemaDataItem;
}

const EnhancedResultsPanel: React.FC<Props> = ({
  searchResults = [],
  searchResultsCount = 0,
  onSearchResults,
  categorySchema
}) => {
  const [groupResults, setGroupResults] = React.useState<AgolItem[]>(searchResults);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Update local state when props change
  React.useEffect(() => {
    setGroupResults(searchResults);
  }, [searchResults]);
  
  // Fetch results from ArcGIS Online if none are provided
  React.useEffect(() => {
    if (searchResults.length === 0 && categorySchema) {
      fetchGroupResults();
    }
  }, [categorySchema]);
  
  const fetchGroupResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the group ID from environment or config
      const groupId = process.env.REACT_APP_AGOL_GROUP_ID || '';
      
      if (!groupId) {
        setError('No group ID configured');
        setLoading(false);
        return;
      }
      
      console.log('Fetching results for group:', groupId);
      console.log('Using category schema:', categorySchema);
      
      if (!categorySchema) {
        setError('Category schema not available');
        setLoading(false);
        return;
      }
      
      // Create a new GroupData instance with proper filters object
      const groupDataHelper = new GroupData({
        groupId,
        categorySchema,
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
      
      console.log('Search results:', response);
      
      if (response && response.results) {
        setGroupResults(response.results);
        
        // Notify parent component of results
        if (onSearchResults) {
          onSearchResults(response.results, response.total);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching group results:', err);
      setError(`Error fetching results: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };
  
  return (
    <div className="enhanced-results-panel">
      <div className="results-header">
        <h3>Results</h3>
        <span className="results-count">{searchResultsCount} items</span>
      </div>
      
      {loading && (
        <div className="loading-indicator">
          Loading results...
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {!loading && !error && groupResults.length === 0 && (
        <div className="no-results">
          No results found
        </div>
      )}
      
      <div className="results-list">
        {groupResults.map((item, index) => (
          <div key={item.id || index} className="result-item">
            <div className="result-thumbnail">
              {item.thumbnail ? (
                <img 
                  src={`https://www.arcgis.com/sharing/rest/content/items/${item.id}/info/${item.thumbnail}`} 
                  alt={item.title} 
                />
              ) : (
                <div className="placeholder-thumbnail">
                  <span>{item.type?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>
            <div className="result-details">
              <h4 className="result-title">{item.title}</h4>
              <p className="result-snippet">{item.snippet || item.description || 'No description available'}</p>
              <div className="result-metadata">
                <span className="result-type">{item.type}</span>
                {item.owner && <span className="result-owner">by {item.owner}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {groupResults.length > 0 && (
        <div className="load-more">
          <button onClick={fetchGroupResults}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedResultsPanel;
