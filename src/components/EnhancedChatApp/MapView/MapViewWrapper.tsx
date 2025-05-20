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
  
  // Add a no-op onStationary handler to prevent runtime errors
  const handleStationary = (location: any) => {
    // This is a no-op function that prevents the "onStationary is not a function" error
    console.log('Map is stationary at:', location);
    // We could dispatch actions here if needed in the future
  };
  
  return (
    <div className="enhanced-map-container">
      {activeWebmap && (
        <MapView 
          webmapItem={activeWebmap}
          onStationary={handleStationary} // Add the required callback
        >
          {children}
        </MapView>
      )}
    </div>
  );
};

export default MapViewWrapper;
