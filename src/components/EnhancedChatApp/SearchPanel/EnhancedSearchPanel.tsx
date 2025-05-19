import * as React from 'react';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import './style.scss';

interface Props {
  onSearchResults?: (results: any[], count: number) => void;
  onSearchTermChange?: (term: string) => void;
}

const EnhancedSearchPanel: React.FC<Props> = ({
  onSearchResults,
  onSearchTermChange
}) => {
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedContentTypes, setSelectedContentTypes] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  
  // Handle search term change
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (onSearchTermChange) {
      onSearchTermChange(term);
    }
  };
  
  // Handle content type selection
  const handleContentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setSelectedContentTypes(prev => [...prev, value]);
    } else {
      setSelectedContentTypes(prev => prev.filter(type => type !== value));
    }
  };
  
  // Handle category selection
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setSelectedCategories(prev => [...prev, value]);
    } else {
      setSelectedCategories(prev => prev.filter(category => category !== value));
    }
  };
  
  // Handle search submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    
    try {
      // Simulate search results for now
      // In a real implementation, this would call an API or service
      console.log('Searching for:', {
        searchTerm,
        contentTypes: selectedContentTypes,
        categories: selectedCategories
      });
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock results
      const mockResults: AgolItem[] = Array(5).fill(null).map((_, index) => ({
        id: `result-${index}`,
        title: `Search Result ${index + 1} for "${searchTerm}"`,
        type: 'Web Map',
        snippet: `This is a sample search result for the term "${searchTerm}".`,
        thumbnailUrl: 'https://www.arcgis.com/sharing/rest/content/items/default.png',
        modified: Date.now() - (index * 86400000) // Subtract days
      }));
      
      if (onSearchResults) {
        onSearchResults(mockResults, mockResults.length);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedContentTypes([]);
    setSelectedCategories([]);
    
    if (onSearchTermChange) {
      onSearchTermChange('');
    }
  };
  
  return (
    <div className="enhanced-search-panel">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search for maps, layers, apps..."
            value={searchTerm}
            onChange={handleSearchTermChange}
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className="filter-section">
          <h3 className="filter-heading">Content Type</h3>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="checkbox"
                value="webmap"
                checked={selectedContentTypes.includes('webmap')}
                onChange={handleContentTypeChange}
              />
              Web Maps
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                value="featurelayer"
                checked={selectedContentTypes.includes('featurelayer')}
                onChange={handleContentTypeChange}
              />
              Feature Layers
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                value="mapservice"
                checked={selectedContentTypes.includes('mapservice')}
                onChange={handleContentTypeChange}
              />
              Map Services
            </label>
          </div>
        </div>
        
        <div className="filter-section">
          <h3 className="filter-heading">Categories</h3>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="checkbox"
                value="health"
                checked={selectedCategories.includes('health')}
                onChange={handleCategoryChange}
              />
              Health
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                value="housing"
                checked={selectedCategories.includes('housing')}
                onChange={handleCategoryChange}
              />
              Housing
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                value="inclusion"
                checked={selectedCategories.includes('inclusion')}
                onChange={handleCategoryChange}
              />
              Inclusion
            </label>
            <label className="filter-option">
              <input
                type="checkbox"
                value="disaster"
                checked={selectedCategories.includes('disaster')}
                onChange={handleCategoryChange}
              />
              Disaster Risk
            </label>
          </div>
        </div>
        
        <div className="filter-actions">
          <button type="submit" className="apply-filters-button" disabled={loading}>
            Apply Filters
          </button>
          <button type="button" className="clear-filters-button" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedSearchPanel;
