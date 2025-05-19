import * as React from 'react';
import { saveDocument } from '../services/azure-cosmos/documents';
import './style.scss';

interface Props {
  userId: string;
  onDocumentUploaded?: (documentId: string) => void;
}

const DocumentPanel: React.FC<Props> = ({ userId, onDocumentUploaded }) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = React.useState<any[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setFiles(prev => [...prev, ...fileList]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files) {
      const fileList = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...fileList]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    // Initialize progress for each file
    const initialProgress: Record<string, number> = {};
    files.forEach(file => {
      initialProgress[file.name] = 0;
    });
    setUploadProgress(initialProgress);
    
    try {
      // Upload each file
      for (const file of files) {
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 10
        }));
        
        // Generate a signed URL for the file (in a real app, this would call a backend API)
        const fileUrl = `https://example.com/files/${encodeURIComponent(file.name)}`;
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 50
        }));
        
        // Save document metadata to Cosmos DB
        const document = await saveDocument({
          userId,
          title: file.name,
          description: `Uploaded on ${new Date().toLocaleString()}`,
          fileUrl,
          fileType: file.type,
          fileName: file.name,
          fileSize: file.size,
          metadata: {
            contentType: file.type,
            lastModified: new Date(file.lastModified).toISOString()
          }
        });
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }));
        
        if (document) {
          setUploadedDocuments(prev => [...prev, document]);
          
          // Call the callback if provided
          if (onDocumentUploaded && document.id) {
            onDocumentUploaded(document.id);
          }
        }
      }
      
      // Clear files after successful upload
      setFiles([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError('An error occurred while uploading documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="document-panel">
      <h2 className="panel-title">Upload Documents</h2>
      
      <div 
        className="drop-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          style={{ display: 'none' }}
        />
        <div className="drop-zone-content">
          <span className="icon-ui-upload"></span>
          <p>Drag and drop files here or click to browse</p>
          <p className="drop-zone-hint">Supported formats: PDF, DOCX, TXT, CSV, JSON, GeoJSON</p>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="file-list">
          <h3>Selected Files</h3>
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              {uploading ? (
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${uploadProgress[file.name] || 0}%` }}
                  ></div>
                </div>
              ) : (
                <button 
                  className="remove-file-button"
                  onClick={() => removeFile(index)}
                >
                  <span className="icon-ui-close"></span>
                </button>
              )}
            </div>
          ))}
          
          <button 
            className="upload-button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      )}
      
      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}
      
      {uploadedDocuments.length > 0 && (
        <div className="uploaded-documents">
          <h3>Uploaded Documents</h3>
          {uploadedDocuments.map((doc, index) => (
            <div key={index} className="document-item">
              <div className="document-info">
                <span className="document-name">{doc.fileName}</span>
                <span className="document-date">{new Date(doc.createdAt).toLocaleString()}</span>
              </div>
              <div className="document-actions">
                <button className="document-action view">
                  <span className="icon-ui-description"></span>
                </button>
                <button className="document-action delete">
                  <span className="icon-ui-trash"></span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentPanel;
