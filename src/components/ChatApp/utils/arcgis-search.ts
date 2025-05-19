import * as React from 'react';
import { loadModules } from 'esri-loader';

// Function to search ArcGIS Online for items
export const searchArcGISOnline = async (
  searchTerm: string,
  groupId: string,
  start: number = 1,
  num: number = 10,
  categories?: string[]
) => {
  try {
    const [portal] = await loadModules(['esri/portal/Portal']);
    
    // Build the query
    let query = `(${searchTerm}) AND group:${groupId}`;
    
    // Add category filters if provided
    if (categories && categories.length > 0) {
      const categoryQuery = categories.map(cat => `category:${cat}`).join(' OR ');
      query = `${query} AND (${categoryQuery})`;
    }
    
    // Execute the search
    const response = await portal.queryItems({
      query,
      start,
      num,
      sortField: 'relevance',
      sortOrder: 'desc'
    });
    
    return {
      results: response.results,
      total: response.total,
      start,
      num
    };
  } catch (error) {
    console.error('Error searching ArcGIS Online:', error);
    throw error;
  }
};

// Function to add a web map to a map view
export const addWebMapToView = async (mapView: any, itemId: string) => {
  try {
    const [WebMap] = await loadModules(['esri/WebMap']);
    
    const webmap = new WebMap({
      portalItem: {
        id: itemId
      }
    });
    
    mapView.map = webmap;
    
    return webmap;
  } catch (error) {
    console.error('Error adding web map to view:', error);
    throw error;
  }
};

// Function to add a point to the map
export const addPointToMap = async (mapView: any, graphicsLayer: any, point: { x: number, y: number }, attributes: any) => {
  try {
    const [Graphic, Point] = await loadModules([
      'esri/Graphic',
      'esri/geometry/Point'
    ]);
    
    const pointGeometry = new Point({
      x: point.x,
      y: point.y,
      spatialReference: { wkid: 4326 }
    });
    
    const markerSymbol = {
      type: "simple-marker",
      color: [226, 43, 30], // Red
      outline: {
        color: [255, 255, 255],
        width: 2
      }
    };
    
    const pointGraphic = new Graphic({
      geometry: pointGeometry,
      symbol: markerSymbol,
      attributes,
      popupTemplate: {
        title: attributes.title || "Location",
        content: attributes.description || "No description available"
      }
    });
    
    graphicsLayer.add(pointGraphic);
    
    return pointGraphic;
  } catch (error) {
    console.error('Error adding point to map:', error);
    throw error;
  }
};

// Function to create a graphics layer
export const createGraphicsLayer = async (mapView: any) => {
  try {
    const [GraphicsLayer] = await loadModules(['esri/layers/GraphicsLayer']);
    
    const layer = new GraphicsLayer();
    mapView.map.add(layer);
    
    return layer;
  } catch (error) {
    console.error('Error creating graphics layer:', error);
    throw error;
  }
};

// Function to clear graphics from a layer
export const clearGraphics = (graphicsLayer: any) => {
  if (graphicsLayer) {
    graphicsLayer.removeAll();
  }
};
