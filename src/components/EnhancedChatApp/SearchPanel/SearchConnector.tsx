import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateSearchTerm, 
  searchItems, 
  searchResultSelector 
} from '../../../store/browseApp/reducers/groupContent';
import './style.scss';

interface SearchConnectorProps {
  children?: React.ReactNode;
}

// This component ensures search functionality is properly connected to Redux
const SearchConnector: React.FC<SearchConnectorProps> = ({ children }) => {
  const dispatch = useDispatch();
  const searchResult = useSelector(searchResultSelector);
  
  // Function to perform search and update Redux store
  const performSearch = (query: string) => {
    // Update search term in Redux
    dispatch(updateSearchTerm(query));
    
    // Trigger search action
    dispatch(searchItems());
  };
  
  // This component doesn't render anything visible
  // It just connects search functionality to Redux
  return null;
};

export default SearchConnector;
