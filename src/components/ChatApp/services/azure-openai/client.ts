import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

// Configuration for Azure OpenAI
const AZURE_OPENAI_KEY = process.env.REACT_APP_AZURE_OPENAI_KEY || '';
const AZURE_OPENAI_ENDPOINT = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1';

// Create Azure OpenAI client
export const getOpenAIClient = () => {
  if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
    throw new Error("Azure OpenAI configuration is missing. Check env vars.");
  }

  // const credential = new DefaultAzureCredential();
  // const scope = "https://cognitiveservices.azure.com/.default";
  // const azureADTokenProvider = getBearerTokenProvider(credential, scope);
  const client = new AzureOpenAI({ apiKey: AZURE_OPENAI_KEY, baseURL: AZURE_OPENAI_ENDPOINT, deployment: AZURE_OPENAI_DEPLOYMENT, apiVersion: "2025-04-01-preview", dangerouslyAllowBrowser: true });
  return client;
};

// Get deployment ID based on environment configuration
export const getDeploymentId = () => {
  return AZURE_OPENAI_DEPLOYMENT;
};

// Check if Azure OpenAI is configured
export const isAzureOpenAIConfigured = () => {
  return Boolean(AZURE_OPENAI_KEY && AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_DEPLOYMENT);
};
