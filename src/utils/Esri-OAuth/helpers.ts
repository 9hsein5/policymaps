/**
 * Esri-OAuth Helper Functions
 * Utility functions to standardize token access across the application
 */

import { UserSession } from '@esri/arcgis-rest-auth';
import EsriOAuth from './index';

/**
 * Get authentication session from Esri OAuth
 * @param esriOAuthUtils EsriOAuth instance
 * @returns UserSession or null if not authenticated
 */
export const getAuthenticationFromEsriOAuth = async (esriOAuthUtils: EsriOAuth): Promise<UserSession | null> => {
  if (!esriOAuthUtils) {
    return null;
  }
  
  try {
    const { credential } = await esriOAuthUtils.init();
    
    if (!credential || !credential.token) {
      return null;
    }
    
    return new UserSession({ token: credential.token });
  } catch (error) {
    console.error('Error getting authentication from Esri OAuth:', error);
    return null;
  }
};

/**
 * Get authentication parameters for REST API calls
 * @param esriOAuthUtils EsriOAuth instance or token string
 * @returns Object with authentication parameters
 */
export const getAuthParams = async (esriOAuthUtils: EsriOAuth | string): Promise<Record<string, string>> => {
  // If string is passed, assume it's a token
  if (typeof esriOAuthUtils === 'string') {
    return {
      token: esriOAuthUtils,
      f: 'json'
    };
  }
  
  // Otherwise, get token from EsriOAuth
  if (!esriOAuthUtils) {
    return { f: 'json' };
  }
  
  try {
    const { credential } = await esriOAuthUtils.init();
    
    if (!credential || !credential.token) {
      return { f: 'json' };
    }
    
    return {
      token: credential.token,
      f: 'json'
    };
  } catch (error) {
    console.error('Error getting auth params from Esri OAuth:', error);
    return { f: 'json' };
  }
};

/**
 * Get token from Esri OAuth
 * @param esriOAuthUtils EsriOAuth instance
 * @returns Token string or undefined if not authenticated
 */
export const getTokenFromEsriOAuth = async (esriOAuthUtils: EsriOAuth): Promise<string | undefined> => {
  if (!esriOAuthUtils) {
    return undefined;
  }
  
  try {
    const { credential } = await esriOAuthUtils.init();
    return credential?.token;
  } catch (error) {
    console.error('Error getting token from Esri OAuth:', error);
    return undefined;
  }
};

/**
 * Check if user is authenticated
 * @param esriOAuthUtils EsriOAuth instance
 * @returns Boolean indicating if user is authenticated
 */
export const isAuthenticated = async (esriOAuthUtils: EsriOAuth): Promise<boolean> => {
  if (!esriOAuthUtils) {
    return false;
  }
  
  try {
    const { credential } = await esriOAuthUtils.init();
    return !!credential?.token;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Create authenticated axios request config
 * @param esriOAuthUtils EsriOAuth instance or token string
 * @returns Axios request config with authentication
 */
export const createAuthRequestConfig = async (esriOAuthUtils: EsriOAuth | string) => {
  const params = await getAuthParams(esriOAuthUtils);
  
  return {
    params
  };
};
