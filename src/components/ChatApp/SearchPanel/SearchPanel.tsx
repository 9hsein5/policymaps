import * as React from 'react';
import { searchArcGISOnline } from '../utils/arcgis-search';
import { searchDocuments } from '../services/azure-search/search';
import { SearchResult } from '../services/azure-search/types';
import { extractSearchKeywords } from '../services/azure-openai/chat';
import './style.scss';

interface Props {
  onSearchTermChange?: (searchTerm: string) => void;
}

const SearchPanel: React.FC<Props> = ({ onSearchTermChange }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [azureResults, setAzureResults] = React.useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = React.useState<'arcgis' | 'azure'>('arcgis');
  const [error, setError] = React.useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      // Call the callback function if provided
      if (onSearchTermChange) {
        onSearchTermChange(searchTerm);
      }

      // Extract keywords for more effective search
      const keywords = await extractSearchKeywords(searchTerm);
      const keywordQuery = keywords.join(' ');

      // Search ArcGIS Online
      const arcgisResults = await searchArcGISOnline(
        keywordQuery,
        '', // Group ID - replace with actual group ID if needed
        1,
        10
      );

      setSearchResults(arcgisResults?.results || []);

      // Fallback to Azure AI Search if no ArcGIS results
      if (!arcgisResults?.results || arcgisResults.results.length === 0) {
        const azureSearchResults = await searchDocuments(keywordQuery, { top: 10 });
        setAzureResults(azureSearchResults);
        
        // If Azure results exist, switch to Azure tab
        if (azureSearchResults.length > 0) {
          setActiveTab('azure');
        }
      } else {
        // Clear Azure results if ArcGIS results exist
        setAzureResults([]);
        setActiveTab('arcgis');
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-panel">
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder="Search for datasets..."
          value={searchTerm}
          onChange={handleInputChange}
          disabled={isSearching}
        />
        <button type="submit" className="search-button" disabled={isSearching || !searchTerm.trim()}>
          <span className="icon-ui-search"></span>
        </button>
      </form>

      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {(searchResults.length > 0 || azureResults.length > 0) && (
        <div className="search-results-tabs">
          <button 
            className={`tab-button ${activeTab === 'arcgis' ? 'active' : ''}`}
            onClick={() => setActiveTab('arcgis')}
            disabled={searchResults.length === 0}
          >
            ArcGIS Online ({searchResults.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'azure' ? 'active' : ''}`}
            onClick={() => setActiveTab('azure')}
            disabled={azureResults.length === 0}
          >
            Documents ({azureResults.length})
          </button>
        </div>
      )}

      <div className="search-results">
        {isSearching ? (
          <div className="search-loading">
            <span className="icon-ui-loading-indicator"></span>
            <span>Searching...</span>
          </div>
        ) : (
          <>
            {activeTab === 'arcgis' && searchResults.length === 0 && !isSearching && (
              <div className="no-results">
                No ArcGIS Online results found. Try a different search term or check the Documents tab.
              </div>
            )}

            {activeTab === 'azure' && azureResults.length === 0 && !isSearching && (
              <div className="no-results">
                No document results found. Try a different search term or check the ArcGIS Online tab.
              </div>
            )}

            {activeTab === 'arcgis' && searchResults.map((result, index) => (
              <div key={index} className="search-result-item">
                <h3 className="result-title">{result.title}</h3>
                <p className="result-snippet">{result.snippet || 'No description available.'}</p>
                <div className="result-actions">
                  <button className="action-button view">
                    <span className="icon-ui-description"></span> View Details
                  </button>
                  <button className="action-button add-to-map">
                    <span className="icon-ui-map"></span> Add to Map
                  </button>
                </div>
              </div>
            ))}

            {activeTab === 'azure' && azureResults.map((result, index) => (
              <div key={index} className="search-result-item">
                <h3 className="result-title">{result.title}</h3>
                <p className="result-snippet">{result.description || 'No description available.'}</p>
                <div className="result-actions">
                  <button className="action-button view">
                    <span className="icon-ui-description"></span> View Document
                  </button>
                  {result.metadata?.hasGeospatialData && (
                    <button className="action-button add-to-map">
                      <span className="icon-ui-map"></span> Add to Map
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
