import * as React from 'react';

// Utility functions for React component lifecycle management
export const useComponentDidMount = (callback: () => void | (() => void)) => {
  React.useEffect(() => {
    return callback();
  }, []);
};

export const useComponentWillUnmount = (callback: () => void) => {
  React.useEffect(() => {
    return callback;
  }, []);
};

// Custom hook for safely managing ArcGIS map instances
export const useMapInstance = (mapDivRef: React.RefObject<HTMLDivElement>) => {
  const [mapView, setMapView] = React.useState<any>(null);
  const [graphicsLayer, setGraphicsLayer] = React.useState<any>(null);
  
  // Initialize map and clean up on unmount
  React.useEffect(() => {
    let isMounted = true;
    let view: any = null;
    
    const initMap = async () => {
      try {
        const { loadModules, loadCss } = await import('esri-loader');
        loadCss();
        
        const [Map, MapView, GraphicsLayer] = await loadModules([
          'esri/Map',
          'esri/views/MapView',
          'esri/layers/GraphicsLayer'
        ]);
        
        // Create the map
        const map = new Map({
          basemap: 'topo-vector'
        });
        
        // Create a graphics layer
        const layer = new GraphicsLayer();
        map.add(layer);
        
        // Create the view
        view = new MapView({
          container: mapDivRef.current,
          map: map,
          center: [35.5018, 33.8938], // Lebanon
          zoom: 8
        });
        
        // Wait for the view to be ready
        await view.when();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setMapView(view);
          setGraphicsLayer(layer);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };
    
    if (mapDivRef.current) {
      initMap();
    }
    
    // Clean up function
    return () => {
      isMounted = false;
      if (view) {
        view.destroy();
      }
    };
  }, [mapDivRef]);
  
  return { mapView, graphicsLayer };
};

// Custom hook for handling tab state
export const useTabs = (initialTab: string = 'chat') => {
  const [activeTab, setActiveTab] = React.useState(initialTab);
  
  const handleTabChange = React.useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);
  
  return { activeTab, handleTabChange };
};

// Custom hook for managing chat messages
export const useChatMessages = () => {
  const [messages, setMessages] = React.useState<Array<{type: string, content: string}>>([
    {type: 'system', content: 'Welcome to the Lebanese Red Cross Map Chat! Ask me about available datasets or how to find specific information.'},
    {type: 'system', content: 'Try asking about "flood maps", "refugee camps", or "healthcare facilities in Lebanon".'}
  ]);
  
  const addUserMessage = React.useCallback((content: string) => {
    setMessages(prev => [...prev, {type: 'user', content}]);
  }, []);
  
  const addSystemMessage = React.useCallback((content: string) => {
    setMessages(prev => [...prev, {type: 'system', content}]);
  }, []);
  
  return { messages, addUserMessage, addSystemMessage };
};

// Error boundary component
export const ErrorBoundary: React.FC<{children: React.ReactNode, fallback: React.ReactNode}> = ({ 
  children, 
  fallback 
}) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Error caught by error boundary:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);
  
  if (hasError) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
