import * as React from 'react';
import { useSelector } from 'react-redux';
import { itemsSelector, searchResultSelector } from '../../../store/browseApp/reducers/groupContent';
import CardListContainer from '../../BrowseApp/CardList/CardListContainer';
import './style.scss';

interface ResultsPanelProps {
  title?: string;
  onItemClick?: (item: any) => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
  title = 'Search Results',
  onItemClick
}) => {
  const items = useSelector(itemsSelector);
  const searchResponse = useSelector(searchResultSelector);
  const totalCount = searchResponse ? searchResponse.total : 0;
  
  // We don't directly use onItemClick since CardListContainer handles item clicks internally
  return (
    <div className="results-panel">
      <CardListContainer 
        title={title}
        data={items}
        itemCount={totalCount}
      />
    </div>
  );
};

export default ResultsPanel;
