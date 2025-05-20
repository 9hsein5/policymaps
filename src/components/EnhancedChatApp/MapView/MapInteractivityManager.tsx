import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveWebmap } from '../../../store/browseApp/reducers/map';
import './style.scss';

// This component ensures map interactivity matches the Browse App
// It serves as a bridge between the MapView and the Redux store
interface MapInteractivityManagerProps {
  // No props needed for this component
}

const MapInteractivityManager: React.FC<MapInteractivityManagerProps> = () => {
  const dispatch = useDispatch();
  
  // Listen for result selection events and update the map accordingly
  const handleResultSelection = (item: any) => {
    if (item && item.type === 'Web Map') {
      dispatch(setActiveWebmap(item));
    }
  };
  
  // This component doesn't render anything visible
  // It just manages the map interactivity
  return null;
};

export default MapInteractivityManager;
