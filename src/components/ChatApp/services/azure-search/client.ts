import * as React from 'react';
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";

// Configuration for Azure AI Search
const AZURE_SEARCH_KEY = process.env.REACT_APP_AZURE_SEARCH_KEY || '';
const AZURE_SEARCH_ENDPOINT = process.env.REACT_APP_AZURE_SEARCH_ENDPOINT || '';
const AZURE_SEARCH_INDEX = process.env.REACT_APP_AZURE_SEARCH_INDEX || 'geospatial-index';

// Create Azure AI Search client
export const getSearchClient = () => {
  if (!AZURE_SEARCH_KEY || !AZURE_SEARCH_ENDPOINT) {
    throw new Error('Azure AI Search configuration is missing. Please check your environment variables.');
  }

  return new SearchClient(
    AZURE_SEARCH_ENDPOINT,
    AZURE_SEARCH_INDEX,
    new AzureKeyCredential(AZURE_SEARCH_KEY)
  );
};

// Get search index name based on environment configuration
export const getSearchIndex = () => {
  return AZURE_SEARCH_INDEX;
};

// Check if Azure AI Search is configured
export const isAzureSearchConfigured = () => {
  return Boolean(AZURE_SEARCH_KEY && AZURE_SEARCH_ENDPOINT && AZURE_SEARCH_INDEX);
};
