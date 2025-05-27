import { geocode } from '@esri/arcgis-rest-geocoding';

const portalData = {
    agolHost: '',
    geocodeEndpoint: '',
    token: ''
};

interface GeocodeOptions {
    locationText: string;
    esriOAuthUtils?: string | any; // Can be a token string or an instance of EsriOAuth
}

export const geocodeLocation = async ({ locationText, esriOAuthUtils }: GeocodeOptions): Promise<any> => {
    if (!locationText) {
        throw new Error('Location text is required for geocoding');
    }

    try {
        // Use the ArcGIS World Geocoding Service
        const response = await geocode({
            address: locationText,
            authentication: esriOAuthUtils || null, // Use provided authentication or null for public access
            endpoint: portalData.geocodeEndpoint,
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

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
};

export const setPortalDataForGeocoding = ({
    agolHost = 'https://www.arcgis.com',
    geocodeEndpoint = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',
    token = ''
}: {
    agolHost?: string;
    geocodeEndpoint?: string;
    token?: string;
} = {}) => async () => {
    portalData.agolHost = agolHost;
    portalData.token = token;

    if (geocodeEndpoint) {
        portalData.geocodeEndpoint = geocodeEndpoint;
    }

    else {
        const portalResponse = await fetch(`${agolHost}/sharing/rest/portals/self?f=json`);

        if (!portalResponse.ok) {
            throw new Error(`Error fetching portal data: ${portalResponse.statusText}`);
        }
        
        const portalInfo = await portalResponse.json();

        if (portalInfo.helperServices && portalInfo.helperServices.geocode) {
            portalData.geocodeEndpoint = portalInfo.helperServices.geocode[0].url;
        } else {
            console.warn('No geocoding service found in portal info, using default endpoint');
        }
    }
};