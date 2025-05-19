import * as React from 'react';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { Tier } from '../../../AppConfig';
// Fix import to use the correct class
import GroupData from '../../../utils/arcgis-online-group-data';
import './style.scss';

interface Props {
  searchResults?: AgolItem[];
  searchResultsCount?: number;
  onSearchResults?: (results: AgolItem[], count: number) => void;
}

const EnhancedResultsPanel: React.FC<Props> = ({
  searchResults = [],
  searchResultsCount = 0,
  onSearchResults
}) => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [results, setResults] = React.useState<AgolItem[]>(searchResults);
  const [totalCount, setTotalCount] = React.useState<number>(searchResultsCount);
  const [page, setPage] = React.useState<number>(1);
  const [error, setError] = React.useState<string | null>(null);
  
  // Use Group ID from configuration
  const groupId = Tier.PROD.AGOL_GROUP_ID;
  
  // Debug logging
  React.useEffect(() => {
    console.log('EnhancedResultsPanel - Group ID:', groupId);
    console.log('EnhancedResultsPanel - Initial search results:', searchResults);
  }, []);
  
  // Load results from ArcGIS Online when component mounts or searchResults change
  React.useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      setResults(searchResults);
      setTotalCount(searchResultsCount);
    } else {
      loadResultsFromArcGIS();
    }
  }, [searchResults, searchResultsCount]);
  
  // Load results from ArcGIS Online
  const loadResultsFromArcGIS = async () => {
    if (!groupId) {
      setError('No Group ID configured. Please check your configuration.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading results from ArcGIS Online with Group ID:', groupId);
      
      // Create a new instance of GroupData with empty category schema
      const groupData = new GroupData({
        groupId,
        categorySchema: { 
          title: 'Categories', 
          categories: [] 
        },
        // Set default filters to ensure we get results
        filters: {
          searchTerm: '',
          contentType: '',
          sortField: 'modified'
        }
      });
      
      console.log('GroupData instance created, executing search...');
      
      const response = await groupData.search({
        start: (page - 1) * 10 + 1,
        num: 10
      });
      
      console.log('ArcGIS Online search response:', response);
      
      if (response && response.results) {
        setResults(response.results);
        setTotalCount(response.total);
        
        // Notify parent component of search results
        if (onSearchResults) {
          onSearchResults(response.results, response.total);
        }
      } else {
        setError('No results returned from ArcGIS Online.');
      }
    } catch (error) {
      console.error('Error loading results from ArcGIS Online:', error);
      setError(`Error loading results: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Load more results
  const loadMore = async () => {
    if (loading || results.length >= totalCount) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    
    try {
      setLoading(true);
      setError(null);
      
      // Create a new instance of GroupData with empty category schema
      const groupData = new GroupData({
        groupId,
        categorySchema: { 
          title: 'Categories', 
          categories: [] 
        },
        // Set default filters to ensure we get results
        filters: {
          searchTerm: '',
          contentType: '',
          sortField: 'modified'
        }
      });
      
      const response = await groupData.search({
        start: (nextPage - 1) * 10 + 1,
        num: 10
      });
      
      if (response && response.results) {
        setResults(prev => [...prev, ...response.results]);
      } else {
        setError('No additional results returned from ArcGIS Online.');
      }
    } catch (error) {
      console.error('Error loading more results:', error);
      setError(`Error loading more results: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="enhanced-results-panel">
      <div className="results-header">
        <h2>Results</h2>
        <span className="results-count">{totalCount} items</span>
        {groupId && (
          <div className="group-id-info">Group ID: {groupId}</div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadResultsFromArcGIS} className="retry-button">
            Retry
          </button>
        </div>
      )}
      
      {loading && results.length === 0 ? (
        <div className="loading-indicator">Loading results...</div>
      ) : results.length === 0 && !error ? (
        <div className="no-results">
          <p>No results found</p>
          <button onClick={loadResultsFromArcGIS} className="retry-button">
            Retry Search
          </button>
        </div>
      ) : (
        <div className="results-list">
          {results.map((item, index) => (
            <div key={item.id || index} className="result-item">
              {item.thumbnailUrl && (
                <div className="result-thumbnail">
                  <img src={item.thumbnailUrl} alt={item.title} />
                </div>
              )}
              <div className="result-content">
                <h3 className="result-title">{item.title}</h3>
                {item.snippet && (
                  <p className="result-snippet">{item.snippet}</p>
                )}
                <div className="result-meta">
                  <span className="result-type">{item.type}</span>
                  {item.modified && (
                    <span className="result-date">
                      Modified: {formatDate(item.modified)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {results.length < totalCount && (
            <button 
              className="load-more-button"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedResultsPanel;
