import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { 
  AZURE_SEARCH_KEY, 
  AZURE_SEARCH_ENDPOINT, 
  AZURE_SEARCH_INDEX,
  isAzureSearchConfigured 
} from '../azure-config';

// Search result interface
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type?: string;
  url?: string;
  thumbnailUrl?: string;
  score?: number;
  [key: string]: any;
}

// Document interface to fix TypeScript errors
interface SearchDocument {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  thumbnailUrl?: string;
  [key: string]: any;
}

// Create Azure AI Search client
export const getSearchClient = () => {
  if (!isAzureSearchConfigured()) {
    throw new Error('Azure AI Search configuration is missing. Please check your environment variables.');
  }
  
  return new SearchClient(
    AZURE_SEARCH_ENDPOINT,
    AZURE_SEARCH_INDEX,
    new AzureKeyCredential(AZURE_SEARCH_KEY)
  );
};

/**
 * Search for documents in Azure AI Search
 * @param query Search query
 * @param options Search options
 * @returns Search results
 */
export const searchDocuments = async (
  query: string,
  options: {
    top?: number;
    skip?: number;
    filter?: string;
    orderBy?: string[];
  } = {}
): Promise<{
  results: SearchResult[];
  count: number;
}> => {
  if (!isAzureSearchConfigured()) {
    console.warn('Azure AI Search is not configured. Cannot perform search.');
    return {
      results: [],
      count: 0
    };
  }
  
  try {
    const client = getSearchClient();
    
    const searchOptions = {
      top: options.top || 10,
      skip: options.skip || 0,
      includeTotalCount: true,
      filter: options.filter,
      orderBy: options.orderBy
    };
    
    const searchResults = await client.search(query, searchOptions);
    
    const results: SearchResult[] = [];
    let count = 0;
    
    for await (const result of searchResults.results) {
      // Cast document to SearchDocument to fix TypeScript errors
      const document = result.document as SearchDocument;
      
      results.push({
        id: document.id || '',
        title: document.title || 'Untitled',
        description: document.description,
        type: document.type,
        url: document.url,
        thumbnailUrl: document.thumbnailUrl,
        score: result.score,
        ...document
      });
    }
    
    count = searchResults.count || results.length;
    
    return {
      results,
      count
    };
  } catch (error) {
    console.error('Error searching documents:', error);
    return {
      results: [],
      count: 0
    };
  }
};

/**
 * Search for geospatial documents
 * @param query Search query
 * @param spatialContext Spatial context for the search
 * @param options Search options
 * @returns Search results
 */
export const searchGeospatialDocuments = async (
  query: string,
  spatialContext: {
    locations?: string[];
    spatialRelations?: string[];
    suggestedMapTypes?: string[];
  },
  options: {
    top?: number;
    skip?: number;
  } = {}
): Promise<{
  results: SearchResult[];
  count: number;
}> => {
  if (!isAzureSearchConfigured()) {
    console.warn('Azure AI Search is not configured. Cannot perform geospatial search.');
    return {
      results: [],
      count: 0
    };
  }
  
  try {
    // Build a more targeted search query using the spatial context
    let enhancedQuery = query;
    
    if (spatialContext.locations && spatialContext.locations.length > 0) {
      enhancedQuery += ` ${spatialContext.locations.join(' ')}`;
    }
    
    if (spatialContext.suggestedMapTypes && spatialContext.suggestedMapTypes.length > 0) {
      enhancedQuery += ` ${spatialContext.suggestedMapTypes.join(' ')}`;
    }
    
    // Build filter if needed
    let filter = '';
    if (spatialContext.suggestedMapTypes && spatialContext.suggestedMapTypes.length > 0) {
      const typeFilters = spatialContext.suggestedMapTypes.map(type => `type eq '${type}'`);
      filter = typeFilters.join(' or ');
    }
    
    return await searchDocuments(enhancedQuery, {
      top: options.top || 10,
      skip: options.skip || 0,
      filter: filter || undefined
    });
  } catch (error) {
    console.error('Error searching geospatial documents:', error);
    return {
      results: [],
      count: 0
    };
  }
};
