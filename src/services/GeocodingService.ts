import { geocode } from '@esri/arcgis-rest-geocoding';

export const geocodeLocation = async (locationText: string) => {
  try {
    const response = await geocode({
      address: locationText,
      authentication: null // Use public access
    });
    
    if (response.candidates && response.candidates.length > 0) {
      return response.candidates[0].location;
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};
