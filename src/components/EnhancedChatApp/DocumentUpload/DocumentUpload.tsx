import * as React from 'react';
import './style.scss';

interface DocumentUploadProps {
  onDocumentUpload?: (file: File) => void;
  uploadedFiles?: string[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentUpload,
  uploadedFiles = []
}) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [localUploadedFiles, setLocalUploadedFiles] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Combine local uploaded files with passed-in files
  const allUploadedFiles = React.useMemo(() => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      return [...localUploadedFiles, ...uploadedFiles];
    }
    return localUploadedFiles;
  }, [localUploadedFiles, uploadedFiles]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };
  
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    // Simulate upload process
    try {
      for (const file of files) {
        // In a real implementation, you would upload the file to a server here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        if (onDocumentUpload) {
          onDocumentUpload(file);
        }
        
        setLocalUploadedFiles(prev => [...prev, file.name]);
      }
      
      // Clear the files array after successful upload
      setFiles([]);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
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
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };
  
  return (
    <div className="document-upload-panel">
      <div className="upload-section">
        <h3>Upload Documents</h3>
        <p>Upload documents to enrich the context of your chat. Supported formats: PDF, DOCX, TXT, CSV.</p>
        
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
                  <li key={index} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                    <button 
                      className="remove-file-button" 
                      onClick={() => handleRemoveFile(index)}
                      disabled={uploading}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
              
              <button 
                className="upload-button" 
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
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
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
