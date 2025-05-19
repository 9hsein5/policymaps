import * as React from 'react';
import { loadModules } from 'esri-loader';
import './style.scss';

interface MapViewProps {
  mapProperties?: __esri.MapProperties;
  viewProperties?: __esri.MapViewProperties;
  onLoad?: (map: __esri.Map, view: __esri.MapView) => void;
}

const MapViewComponent: React.FC<MapViewProps> = ({
  mapProperties = {},
  viewProperties = {},
  onLoad
}) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Debug logging
    console.log('MapView - Initializing with props:', { mapProperties, viewProperties });
    
    let view: __esri.MapView;
    
    const loadMap = async () => {
      try {
        // Load the ArcGIS API modules
        const [Map, MapView] = await loadModules(['esri/Map', 'esri/views/MapView']);
        
        // Create the map
        const map = new Map({
          basemap: 'streets-vector',
          ...mapProperties
        });
        
        console.log('MapView - Map created:', map);
        
        // Create the view
        if (mapRef.current) {
          view = new MapView({
            container: mapRef.current,
            map: map,
            center: [0, 0],
            zoom: 2,
            ...viewProperties
          });
          
          console.log('MapView - View created:', view);
          
          // Wait for the view to load
          await view.when();
          console.log('MapView - View loaded successfully');
          
          setMapLoaded(true);
          
          // Call the onLoad callback if provided
          if (onLoad) {
            onLoad(map, view);
          }
        } else {
          setError('Map container reference is not available');
          console.error('MapView - Map container reference is not available');
        }
      } catch (err) {
        setError(`Error loading map: ${err instanceof Error ? err.message : String(err)}`);
        console.error('MapView - Error loading map:', err);
      }
    };
    
    loadMap();
    
    // Clean up the map view when the component unmounts
    return () => {
      if (view) {
        console.log('MapView - Destroying view');
        view.destroy();
      }
    };
  }, []);
  
  return (
    <div className="map-view-container">
      {error && (
        <div className="map-error">
          {error}
        </div>
      )}
      <div 
        ref={mapRef} 
        className="map-view"
        style={{ width: '100%', height: '100%' }}
      >
        {!mapLoaded && !error && (
          <div className="map-loading">
            Loading map...
          </div>
        )}
      </div>
    </div>
  );
};

export default MapViewComponent;
