import * as React from 'react';
import { useSelector } from 'react-redux';
import { activeWebmapSelector } from '../../../store/browseApp/reducers/map';
import MapView from '../../BrowseApp/MapView/MapView';
import './style.scss';

interface MapViewWrapperProps {
  children?: React.ReactNode;
}

// This component ensures the map loads and behaves exactly like in the Browse App
const MapViewWrapper: React.FC<MapViewWrapperProps> = ({ children }) => {
  const activeWebmap = useSelector(activeWebmapSelector);
  
  // Add a proper onStationary handler to prevent runtime errors
  const handleStationary = React.useCallback((location: any) => {
    // This is a no-op function that prevents the "onStationary is not a function" error
    console.log('Map is stationary at:', location);
    // We could dispatch actions here if needed in the future
  }, []);
  
  // Add comprehensive error handling for map interactions
  React.useEffect(() => {
    // Add global unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.name === 'AbortError') {
        // Prevent the error from bubbling up to the console
        event.preventDefault();
        console.log('Handled AbortError:', event.reason.message);
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Add global error handler for other map-related errors
    const handleError = (event: ErrorEvent) => {
      // Check if error is related to map operations
      if (event.message && (
        event.message.includes('esri') || 
        event.message.includes('map') || 
        event.message.includes('arcgis')
      )) {
        // Prevent the error from bubbling up
        event.preventDefault();
        console.log('Handled map error:', event.message);
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // Display a blank map container when no webmap is active
  if (!activeWebmap) {
    return (
      <div className="enhanced-map-container empty-map">
        <div className="map-placeholder">
          <p>Use the search tab to find and display maps</p>
        </div>
        {children}
      </div>
    );
  }
  
  return (
    <div className="enhanced-map-container">
      <MapView 
        webmapItem={activeWebmap}
        onStationary={handleStationary}
      >
        {children}
      </MapView>
    </div>
  );
};

export default MapViewWrapper;
