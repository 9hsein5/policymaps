import * as React from 'react';
import { AgolItem } from '../../../utils/arcgis-online-item-formatter';

interface Props {
  mapView?: any;
  webmapItem?: AgolItem;
  initialCenter?: {
    lon: number;
    lat: number;
  };
  initialZoom?: number;
  onStationary?: (location: any) => void;
  children?: React.ReactNode;
}

// This is a wrapper component that passes props to the MapView component
const MapView: React.FC<Props> = ({
  mapView,
  webmapItem,
  initialCenter,
  initialZoom,
  onStationary
}) => {
  // Import the actual MapView component
  const ActualMapView = React.lazy(() => import('./MapView'));

  return (
    <React.Suspense fallback={<div className="loading-map">Loading map...</div>}>
      <ActualMapView
        webmapItem={webmapItem}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        onStationary={onStationary}
      />
    </React.Suspense>
  );
};

export default MapView;
