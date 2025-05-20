import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { itemsSelector, searchResultSelector, loadMoreItems } from '../../../store/browseApp/reducers/groupContent';
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
  const nextStart = searchResponse ? searchResponse.nextStart : -1;
  const dispatch = useDispatch();
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  
  // Debounce function to prevent multiple rapid calls
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return function(...args: any[]) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };
  
  // Handle scroll event to load more items when user scrolls to bottom
  const handleScroll = React.useCallback(debounce(() => {
    if (!resultsRef.current || isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = resultsRef.current;
    
    // If scrolled to bottom (with a small threshold)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      // Load more items if we haven't loaded all items yet and there are more to load
      if (items.length < totalCount && nextStart !== -1) {
        setIsLoading(true);
        dispatch(loadMoreItems());
      }
    }
  }, 200), [items.length, totalCount, nextStart, isLoading, dispatch]);
  
  // Reset loading state when items change
  React.useEffect(() => {
    setIsLoading(false);
  }, [items]);
  
  // Add scroll event listener
  React.useEffect(() => {
    const resultsElement = resultsRef.current;
    if (resultsElement) {
      resultsElement.addEventListener('scroll', handleScroll);
      
      return () => {
        resultsElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);
  
  // Check if we need to show loading indicator
  const showLoadingIndicator = isLoading || (items.length < totalCount && nextStart !== -1);
  
  return (
    <div className="results-panel fancy-scrollbar" ref={resultsRef}>
      <div className="card-list-container">
        <CardListContainer 
          title={title}
          data={items}
          itemCount={totalCount}
        />
      </div>
      {showLoadingIndicator && items.length > 0 && (
        <div className="loading-more-indicator">
          Loading more results...
        </div>
      )}
      {items.length === 0 && !isLoading && (
        <div className="no-results">
          No results found. Try a different search term.
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;
