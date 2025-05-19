import { getOpenAIClient, getDeploymentId, isAzureOpenAIConfigured } from './client';
import { Stream } from "openai/streaming";
import { ChatCompletionChunk } from "openai/resources/chat";

// Message types for chat history
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// System prompt for geospatial assistance
const SYSTEM_PROMPT = `You are a geospatial assistant for the Lebanese Red Cross. 
Your primary role is to help users find and analyze geospatial datasets related to humanitarian efforts.
Focus on providing clear, concise information about available datasets and how they can be used.
When users ask about specific locations or events, try to suggest relevant maps or datasets.
If you don't know the answer, suggest searching for datasets using specific keywords.`;

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
