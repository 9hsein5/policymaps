import * as React from 'react';
import { Tier } from '../../../AppConfig';
import { SearchAutoComplete } from '../../index';
import './style.scss';

interface Props {
  onSearchTermChange?: (searchTerm: string) => void;
}

const SearchPanel: React.FC<Props> = ({ onSearchTermChange }) => {
  const [searchTips, setSearchTips] = React.useState<boolean>(true);

  const handleSearchSelect = (searchTerm: string) => {
    if (onSearchTermChange) {
      onSearchTermChange(searchTerm);
    }
  };

  return (
    <div className="search-panel">
      <div className="search-container">
        <div className="search-input-container">
          <SearchAutoComplete 
            groupId={Tier.PROD.AGOL_GROUP_ID}
            onSelect={handleSearchSelect}
            placeholder={'Search for datasets...'}
            filters={'type:"web map"'}
          />
        </div>
      </div>
      
      {searchTips && (
        <div className="search-tips">
          <h3>Search Tips</h3>
          <p>Try searching for:</p>
          <ul>
            <li>Specific locations (e.g., "Beirut", "Tripoli")</li>
            <li>Disaster types (e.g., "flood", "earthquake")</li>
            <li>Infrastructure (e.g., "hospitals", "schools")</li>
            <li>Humanitarian concerns (e.g., "refugee camps", "food security")</li>
          </ul>
          <button 
            className="close-tips-button"
            onClick={() => setSearchTips(false)}
          >
            <span className="icon-ui-close"></span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
