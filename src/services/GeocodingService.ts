import { geocode } from '@esri/arcgis-rest-geocoding';
import { UserSession } from '@esri/arcgis-rest-auth';
import EsriOAuth from '../utils/Esri-OAuth';

/**
 * Geocode a location string to coordinates
 * @param locationText The location text to geocode
 * @param esriOAuthUtils EsriOAuth instance or token string
 * @returns The geocoded location or null if not found
 */
export const geocodeLocation = async (locationText: string, esriOAuthUtils?: EsriOAuth | string) => {
  if (!locationText || locationText.trim() === '') {
    return null;
  }
  
  try {
    let authentication = null;
    
    // Handle different authentication scenarios
    if (typeof esriOAuthUtils === 'string') {
      // Direct token string provided
      authentication = new UserSession({ token: esriOAuthUtils });
    } else if (esriOAuthUtils instanceof EsriOAuth) {
      // EsriOAuth instance provided
      authentication = await esriOAuthUtils.getAuthSession();
    }
    
    // Try with authentication first if available
    if (authentication) {
      try {
        const response = await geocode({
          address: locationText,
          authentication,
          params: {
            maxResults: 5,
            outFields: ['*'],
            forStorage: false,
            f: 'json'
          }
        });
        
        if (response.candidates && response.candidates.length > 0) {
          return response.candidates[0].location;
        }
      } catch (authError) {
        console.error('Authenticated geocoding error:', authError);
        // Continue to public geocoding if authentication fails
      }
    }
    
    // Always try public geocoding as fallback or primary method if no auth
    // Use the ArcGIS World Geocoding Service which allows public access
    const publicResponse = await geocode({
      address: locationText,
      authentication: null, // Explicitly set to null for public access
      endpoint: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer', // Use public endpoint
      params: {
        maxResults: 5,
        outFields: ['*'],
        forStorage: false,
        f: 'json'
      }
    });
    
    if (publicResponse.candidates && publicResponse.candidates.length > 0) {
      return publicResponse.candidates[0].location;
    }
    
    return null;
  } catch (error) {
    console.error('All geocoding attempts failed:', error);
    return null;
  }
};
