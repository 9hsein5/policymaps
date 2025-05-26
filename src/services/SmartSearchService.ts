import { 
  enhancedSmartSearch, 
  processDocumentContent, 
  SearchContext, 
  EnhancedSmartSearchParams 
} from './azure-openai/chat';
import EsriOAuth from '../utils/Esri-OAuth';

/**
 * Enhanced Smart Search Service
 * Provides advanced natural language processing for search queries using Azure OpenAI
 */
export class SmartSearchService {
  private searchContext: SearchContext | undefined;
  private esriOAuthUtils: EsriOAuth | undefined;
  private token: string | undefined;
  /**
   * Constructor
   * @param esriOAuthUtilsOrToken EsriOAuth instance or token string
   * @param conversationId Optional conversation ID for context tracking
   */
  constructor(esriOAuthUtilsOrToken?: EsriOAuth | string, conversationId?: string) {
    // Handle different authentication scenarios
    if (typeof esriOAuthUtilsOrToken === 'string') {
      // Direct token string provided
      this.token = esriOAuthUtilsOrToken;
    } else if (esriOAuthUtilsOrToken instanceof EsriOAuth) {
      // EsriOAuth instance provided
      this.esriOAuthUtils = esriOAuthUtilsOrToken;
    }

    if (conversationId) {
      this.searchContext = {
        previousQueries: [],
        currentLocation: null,
        currentCategories: [],
        currentTimeFilter: null,
        conversationId
      };
    }
  }
  
  /**
   * Process a natural language query with context awareness
   * @param query The user's natural language query
   * @returns Enhanced search parameters
   */
  async processNaturalLanguageQuery(query: string): Promise<EnhancedSmartSearchParams> {
    // Process the query using Azure OpenAI with context if available
    const result = await enhancedSmartSearch(query, this.searchContext);
    
    // Update context if available
    if (this.searchContext) {
      this.searchContext.previousQueries.push(query);
      
      // Only keep the last 5 queries for context
      if (this.searchContext.previousQueries.length > 5) {
        this.searchContext.previousQueries.shift();
      }
      
      // Update current context values if they were extracted
      if (result.location) {
        this.searchContext.currentLocation = result.location;
      }
      
      if (result.categories && result.categories.length > 0) {
        this.searchContext.currentCategories = result.categories;
      }
      
      if (result.timeFilter) {
        this.searchContext.currentTimeFilter = result.timeFilter;
      }
    }
    
    return result;
  }
  
  /**
   * Process uploaded document content
   * @param content Document content as string
   * @param documentType Type of document (e.g., 'text', 'geojson', 'csv')
   * @returns Processed document information
   */
  async processDocumentContent(
    content: string,
    documentType: 'text' | 'geojson' | 'csv' | 'pdf' | string
  ): Promise<{
    keywords: string[];
    locations: string[];
    categories: string[];
    timeReferences: string[];
    geoEntities?: any;
    summary: string;
  }> {
    return processDocumentContent(content, documentType);
  }
  
  /**
   * Reset the search context
   */
  resetContext(): void {
    if (this.searchContext) {
      this.searchContext.previousQueries = [];
      this.searchContext.currentLocation = null;
      this.searchContext.currentCategories = [];
      this.searchContext.currentTimeFilter = null;
    }
  }
  
  /**
   * Get the current search context
   * @returns The current search context or undefined if not using context
   */
  getContext(): SearchContext | undefined {
    return this.searchContext;
  }
  
  /**
   * Set a specific search context
   * @param context The search context to set
   */
  setContext(context: SearchContext): void {
    this.searchContext = context;
  }

  /**
   * Set the EsriOAuth instance
   * @param esriOAuthUtils EsriOAuth instance
   */
  setEsriOAuthUtils(esriOAuthUtils: EsriOAuth): void {
    this.esriOAuthUtils = esriOAuthUtils;
    this.token = undefined; // Clear token when setting EsriOAuth
  }
  
  /**
   * Set the authentication token directly
   * @param token Authentication token
   */
  setToken(token: string): void {
    this.token = token;
    this.esriOAuthUtils = undefined; // Clear EsriOAuth when setting token
  }
}

// Export a singleton instance for app-wide use
export const smartSearchService = new SmartSearchService();
