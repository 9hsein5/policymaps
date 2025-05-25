import * as React from 'react';
import { useDispatch } from 'react-redux';
import SmartSearchInput from './SmartSearchInput';
import SmartSearchResults from './SmartSearchResults';
import { searchByTerm, searchByCategorySchema } from '../../../store/browseApp/reducers/search';
import { setCenterLocation } from '../../../store/browseApp/reducers/map';
import { geocodeLocation } from '../../../services/GeocodingService';

interface Props {
  onSearchComplete?: () => void;
}

const SmartSearchContainer: React.FC<Props> = ({
  onSearchComplete
}) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = React.useState(null);
  
  const handleSearch = async (params: {
    cleanQuery: string;
    categories: string[];
    location?: string | null;
    timeFilter?: any;
  }) => {
    setSearchParams(params);
    
    // Dispatch search by term
    if (params.cleanQuery) {
      dispatch(searchByTerm(params.cleanQuery));
    }
    
    // Dispatch category search if categories found
    if (params.categories.length > 0) {
      params.categories.forEach(category => {
        dispatch(searchByCategorySchema({ category }));
      });
    }
    
    // Handle location if present
    if (params.location) {
      try {
        const geocodeResult = await geocodeLocation(params.location);
        if (geocodeResult) {
          dispatch(setCenterLocation({
            lat: geocodeResult.y,
            lon: geocodeResult.x,
            zoom: 10
          }));
        }
      } catch (error) {
        console.error('Error geocoding location:', error);
      }
    }
    
    if (onSearchComplete) {
      onSearchComplete();
    }
  };
  
  const handleClearFilter = (filterType: 'query' | 'location' | 'category' | 'time', value: any) => {
    if (!searchParams) return;
    
    let updatedParams = { ...searchParams };
    
    switch (filterType) {
      case 'query':
        updatedParams.cleanQuery = '';
        break;
      case 'location':
        updatedParams.location = null;
        break;
      case 'category':
        updatedParams.categories = updatedParams.categories.filter((c: string) => c !== value);
        break;
      case 'time':
        updatedParams.timeFilter = null;
        break;
    }
    
    setSearchParams(updatedParams);
    handleSearch(updatedParams);
  };
  
  return (
    <div className="smart-search">
      <SmartSearchInput onSearch={handleSearch} />
      <SmartSearchResults 
        searchParams={searchParams} 
        onClearFilter={handleClearFilter} 
      />
    </div>
  );
};

export default SmartSearchContainer;
