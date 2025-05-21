import { CosmosClient, Container } from "@azure/cosmos";
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
  const { container } = await database.containers.createIfNotExists({ 
    id: containerId,
    partitionKey: { paths: ["/sessionId"] } // Using sessionId as the partition key
  });
  return container;
};

/**
 * Get a document by ID using the correct partition key
 * @param containerId Container ID
 * @param documentId Document ID
 * @param sessionId Session ID (partition key)
 * @returns The document or null if not found
 */
export const getDocumentById = async (
  containerId: string,
  documentId: string,
  sessionId: string
) => {
  try {
    const container = await getContainer(containerId);
    const { resource } = await container.item(documentId, sessionId).read();
    return resource;
  } catch (error: any) {
    // Check if it's a "Not Found" error
    if (error.code === 404) {
      console.warn(`Document with ID ${documentId} not found in container ${containerId}`);
      return null;
    }
    throw error;
  }
};

// Export isCosmosDBConfigured to fix the import error
export { isCosmosDBConfigured };
