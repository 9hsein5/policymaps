import * as React from 'react';
import { loadModules, loadCss } from 'esri-loader';

import IMapView from 'esri/views/MapView';
import IMap from "esri/Map";
import IGraphicsLayer from 'esri/layers/GraphicsLayer';
import IwatchUtils from 'esri/core/watchUtils';
import IWebMap from "esri/WebMap";

import { AgolItem } from '../../../utils/arcgis-online-item-formatter';
import { SiteContext } from '../../../contexts/SiteContextProvider';

import './style.scss';

interface Props {
  webmapItem?: AgolItem;
  initialCenter?: {
    lon: number;
    lat: number;
  };
  initialZoom?: number;
  onStationary?: (location: any) => void;
  children?: React.ReactNode;
};

const MapView: React.FC<Props> = ({
  webmapItem,
  initialCenter = { lon: 35.5018, lat: 33.8938 }, // Default to Lebanon
  initialZoom = 8,
  onStationary,
  children
}: Props) => {
  const mapDivRef = React.useRef<HTMLDivElement>(null);
  const { isMobile } = React.useContext(SiteContext);
  const [mapView, setMapView] = React.useState<IMapView>(null);
  const [graphicsLayer, setGraphicsLayer] = React.useState<IGraphicsLayer>(null);

  const initMapView = async () => {
    try {
      loadCss();
      
      const [MapView, Map, GraphicsLayer] = await loadModules([
        'esri/views/MapView',
        'esri/Map',
        'esri/layers/GraphicsLayer'
      ]);

      // Create the base map
      const map = new Map({
        basemap: 'topo-vector'
      });

      // Create a graphics layer for search results
      const layer = new GraphicsLayer();
      map.add(layer);
      setGraphicsLayer(layer);

      // Create the map view
      const view = new MapView({
        container: mapDivRef.current,
        map: map,
        center: [initialCenter.lon, initialCenter.lat],
        zoom: initialZoom,
        popup: {
          dockOptions: {
            position: 'bottom-right'
          }
        }
      });

      // When the view is ready, set it to state
      view.when(() => {
        setMapView(view);
      });

    } catch (err) {
      console.error('Error initializing map view:', err);
    }
  };

  const loadWebMap = async () => {
    if (!webmapItem || !webmapItem.id) return;

    try {
      const [WebMap] = await loadModules(['esri/WebMap']);

      // Replace the current map with the web map
      mapView.map = new WebMap({
        portalItem: {
          id: webmapItem.id
        }
      });
    } catch (err) {
      console.error('Error loading web map:', err);
    }
  };

  const addWatchEvent = async () => {
    try {
      const [watchUtils] = await loadModules(['esri/core/watchUtils']);

      watchUtils.whenTrue(mapView, 'stationary', () => {
        if (mapView.zoom === -1) return;

        const centerLocation = {
          lat: mapView.center && mapView.center.latitude
            ? +mapView.center.latitude.toFixed(3)
            : 0,
          lon: mapView.center && mapView.center.longitude
            ? +mapView.center.longitude.toFixed(3)
            : 0,
          zoom: mapView.zoom
        };

        if (onStationary) {
          onStationary(centerLocation);
        }
      });
    } catch (err) {
      console.error('Error adding watch event:', err);
    }
  };

  // Initialize the map on component mount
  React.useEffect(() => {
    initMapView();
    
    // Cleanup function
    return () => {
      if (mapView) {
        mapView.destroy();
      }
    };
  }, []);

  // Load web map when webmapItem changes
  React.useEffect(() => {
    if (mapView && webmapItem) {
      loadWebMap();
    }
  }, [webmapItem, mapView]);

  // Add watch event when mapView is ready
  React.useEffect(() => {
    if (mapView) {
      addWatchEvent();
    }
  }, [mapView]);

  return (
    <div className="chat-map-container">
      <div
        className="chat-map-view"
        ref={mapDivRef}
      ></div>
      {mapView && React.Children.map(children, (child) => {
        return React.cloneElement(child as React.ReactElement<any>, {
          mapView,
        });
      })}
    </div>
  );
};

export default MapView;
