import * as React from 'react';
import { useDispatch } from 'react-redux';
import SmartSearchInput from './SmartSearchInput';
import SmartSearchResults from './SmartSearchResults';
import { searchByTerm, searchByCategorySchema } from '../../../store/browseApp/reducers/search';
import { setCenterLocation } from '../../../store/browseApp/reducers/map';
import { geocodeLocation } from '../../../services/GeocodingService';
import { EnhancedSmartSearchParams } from '../../../services/azure-openai/chat';
import { smartSearchService } from '../../../services/SmartSearchService';
import { SiteContext } from '../../../contexts/SiteContextProvider';

interface Props {
  onSearchComplete?: () => void;
}

const SmartSearchContainer: React.FC<Props> = ({
  onSearchComplete
}) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = React.useState<EnhancedSmartSearchParams | null>(null);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const siteContext = React.useContext(SiteContext);
  const { esriOAuthUtils } = siteContext;
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (esriOAuthUtils) {
      const init = async () => {
        try {
          const { credential } = await esriOAuthUtils.init();
          const { token } = credential;

          console.log('Initializing Smart Search with token:', token);
                    
          // Set token in smart search service
          smartSearchService.setToken(token);
        } catch (error) {
          console.error('Error initializing services:', error);
          setError('Failed to initialize search services. Please try again later.');
        }
      };
      
      init();
    }
  }, [esriOAuthUtils]);

  const handleSearch = async (params: EnhancedSmartSearchParams) => {
    setSearchParams(params);
    setIsProcessing(true);
    
    try {
      // Dispatch search by term using the clean query
      if (params.cleanQuery) {
        dispatch(searchByTerm(params.cleanQuery));
      }
      
      // Dispatch category search if categories found
      if (params.categories && params.categories.length > 0) {
        params.categories.forEach(category => {
          dispatch(searchByCategorySchema({ category }));
        });
      }
      
      // Handle subcategories if available (can be used for more specific filtering)
      if (params.subcategories && params.subcategories.length > 0) {
        // Additional subcategory-specific logic could be added here
        console.log('Subcategories detected:', params.subcategories);
      }
      
      // Handle location if present
      if (params.location) {
        try {
          const geocodeResult = await geocodeLocation(params.location);
          if (geocodeResult) {
            // Use spatial relationships to determine zoom level if available
            let zoomLevel = 10; // Default zoom level
            
            if (params.spatialRelationships && params.spatialRelationships.length > 0) {
              // Adjust zoom based on spatial relationship
              if (params.spatialRelationships.some(rel => rel.includes('within') || rel.includes('near'))) {
                zoomLevel = 12; // Closer zoom for "within" or "near" relationships
              } else if (params.spatialRelationships.some(rel => rel.includes('surrounding') || rel.includes('around'))) {
                zoomLevel = 9; // Wider zoom for "surrounding" or "around" relationships
              } else if (params.spatialRelationships.some(rel => rel.includes('between'))) {
                zoomLevel = 8; // Even wider zoom for "between" relationships
              }
            }
            
            dispatch(setCenterLocation({
              lat: geocodeResult.y,
              lon: geocodeResult.x,
              zoom: zoomLevel
            }));
          }
        } catch (error) {
          console.error('Error geocoding location:', error);
        }
      }
      
      if (onSearchComplete) {
        onSearchComplete();
      }
    } catch (error) {
      console.error('Error processing search results:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleClearFilter = (filterType: 'query' | 'location' | 'category' | 'subcategory' | 'time', value: any) => {
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
      case 'subcategory':
        updatedParams.subcategories = updatedParams.subcategories.filter((sc: string) => sc !== value);
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
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default SmartSearchContainer;
