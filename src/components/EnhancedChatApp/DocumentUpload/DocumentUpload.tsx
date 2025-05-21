import * as React from 'react';
import './style.scss';
import { searchDocuments } from '../services/azure-search/search';
import { isAzureSearchConfigured } from '../services/azure-config';

// Document processing status
enum DocumentStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  INDEXING = 'indexing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// Document interface
interface DocumentFile extends File {
  id?: string;
  status?: DocumentStatus;
  progress?: number;
  error?: string;
}

interface DocumentUploadProps {
  onDocumentUpload?: (file: File) => void;
  uploadedFiles?: string[];
  userId?: string;
  sessionId?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentUpload,
  uploadedFiles = [],
  userId = 'anonymous',
  sessionId
}) => {
  const [files, setFiles] = React.useState<DocumentFile[]>([]);
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [localUploadedFiles, setLocalUploadedFiles] = React.useState<string[]>([]);
  const [searchAvailable, setSearchAvailable] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Check if Azure Search is configured
  React.useEffect(() => {
    setSearchAvailable(isAzureSearchConfigured());
  }, []);
  
  // Combine local uploaded files with passed-in files
  const allUploadedFiles = React.useMemo(() => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      return [...localUploadedFiles, ...uploadedFiles];
    }
    return localUploadedFiles;
  }, [localUploadedFiles, uploadedFiles]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => {
        // Add unique ID and initial status
        const documentFile = file as DocumentFile;
        documentFile.id = `${Date.now()}-${file.name}`;
        documentFile.status = DocumentStatus.QUEUED;
        documentFile.progress = 0;
        return documentFile;
      });
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };
  
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ['.pdf', '.docx', '.txt', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      return { 
        valid: false, 
        error: `Invalid file type. Supported formats: ${validTypes.join(', ')}` 
      };
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size: 10MB` 
      };
    }
    
    return { valid: true };
  };
  
  const processDocument = async (file: DocumentFile): Promise<void> => {
    // Update status to processing
    updateFileStatus(file.id!, DocumentStatus.PROCESSING, 10);
    
    try {
      // Extract text content (simulated for now)
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateFileStatus(file.id!, DocumentStatus.PROCESSING, 30);
      
      // Generate vector embeddings (simulated for now)
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateFileStatus(file.id!, DocumentStatus.PROCESSING, 60);
      
      // Index in Azure Search
      updateFileStatus(file.id!, DocumentStatus.INDEXING, 80);
      
      if (searchAvailable) {
        // In a real implementation, this would call the Azure Search indexing API
        // For now, we'll simulate a successful indexing
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.warn('Azure Search is not configured. Skipping indexing step.');
      }
      
      // Mark as completed
      updateFileStatus(file.id!, DocumentStatus.COMPLETED, 100);
      
      // Add to uploaded files list
      setLocalUploadedFiles(prev => [...prev, file.name]);
      
      // Call the onDocumentUpload callback if provided
      if (onDocumentUpload) {
        onDocumentUpload(file);
      }
    } catch (err) {
      console.error('Error processing document:', err);
      updateFileStatus(file.id!, DocumentStatus.ERROR, 0, 'Failed to process document');
    }
  };
  
  const updateFileStatus = (
    fileId: string, 
    status: DocumentStatus, 
    progress: number = 0,
    error: string = ''
  ) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, status, progress, error } 
          : file
      )
    );
  };
  
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // Process each file
      for (const file of files) {
        // Validate file
        const validation = validateFile(file);
        
        if (!validation.valid) {
          updateFileStatus(file.id!, DocumentStatus.ERROR, 0, validation.error || 'Invalid file');
          continue;
        }
        
        // Process document
        await processDocument(file);
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('An error occurred during file upload. Please try again.');
    } finally {
      setUploading(false);
      
      // Remove completed and error files after 3 seconds
      setTimeout(() => {
        setFiles(prevFiles => 
          prevFiles.filter(file => 
            file.status !== DocumentStatus.COMPLETED && 
            file.status !== DocumentStatus.ERROR
          )
        );
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => {
        // Add unique ID and initial status
        const documentFile = file as DocumentFile;
        documentFile.id = `${Date.now()}-${file.name}`;
        documentFile.status = DocumentStatus.QUEUED;
        documentFile.progress = 0;
        return documentFile;
      });
      
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };
  
  const getStatusLabel = (status: DocumentStatus): string => {
    switch (status) {
      case DocumentStatus.QUEUED:
        return 'Queued';
      case DocumentStatus.PROCESSING:
        return 'Processing';
      case DocumentStatus.INDEXING:
        return 'Indexing';
      case DocumentStatus.COMPLETED:
        return 'Completed';
      case DocumentStatus.ERROR:
        return 'Error';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className="document-upload-panel">
      <div className="upload-section">
        <h3>Upload Documents</h3>
        <p>Upload documents to enrich the context of your chat. Supported formats: PDF, DOCX, TXT, CSV.</p>
        
        {!searchAvailable && (
          <div className="search-warning">
            <p>Azure AI Search is not configured. Documents will be processed but not indexed for search.</p>
          </div>
        )}
        
        {error && (
          <div className="upload-error">
            <p>{error}</p>
          </div>
        )}
        
        <div className="upload-area">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,.docx,.txt,.csv"
            style={{ display: 'none' }}
          />
          
          <div 
            className="upload-dropzone" 
            onClick={handleBrowseClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="upload-icon">
              <i className="icon-ui-upload"></i>
            </div>
            <div className="upload-text">
              <p>Drag and drop files here or click to browse</p>
              <p className="upload-formats">PDF, DOCX, TXT, CSV</p>
            </div>
          </div>
          
          {files.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files</h4>
              <ul className="file-list">
                {files.map((file, index) => (
                  <li key={file.id} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    
                    {file.status !== DocumentStatus.QUEUED && (
                      <div className="file-status">
                        <div className={`status-indicator ${file.status}`}>
                          {getStatusLabel(file.status!)}
                        </div>
                        
                        {file.status !== DocumentStatus.ERROR && file.status !== DocumentStatus.COMPLETED && (
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                        )}
                        
                        {file.status === DocumentStatus.ERROR && (
                          <div className="error-message">{file.error}</div>
                        )}
                      </div>
                    )}
                    
                    {file.status === DocumentStatus.QUEUED && (
                      <button 
                        className="remove-file-button" 
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading}
                      >
                        &times;
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              
              <button 
                className="upload-button" 
                onClick={handleUpload}
                disabled={uploading || files.every(f => f.status !== DocumentStatus.QUEUED)}
              >
                {uploading ? 'Processing...' : 'Upload Files'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {allUploadedFiles.length > 0 && (
        <div className="uploaded-files-section">
          <h4>Uploaded Documents</h4>
          <ul className="uploaded-file-list">
            {allUploadedFiles.map((fileName, index) => (
              <li key={index} className="uploaded-file-item">
                <span className="file-icon">
                  <i className="icon-ui-file"></i>
                </span>
                <span className="file-name">{fileName}</span>
                <span className="file-status-badge completed">Indexed</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
