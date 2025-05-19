// src/components/ChatApp/services/azure-search/search.ts
import { getSearchClient, isAzureSearchConfigured } from './client';
import { SearchDocument, SearchResult } from './types';

// Search for documents
export const searchDocuments = async (
  query: string,
  options: {
    top?: number;
    skip?: number;
    filter?: string;
  } = {}
): Promise<SearchResult[]> => {
  if (!isAzureSearchConfigured()) {
    console.warn('Azure AI Search is not configured. Using mock results.');
    return [];
  }

  try {
    const client = getSearchClient();
    
    const searchOptions = {
      top: options.top || 10,
      skip: options.skip || 0,
      includeTotalCount: true,
      filter: options.filter,
      orderBy: ['search.score() desc']
    };
    
    const searchResults = await client.search(query, searchOptions);
    const results: SearchResult[] = [];
    
    for await (const result of searchResults.results) {
      const document = result.document as SearchDocument;
      
      results.push({
        id: document.id || '',
        title: document.title || 'Untitled Document',
        description: document.description || document.content?.substring(0, 200) || '',
        url: document.url,
        source: 'azure-search',
        score: result.score || 0,
        metadata: document.metadata
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
};

// Search for context to augment chat responses
export const searchForContext = async (query: string): Promise<string[]> => {
  if (!isAzureSearchConfigured()) {
    console.warn('Azure AI Search is not configured. No context augmentation available.');
    return [];
  }

  try {
    const results = await searchDocuments(query, { top: 3 });
    
    return results.map(result => {
      return `[${result.title}]: ${result.description}`;
    });
  } catch (error) {
    console.error('Error getting context:', error);
    return [];
  }
};
