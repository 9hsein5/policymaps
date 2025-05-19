import * as React from 'react';
import { loadModules } from 'esri-loader';
import MapView from './index';

import { AgolItem } from '../../../utils/arcgis-online-item-formatter';

interface Props {
  selectedItem?: AgolItem;
}

const MapViewContainer: React.FC<Props> = ({ selectedItem }) => {
  const [mapView, setMapView] = React.useState<any>(null);
  const [graphicsLayer, setGraphicsLayer] = React.useState<any>(null);

  // Function to add a point graphic to the map
  const addPointToMap = async (item: AgolItem) => {
    if (!mapView || !graphicsLayer) return;

    try {
      const [Graphic, Point] = await loadModules([
        'esri/Graphic',
        'esri/geometry/Point'
      ]);

      // Clear existing graphics
      graphicsLayer.removeAll();

      // Create a point at the item's location (if available)
      if (item.extent && item.extent.length === 2) {
        // Calculate center point from extent
        const centerX = (item.extent[0][0] + item.extent[1][0]) / 2;
        const centerY = (item.extent[0][1] + item.extent[1][1]) / 2;

        const point = new Point({
          longitude: centerX,
          latitude: centerY
        });

        // Create a symbol for the point
        const markerSymbol = {
          type: "simple-marker",
          color: [226, 43, 30], // Red
          outline: {
            color: [255, 255, 255],
            width: 2
          }
        };

        // Create a graphic and add it to the graphics layer
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol,
          attributes: {
            title: item.title,
            description: item.snippet || 'No description available'
          },
          popupTemplate: {
            title: "{title}",
            content: "{description}"
          }
        });

        graphicsLayer.add(pointGraphic);

        // Zoom to the point
        mapView.goTo({
          target: point,
          zoom: 10
        });
      }
    } catch (err) {
      console.error('Error adding point to map:', err);
    }
  };

  // Function to load a web map
  const loadWebMap = async (item: AgolItem) => {
    if (!mapView || !item.id) return;

    try {
      const [WebMap] = await loadModules(['esri/WebMap']);

      // Replace the current map with the web map
      mapView.map = new WebMap({
        portalItem: {
          id: item.id
        }
      });
    } catch (err) {
      console.error('Error loading web map:', err);
    }
  };

  // Initialize graphics layer when map view is set
  const initGraphicsLayer = async (view: any) => {
    try {
      const [GraphicsLayer] = await loadModules(['esri/layers/GraphicsLayer']);
      
      // Create a graphics layer for search results
      const layer = new GraphicsLayer();
      view.map.add(layer);
      setGraphicsLayer(layer);
    } catch (err) {
      console.error('Error initializing graphics layer:', err);
    }
  };

  // Handle map view ready
  const handleMapViewReady = (view: any) => {
    setMapView(view);
    initGraphicsLayer(view);
  };

  // Handle selected item changes
  React.useEffect(() => {
    if (!selectedItem || !mapView) return;

    if (selectedItem.type === 'Web Map') {
      loadWebMap(selectedItem);
    } else {
      addPointToMap(selectedItem);
    }
  }, [selectedItem, mapView, graphicsLayer]);

  // Set up event listener for adding items to map
  React.useEffect(() => {
    const handleAddItemToMap = (event: CustomEvent) => {
      if (event.detail && mapView) {
        if (event.detail.type === 'Web Map') {
          loadWebMap(event.detail);
        } else {
          addPointToMap(event.detail);
        }
      }
    };

    document.addEventListener('addItemToMap', handleAddItemToMap as EventListener);

    return () => {
      document.removeEventListener('addItemToMap', handleAddItemToMap as EventListener);
    };
  }, [mapView, graphicsLayer]);

  return (
    <MapView 
      initialCenter={{ lon: 35.5018, lat: 33.8938 }} // Lebanon
      initialZoom={8}
    />
  );
};

export default MapViewContainer;
