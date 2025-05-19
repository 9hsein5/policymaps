import { CosmosClient } from "@azure/cosmos";
import { 
  AZURE_COSMOS_ENDPOINT, 
  AZURE_COSMOS_KEY, 
  AZURE_COSMOS_DATABASE,
  isCosmosDBConfigured 
} from '../azure-config';

// Create Azure Cosmos DB client
export const getCosmosClient = () => {
  if (!isCosmosDBConfigured()) {
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

// Export isCosmosDBConfigured to fix the import error
export { isCosmosDBConfigured };
