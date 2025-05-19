import { CosmosClient } from "@azure/cosmos";

// Configuration for Azure Cosmos DB
const AZURE_COSMOS_ENDPOINT = process.env.REACT_APP_AZURE_COSMOS_ENDPOINT || '';
const AZURE_COSMOS_KEY = process.env.REACT_APP_AZURE_COSMOS_KEY || '';
const AZURE_COSMOS_DATABASE = process.env.REACT_APP_AZURE_COSMOS_DATABASE || 'policymaps-db';

// Create Azure Cosmos DB client
export const getCosmosClient = () => {
  if (!AZURE_COSMOS_ENDPOINT || !AZURE_COSMOS_KEY) {
    throw new Error('Azure Cosmos DB configuration is missing. Please check your environment variables.');
  }

  return new CosmosClient({
    endpoint: AZURE_COSMOS_ENDPOINT,
    key: AZURE_COSMOS_KEY
  });
};

// Get database and container references
export const getDatabase = async () => {
  const client = getCosmosClient();
  const { database } = await client.databases.createIfNotExists({ id: AZURE_COSMOS_DATABASE });
  return database;
};

export const getContainer = async (containerId: string) => {
  const database = await getDatabase();
  const { container } = await database.containers.createIfNotExists({ id: containerId });
  return container;
};

// Check if Azure Cosmos DB is configured
export const isCosmosDBConfigured = () => {
  return Boolean(AZURE_COSMOS_ENDPOINT && AZURE_COSMOS_KEY && AZURE_COSMOS_DATABASE);
};
