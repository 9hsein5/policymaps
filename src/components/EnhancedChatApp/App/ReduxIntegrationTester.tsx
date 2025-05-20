import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateSearchTerm, 
  searchItems, 
  searchResultSelector,
  itemsSelector 
} from '../../../store/browseApp/reducers/groupContent';
import { setActiveWebmap } from '../../../store/browseApp/reducers/map';
import { toggleSidebar, hideSideBarSelectore } from '../../../store/browseApp/reducers/UI';
import './style.scss';

// This component integrates all Redux connections for testing
const ReduxIntegrationTester: React.FC = () => {
  const dispatch = useDispatch();
  const searchResult = useSelector(searchResultSelector);
  const items = useSelector(itemsSelector);
  const hideSideBar = useSelector(hideSideBarSelectore);
  
  // Test all Redux connections
  React.useEffect(() => {
    const testReduxConnections = async () => {
      console.log('Testing Redux connections...');
      
      // Test search functionality
      dispatch(updateSearchTerm('test search'));
      dispatch(searchItems());
      
      // Test sidebar toggle
      dispatch(toggleSidebar());
      
      // Test map interaction (if items exist)
      if (items && items.length > 0) {
        const webmapItem = items.find(item => item.type === 'Web Map');
        if (webmapItem) {
          dispatch(setActiveWebmap(webmapItem));
        }
      }
      
      console.log('Redux connections test complete');
    };
    
    // Uncomment to run the test
    // testReduxConnections();
  }, []);
  
  // This component doesn't render anything visible
  return null;
};

export default ReduxIntegrationTester;
