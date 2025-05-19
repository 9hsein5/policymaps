import { getContainer, isCosmosDBConfigured } from './client';

// Documents container ID
const DOCUMENTS_CONTAINER = 'documents';

// Document interface
export interface Document {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Save document metadata to Cosmos DB
 * @param document Document metadata
 * @returns The saved document record
 */
export const saveDocument = async (
  document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Document | null> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Document metadata will not be saved.');
    return null;
  }

  try {
    const container = await getContainer(DOCUMENTS_CONTAINER);
    
    const newDocument: Document = {
      ...document,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const { resource } = await container.items.create(newDocument);
    return resource;
  } catch (error) {
    console.error('Error saving document metadata:', error);
    return null;
  }
};

/**
 * Get document by ID
 * @param userId User ID
 * @param documentId Document ID
 * @returns The document record or null if not found
 */
export const getDocument = async (
  userId: string,
  documentId: string
): Promise<Document | null> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Cannot retrieve document.');
    return null;
  }

  try {
    const container = await getContainer(DOCUMENTS_CONTAINER);
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.id = @documentId",
      parameters: [
        { name: "@userId", value: userId },
        { name: "@documentId", value: documentId }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    
    if (resources.length > 0) {
      return resources[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
};

/**
 * Get all documents for a user
 * @param userId User ID
 * @returns Array of document records
 */
export const getUserDocuments = async (
  userId: string
): Promise<Document[]> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Cannot retrieve user documents.');
    return [];
  }

  try {
    const container = await getContainer(DOCUMENTS_CONTAINER);
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.updatedAt DESC",
      parameters: [
        { name: "@userId", value: userId }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  } catch (error) {
    console.error('Error getting user documents:', error);
    return [];
  }
};

/**
 * Delete a document
 * @param userId User ID
 * @param documentId Document ID
 * @returns True if successful, false otherwise
 */
export const deleteDocument = async (
  userId: string,
  documentId: string
): Promise<boolean> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Cannot delete document.');
    return false;
  }

  try {
    const container = await getContainer(DOCUMENTS_CONTAINER);
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.id = @documentId",
      parameters: [
        { name: "@userId", value: userId },
        { name: "@documentId", value: documentId }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    
    if (resources.length > 0) {
      await container.item(resources[0].id).delete();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

/**
 * Update document metadata
 * @param userId User ID
 * @param documentId Document ID
 * @param updates Document updates
 * @returns The updated document record or null if not found
 */
export const updateDocument = async (
  userId: string,
  documentId: string,
  updates: Partial<Omit<Document, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<Document | null> => {
  if (!isCosmosDBConfigured()) {
    console.warn('Azure Cosmos DB is not configured. Cannot update document.');
    return null;
  }

  try {
    const container = await getContainer(DOCUMENTS_CONTAINER);
    
    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.id = @documentId",
      parameters: [
        { name: "@userId", value: userId },
        { name: "@documentId", value: documentId }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    
    if (resources.length > 0) {
      const existingDocument = resources[0];
      const updatedDocument: Document = {
        ...existingDocument,
        ...updates,
        updatedAt: new Date()
      };
      
      const { resource } = await container.item(existingDocument.id).replace(updatedDocument);
      return resource;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error updating document:', error);
    return null;
  }
};
