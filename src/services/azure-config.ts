// Azure service configuration

// Azure OpenAI Configuration
export const AZURE_OPENAI_KEY = process.env.REACT_APP_AZURE_OPENAI_KEY || '';
export const AZURE_OPENAI_ENDPOINT = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT || '';
export const AZURE_OPENAI_DEPLOYMENT = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT || '';
export const AZURE_OPENAI_API_VERSION = process.env.REACT_APP_AZURE_OPENAI_API_VERSION || '2025-04-01-preview';

// Azure AI Search Configuration
export const AZURE_SEARCH_KEY = process.env.REACT_APP_AZURE_SEARCH_KEY || '';
export const AZURE_SEARCH_ENDPOINT = process.env.REACT_APP_AZURE_SEARCH_ENDPOINT || '';
export const AZURE_SEARCH_INDEX = process.env.REACT_APP_AZURE_SEARCH_INDEX || '';

// Azure Cosmos DB Configuration
export const AZURE_COSMOS_ENDPOINT = process.env.REACT_APP_AZURE_COSMOS_ENDPOINT || '';
export const AZURE_COSMOS_KEY = process.env.REACT_APP_AZURE_COSMOS_KEY || '';
export const AZURE_COSMOS_DATABASE = process.env.REACT_APP_AZURE_COSMOS_DATABASE || 'policymaps-db';

// Check if Azure OpenAI is configured
export const isAzureOpenAIConfigured = (): boolean => {
  return Boolean(AZURE_OPENAI_KEY && AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_DEPLOYMENT && AZURE_OPENAI_API_VERSION);
};

// Check if Azure AI Search is configured
export const isAzureSearchConfigured = (): boolean => {
  return Boolean(AZURE_SEARCH_KEY && AZURE_SEARCH_ENDPOINT && AZURE_SEARCH_INDEX);
};

// Check if Azure Cosmos DB is configured
export const isCosmosDBConfigured = (): boolean => {
  return Boolean(AZURE_COSMOS_ENDPOINT && AZURE_COSMOS_KEY && AZURE_COSMOS_DATABASE);
};
