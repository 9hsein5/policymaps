import { AzureOpenAI } from "openai";
import { Stream } from "openai/streaming";
import { ChatCompletionChunk } from "openai/resources/chat";

import { 
  AZURE_OPENAI_KEY, 
  AZURE_OPENAI_ENDPOINT, 
  AZURE_OPENAI_DEPLOYMENT,
  AZURE_OPENAI_API_VERSION,
  isAzureOpenAIConfigured 
} from '../azure-config';

// Chat message interface
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date; // Added timestamp field
}

// Smart search parameters interface
export interface SmartSearchParams {
  originalQuery: string;
  location: string | null;
  categories: string[];
  timeFilter: string | null;
  cleanQuery: string;
}

// Enhanced smart search parameters interface with additional fields
export interface EnhancedSmartSearchParams extends SmartSearchParams {
  subcategories: string[];
  spatialRelationships: string[];
  dataTypes: string[];
  contextualReferences: string[];
  confidence: number;
}

// Search context for multi-turn conversations
export interface SearchContext {
  previousQueries: string[];
  currentLocation: string | null;
  currentCategories: string[];
  currentTimeFilter: string | null;
  conversationId: string;
}

// Create Azure OpenAI client
export const getOpenAIClient = () => {
  if (!isAzureOpenAIConfigured()) {
    throw new Error('Azure OpenAI configuration is missing. Please check your environment variables.');
  }
  
  return new AzureOpenAI({ 
    apiKey: AZURE_OPENAI_KEY, 
    baseURL: AZURE_OPENAI_ENDPOINT, 
    deployment: AZURE_OPENAI_DEPLOYMENT, 
    apiVersion: AZURE_OPENAI_API_VERSION, 
    dangerouslyAllowBrowser: true 
  });
};

// Get deployment ID
export const getDeploymentId = () => {
  return AZURE_OPENAI_DEPLOYMENT;
};

// System prompt for the chat model
const SYSTEM_PROMPT = `You are a helpful assistant for the Policy Maps application, which provides access to curated maps and data layers about humanitarian and resilience-related facts.
Focus on providing information about maps, data layers, and geographic insights.
When asked about locations, regions, or events, try to suggest relevant maps or datasets.
If you don't know the answer, suggest searching for datasets using specific keywords.
Incorporate spatial understanding in your responses when geographic locations are mentioned.
When appropriate, suggest viewing results in the Results tab.`;

/**
 * Generate a chat completion using Azure OpenAI
 * @param messages Array of chat messages
 * @param options Optional completion options
 * @returns The generated completion
 */
export const generateChatCompletion = async (
  messages: ChatMessage[],
  options: Record<string, any> = {}
): Promise<ChatMessage> => {
  if (!isAzureOpenAIConfigured()) {
    // Fallback to simple response if Azure OpenAI is not configured
    return {
      role: 'assistant',
      content: 'Azure OpenAI is not configured. Please check your environment variables.',
      timestamp: new Date()
    };
  }
  
  try {
    const client = getOpenAIClient();
    const deploymentId = getDeploymentId();
    
    // Ensure system prompt is included
    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: SYSTEM_PROMPT,
        timestamp: new Date()
      });
    }
    
    // Convert to Azure OpenAI message format
    const azureMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Generate completion
    const response = await client.chat.completions.create({
      model: deploymentId,
      messages: azureMessages,
      ...options
    });
    
    // Extract and return the completion
    if (response.choices && response.choices.length > 0) {
      const choice = response.choices[0];
      return {
        role: 'assistant',
        content: choice.message?.content || 'No response generated.',
        timestamp: new Date()
      };
    } else {
      throw new Error('No completion choices returned from Azure OpenAI');
    }
  } catch (error) {
    console.error('Error generating chat completion:', error);
    return {
      role: 'assistant',
      content: 'Sorry, I encountered an error while generating a response. Please try again later.',
      timestamp: new Date()
    };
  }
};

/**
 * Generate a streaming chat completion using Azure OpenAI
 * @param messages Array of chat messages
 * @param onUpdate Callback for each chunk of the streaming response
 * @param options Optional completion options
 */
export const generateStreamingChatCompletion = async (
  messages: ChatMessage[],
  onUpdate: (chunk: string) => void,
  options: Record<string, any> = {}
): Promise<void> => {
  if (!isAzureOpenAIConfigured()) {
    onUpdate('Azure OpenAI is not configured. Please check your environment variables.');
    return;
  }
  
  try {
    const client = getOpenAIClient();
    const deploymentId = getDeploymentId();
    
    // Ensure system prompt is included
    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: SYSTEM_PROMPT,
        timestamp: new Date()
      });
    }
    
    // Convert to Azure OpenAI message format
    const azureMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Set streaming option
    const streamingOptions = {
      ...options,
      stream: true
    };
    
    // Generate streaming completion
    const stream = await client.chat.completions.create({
      model: deploymentId,
      messages: azureMessages,
      stream: true,
      ...streamingOptions
    }) as Stream<ChatCompletionChunk>;
    
    // Process the stream
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const content = chunk.choices[0].delta?.content || '';
        onUpdate(content);
      }
    }
  } catch (error) {
    console.error('Error generating streaming chat completion:', error);
    onUpdate('\n\nSorry, I encountered an error while generating a response. Please try again later.');
  }
};

/**
 * Extract search keywords from a user message
 * @param message User message
 * @returns Extracted keywords for search
 */
export const extractSearchKeywords = async (message: string): Promise<string[]> => {
  if (!isAzureOpenAIConfigured()) {
    // Simple keyword extraction fallback
    return message.split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5);
  }
  
  try {
    const client = getOpenAIClient();
    const deploymentId = getDeploymentId();
    
    const response = await client.chat.completions.create({
      model: deploymentId,
      messages: [
        {
          role: 'system',
          content: 'Extract 3-5 key search terms from the user query. Return only the terms as a comma-separated list, with no additional text.'
        },
        {
          role: 'user',
          content: message
        }
      ]
    });
    
    if (response.choices && response.choices.length > 0) {
      const extractedText = response.choices[0].message?.content || '';
      return extractedText.split(',').map((term: string) => term.trim()).filter(Boolean);
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting search keywords:', error);
    // Fallback to simple extraction
    return message.split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5);
  }
};

/**
 * Analyze spatial context in a user message
 * @param message User message
 * @returns Spatial analysis result
 */
export const analyzeSpatialContext = async (message: string): Promise<{
  locations: string[];
  spatialRelations: string[];
  suggestedMapTypes: string[];
}> => {
  if (!isAzureOpenAIConfigured()) {
    return {
      locations: [],
      spatialRelations: [],
      suggestedMapTypes: []
    };
  }
  
  try {
    const client = getOpenAIClient();
    const deploymentId = getDeploymentId();
    
    const response = await client.chat.completions.create({
      model: deploymentId,
      messages: [
        {
          role: 'system',
          content: `Analyze the spatial context in the user query. Extract:
1. Locations: Any geographic locations mentioned
2. Spatial Relations: Any spatial relationships (near, between, etc.)
3. Suggested Map Types: Types of maps that would be relevant

Format your response as JSON with these three arrays. Example:
{
  "locations": ["New York", "Boston"],
  "spatialRelations": ["between"],
  "suggestedMapTypes": ["transportation", "population density"]
}`
        },
        {
          role: 'user',
          content: message
        }
      ]
    });
    
    if (response.choices && response.choices.length > 0) {
      const analysisText = response.choices[0].message?.content || '{}';
      try {
        const analysis = JSON.parse(analysisText);
        return {
          locations: Array.isArray(analysis.locations) ? analysis.locations : [],
          spatialRelations: Array.isArray(analysis.spatialRelations) ? analysis.spatialRelations : [],
          suggestedMapTypes: Array.isArray(analysis.suggestedMapTypes) ? analysis.suggestedMapTypes : []
        };
      } catch (parseError) {
        console.error('Error parsing spatial analysis JSON:', parseError);
        return {
          locations: [],
          spatialRelations: [],
          suggestedMapTypes: []
        };
      }
    }
    
    return {
      locations: [],
      spatialRelations: [],
      suggestedMapTypes: []
    };
  } catch (error) {
    console.error('Error analyzing spatial context:', error);
    return {
      locations: [],
      spatialRelations: [],
      suggestedMapTypes: []
    };
  }
};

/**
 * Process natural language query for smart search using Azure OpenAI
 * @param query User's natural language query
 * @returns Structured search parameters
 */
export const processSmartSearchQuery = async (query: string): Promise<SmartSearchParams> => {
  // Default return structure with fallback values
  const defaultResult: SmartSearchParams = {
    originalQuery: query,
    location: null,
    categories: [],
    timeFilter: null,
    cleanQuery: query
  };
  
  // If Azure OpenAI is not configured, fall back to regex-based extraction
  if (!isAzureOpenAIConfigured()) {
    console.warn('Azure OpenAI not configured, falling back to regex extraction');
    return fallbackRegexExtraction(query);
  }
  
  try {
    const client = getOpenAIClient();
    const deploymentId = getDeploymentId();
    
    // Create the system prompt for smart search extraction
    const systemPrompt = `You are an AI assistant that extracts structured information from natural language queries about policy maps and geographic data.

Extract the following information from the user's query:

1. Location: Any geographic location mentioned (city, state, country, region, etc.)
2. Categories: Any of these categories mentioned [Health, Education, Housing, Economic Opportunity, Population]
3. Time Filter: Any time period or date range mentioned
4. Clean Query: The query with location, category, and time filter phrases removed for keyword search

Format your response as a JSON object with these fields:
{
  "location": "extracted location or null if none",
  "categories": ["array of matched categories"],
  "timeFilter": "extracted time filter or null if none",
  "cleanQuery": "cleaned query for keyword search"
}

Be precise and only include categories that are explicitly mentioned or strongly implied. For locations, extract the most specific location mentioned.`;
    
    // Generate completion with the smart search prompt
    const response = await client.chat.completions.create({
      model: deploymentId,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.1, // Lower temperature for more deterministic results
      response_format: { type: "json_object" } // Request JSON format
    });
    
    // Extract and parse the JSON response
    if (response.choices && response.choices.length > 0) {
      const jsonResponse = response.choices[0].message?.content || '{}';
      
      try {
        const parsed = JSON.parse(jsonResponse);
        
        return {
          originalQuery: query,
          location: parsed.location || null,
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          timeFilter: parsed.timeFilter || null,
          cleanQuery: parsed.cleanQuery || query
        };
      } catch (parseError) {
        console.error('Error parsing smart search JSON response:', parseError);
        return fallbackRegexExtraction(query);
      }
    }
    
    return defaultResult;
  } catch (error) {
    console.error('Error processing smart search query:', error);
    return fallbackRegexExtraction(query);
  }
};

/**
 * Enhanced smart search function with context awareness, subcategories, and advanced spatial understanding
 * @param query User's natural language query
 * @param context Optional search context from previous interactions
 * @returns Enhanced structured search parameters
 */
export const enhancedSmartSearch = async (
  query: string, 
  context?: SearchContext
): Promise<EnhancedSmartSearchParams> => {
  // Default return structure with fallback values
  const defaultResult: EnhancedSmartSearchParams = {
    originalQuery: query,
    location: null,
    categories: [],
    subcategories: [],
    spatialRelationships: [],
    dataTypes: [],
    contextualReferences: [],
    timeFilter: null,
    cleanQuery: query,
    confidence: 0
  };
  
  // If Azure OpenAI is not configured, fall back to basic extraction
  if (!isAzureOpenAIConfigured()) {
    console.warn('Azure OpenAI not configured, falling back to basic extraction');
    const basicResult = fallbackRegexExtraction(query);
    return {
      ...basicResult,
      subcategories: [],
      spatialRelationships: [],
      dataTypes: [],
      contextualReferences: [],
      confidence: 0.5
    };
  }
  
  try {
    const client = getOpenAIClient();
    const deploymentId = getDeploymentId();
    
    // Build context-aware system prompt
    let contextPrompt = '';
    if (context) {
      contextPrompt = `
Previous search context:
- Previous queries: ${context.previousQueries.join(', ')}
- Current location focus: ${context.currentLocation || 'None'}
- Current categories: ${context.currentCategories.join(', ') || 'None'}
- Current time filter: ${context.currentTimeFilter || 'None'}

If the new query refers to "this area", "here", "these", or similar references, use the current location.
If the new query refers to "same categories", "these topics", or similar references, maintain the current categories.
If the new query is refining or building upon previous queries, incorporate relevant context.`;
    }
    
    // Create the enhanced system prompt for smart search extraction
    const systemPrompt = `You are an AI assistant that extracts structured information from natural language queries about policy maps and geographic data.
${contextPrompt}

Extract the following information from the user's query:

1. Location: Any geographic location mentioned (city, state, country, region, etc.)
2. Categories: Any of these main categories mentioned [Health, Education, Housing, Economic Opportunity, Population]
3. Subcategories: More specific categories within the main categories (e.g., "primary schools" under Education)
4. Spatial Relationships: Spatial terms like "near", "within", "between", "surrounding", etc.
5. Data Types: Types of data requested (e.g., "statistics", "trends", "comparison", "heatmap")
6. Time Filter: Any time period or date range mentioned
7. Contextual References: References to previous context like "this area", "these categories", etc.
8. Clean Query: The query with location, category, and time filter phrases removed for keyword search
9. Confidence: A number between 0 and 1 indicating confidence in the extraction (1 being highest)

Format your response as a JSON object with these fields:
{
  "location": "extracted location or null if none",
  "categories": ["array of matched main categories"],
  "subcategories": ["array of more specific subcategories"],
  "spatialRelationships": ["array of spatial relationship terms"],
  "dataTypes": ["array of data types requested"],
  "timeFilter": "extracted time filter or null if none",
  "contextualReferences": ["array of references to previous context"],
  "cleanQuery": "cleaned query for keyword search",
  "confidence": 0.95
}

Be precise and only include categories that are explicitly mentioned or strongly implied. For locations, extract the most specific location mentioned.`;
    
    // Generate completion with the enhanced smart search prompt
    const response = await client.chat.completions.create({
      model: deploymentId,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.1, // Lower temperature for more deterministic results
      response_format: { type: "json_object" } // Request JSON format
    });
    
    // Extract and parse the JSON response
    if (response.choices && response.choices.length > 0) {
      const jsonResponse = response.choices[0].message?.content || '{}';
      
      try {
        const parsed = JSON.parse(jsonResponse);
        
        // Apply context if available and needed
        if (context && parsed.contextualReferences && parsed.contextualReferences.length > 0) {
          // If location is null but there are contextual references, use the context location
          if (!parsed.location && context.currentLocation) {
            parsed.location = context.currentLocation;
          }
          
          // If categories are empty but there are contextual references, use the context categories
          if ((!parsed.categories || parsed.categories.length === 0) && context.currentCategories.length > 0) {
            parsed.categories = context.currentCategories;
          }
          
          // If time filter is null but there are contextual references, use the context time filter
          if (!parsed.timeFilter && context.currentTimeFilter) {
            parsed.timeFilter = context.currentTimeFilter;
          }
        }
        
        return {
          originalQuery: query,
          location: parsed.location || null,
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          subcategories: Array.isArray(parsed.subcategories) ? parsed.subcategories : [],
          spatialRelationships: Array.isArray(parsed.spatialRelationships) ? parsed.spatialRelationships : [],
          dataTypes: Array.isArray(parsed.dataTypes) ? parsed.dataTypes : [],
          contextualReferences: Array.isArray(parsed.contextualReferences) ? parsed.contextualReferences : [],
          timeFilter: parsed.timeFilter || null,
          cleanQuery: parsed.cleanQuery || query,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7
        };
      } catch (parseError) {
        console.error('Error parsing enhanced smart search JSON response:', parseError);
        // Fall back to basic smart search
        const basicResult = await processSmartSearchQuery(query);
        return {
          ...basicResult,
          subcategories: [],
          spatialRelationships: [],
          dataTypes: [],
          contextualReferences: [],
          confidence: 0.5
        };
      }
    }
    
    return defaultResult;
  } catch (error) {
    console.error('Error processing enhanced smart search query:', error);
    // Fall back to basic smart search
    const basicResult = await processSmartSearchQuery(query);
    return {
      ...basicResult,
      subcategories: [],
      spatialRelationships: [],
      dataTypes: [],
      contextualReferences: [],
      confidence: 0.5
    };
  }
};

/**
 * Process uploaded document content for search and map visualization
 * @param documentContent Content of the uploaded document
 * @param documentType Type of document (e.g., 'text', 'geojson', 'csv')
 * @returns Extracted information for search and visualization
 */
export const processDocumentContent = async (
  documentContent: string,
  documentType: 'text' | 'geojson' | 'csv' | 'pdf' | string
): Promise<{
  keywords: string[];
  locations: string[];
  categories: string[];
  timeReferences: string[];
  geoEntities?: any; // GeoJSON features if available
  summary: string;
}> => {
  // Default return structure
  const defaultResult: {
    keywords: string[];
    locations: string[];
    categories: string[];
    timeReferences: string[];
    geoEntities?: any;
    summary: string;
  } = {
    keywords: [],
    locations: [],
    categories: [],
    timeReferences: [],
    summary: 'Document processing failed or not supported.'
  };
  
  // If Azure OpenAI is not configured, return default
  if (!isAzureOpenAIConfigured()) {
    console.warn('Azure OpenAI not configured, document processing limited');
    return defaultResult;
  }
  
  try {
    const client = getOpenAIClient();
    const deploymentId = getDeploymentId();
    
    // Truncate document content if too large
    const truncatedContent = documentContent.length > 4000 
      ? documentContent.substring(0, 4000) + '... (content truncated)'
      : documentContent;
    
    // Create document processing prompt based on document type
    let systemPrompt = `You are an AI assistant that extracts structured information from documents for policy map search and visualization.`;
    
    // Add type-specific instructions
    if (documentType === 'geojson') {
      systemPrompt += `
This document is in GeoJSON format. Extract:
1. Keywords: Key terms that describe the data
2. Locations: Geographic locations mentioned in properties or feature names
3. Categories: Any of these categories that apply [Health, Education, Housing, Economic Opportunity, Population]
4. Time References: Any time periods or dates mentioned
5. Summary: A brief summary of what this GeoJSON represents`;
    } else if (documentType === 'csv') {
      systemPrompt += `
This document is in CSV format. Extract:
1. Keywords: Key terms from column headers and data
2. Locations: Geographic locations mentioned in the data
3. Categories: Any of these categories that apply [Health, Education, Housing, Economic Opportunity, Population]
4. Time References: Any time periods or dates mentioned in column headers or data
5. Summary: A brief summary of what this data represents`;
    } else {
      systemPrompt += `
Extract the following information from this document:
1. Keywords: 5-10 key terms that represent the main topics
2. Locations: All geographic locations mentioned
3. Categories: Any of these categories that apply [Health, Education, Housing, Economic Opportunity, Population]
4. Time References: Any time periods or dates mentioned
5. Summary: A brief summary (2-3 sentences) of the document content`;
    }
    
    systemPrompt += `

Format your response as a JSON object with these fields:
{
  "keywords": ["array of keywords"],
  "locations": ["array of locations"],
  "categories": ["array of categories"],
  "timeReferences": ["array of time references"],
  "summary": "brief summary of the document"
}`;
    
    // Generate completion with the document processing prompt
    const response = await client.chat.completions.create({
      model: deploymentId,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: truncatedContent
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    // Extract and parse the JSON response
    if (response.choices && response.choices.length > 0) {
      const jsonResponse = response.choices[0].message?.content || '{}';
      
      try {
        const parsed = JSON.parse(jsonResponse);
        
        const result: {
          keywords: string[];
          locations: string[];
          categories: string[];
          timeReferences: string[];
          summary: string;
          geoEntities?: any;
        } = {
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          locations: Array.isArray(parsed.locations) ? parsed.locations : [],
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          timeReferences: Array.isArray(parsed.timeReferences) ? parsed.timeReferences : [],
          summary: parsed.summary || 'No summary available.'
        };
        
        // If document is GeoJSON, try to parse and include the geo entities
        if (documentType === 'geojson') {
          try {
            const geoJson = JSON.parse(documentContent);
            result.geoEntities = geoJson.features || [];
          } catch (geoJsonError) {
            console.error('Error parsing GeoJSON document:', geoJsonError);
          }
        }
        
        return result;
      } catch (parseError) {
        console.error('Error parsing document processing JSON response:', parseError);
        return defaultResult;
      }
    }
    
    return defaultResult;
  } catch (error) {
    console.error('Error processing document content:', error);
    return defaultResult;
  }
};

/**
 * Fallback regex-based extraction for when Azure OpenAI is unavailable
 * @param query User's natural language query
 * @returns Structured search parameters using regex extraction
 */
function fallbackRegexExtraction(query: string): SmartSearchParams {
  // Extract location information
  const locationMatch = query.match(/near|in|around|at\s+([a-zA-Z\s,]+)/i);
  const location = locationMatch ? locationMatch[1].trim() : null;
  
  // Extract category information
  const categoryMatches = [
    { pattern: /health|healthcare|hospital|clinic/i, category: 'Health' },
    { pattern: /education|school|university|college/i, category: 'Education' },
    { pattern: /housing|home|apartment|residence/i, category: 'Housing' },
    { pattern: /economic|business|job|employment/i, category: 'Economic Opportunity' },
    { pattern: /population|demographic|people/i, category: 'Population' }
  ];
  
  const categories = categoryMatches
    .filter(match => match.pattern.test(query))
    .map(match => match.category);
  
  // Extract time-based filters
  const timeMatch = query.match(/from\s+(\d{4})|since\s+(\d{4})|before\s+(\d{4})|after\s+(\d{4})/i);
  const timeFilter = timeMatch ? timeMatch[0] : null;
  
  // Clean query with entities removed for keyword search
  let cleanQuery = query;
  
  // Remove location phrases
  cleanQuery = cleanQuery.replace(/near|in|around|at\s+([a-zA-Z\s,]+)/i, '');
  
  // Remove time phrases
  cleanQuery = cleanQuery.replace(/from\s+(\d{4})|since\s+(\d{4})|before\s+(\d{4})|after\s+(\d{4})/i, '');
  
  // Trim and normalize whitespace
  cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();
  
  return {
    originalQuery: query,
    location,
    categories,
    timeFilter,
    cleanQuery
  };
}