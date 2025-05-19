import { AzureOpenAI } from "openai";
import { Stream } from "openai/streaming";
import { ChatCompletionChunk } from "openai/resources/chat";

import { 
  AZURE_OPENAI_KEY, 
  AZURE_OPENAI_ENDPOINT, 
  AZURE_OPENAI_DEPLOYMENT,
  isAzureOpenAIConfigured 
} from '../azure-config';

// Chat message interface
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
    apiVersion: "2025-04-01-preview", 
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
      content: 'Azure OpenAI is not configured. Please check your environment variables.'
    };
  }
  
  try {
    const client = getOpenAIClient();
    const deploymentId = getDeploymentId();
    
    // Ensure system prompt is included
    if (!messages.some(msg => msg.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: SYSTEM_PROMPT
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
        content: choice.message?.content || 'No response generated.'
      };
    } else {
      throw new Error('No completion choices returned from Azure OpenAI');
    }
  } catch (error) {
    console.error('Error generating chat completion:', error);
    return {
      role: 'assistant',
      content: 'Sorry, I encountered an error while generating a response. Please try again later.'
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
        content: SYSTEM_PROMPT
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
