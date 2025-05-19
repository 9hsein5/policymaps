import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import './style.scss';

interface Props {
  searchResults: AgolItem[];
  searchResultsCount: number;
}

const ResultsPanel: React.FC<Props> = ({ searchResults, searchResultsCount }) => {
  const [sortBy, setSortBy] = React.useState<string>('relevance');
  const [selectedItem, setSelectedItem] = React.useState<AgolItem | null>(null);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleViewItem = (item: AgolItem) => {
    // Open the item in a new tab
    window.open(`https://www.arcgis.com/home/item.html?id=${item.id}`, '_blank');
  };

  const handleAddToMap = (item: AgolItem) => {
    // Set the selected item to be added to the map
    setSelectedItem(item);
    
    // Dispatch an action to add the item to the map
    // This would typically be handled by Redux
    // For now, we'll just use a custom event
    const event = new CustomEvent('addItemToMap', { detail: item });
    document.dispatchEvent(event);
  };

  const renderResultCard = (item: AgolItem, index: number) => {
    return (
      <div className="result-card" key={item.id || index}>
        <div className="result-thumbnail">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.title} />
          ) : (
            <div className="no-thumbnail">
              <span className="icon-ui-map"></span>
            </div>
          )}
        </div>
        <div className="result-content">
          <h3 className="result-title">{item.title}</h3>
          <p className="result-description">{item.snippet || 'No description available'}</p>
          <div className="result-metadata">
            <span className="result-type">
              <span className="icon-ui-collection"></span> {item.type}
            </span>
            <span className="result-date">
              <span className="icon-ui-calendar"></span> {new Date(item.modified).toLocaleDateString()}
            </span>
          </div>
          <div className="result-actions">
            <button className="btn-view" onClick={() => handleViewItem(item)}>
              <span className="icon-ui-zoom-in-magnifying-glass"></span> View
            </button>
            <button className="btn-add-to-map" onClick={() => handleAddToMap(item)}>
              <span className="icon-ui-maps"></span> Add to Map
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Sort the results based on the selected sort option
  const sortedResults = React.useMemo(() => {
    if (!searchResults) return [];
    
    const results = [...searchResults];
    
    switch (sortBy) {
      case 'title':
        return results.sort((a, b) => a.title.localeCompare(b.title));
      case 'date':
        return results.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      default:
        return results; // Default is relevance, which is the order from the API
    }
  }, [searchResults, sortBy]);

  return (
    <div className="results-panel">
      <div className="results-header">
        <div className="results-count">
          {searchResultsCount} {searchResultsCount === 1 ? 'result' : 'results'} found
        </div>
        <div className="results-sort">
          <label htmlFor="sort-select">Sort by:</label>
          <select id="sort-select" value={sortBy} onChange={handleSortChange}>
            <option value="relevance">Relevance</option>
            <option value="title">Title</option>
            <option value="date">Date (newest)</option>
          </select>
        </div>
      </div>
      
      <div className="results-list">
        {sortedResults.length > 0 ? (
          sortedResults.map(renderResultCard)
        ) : (
          <div className="no-results">
            <span className="icon-ui-information"></span>
            <p>No results found. Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
