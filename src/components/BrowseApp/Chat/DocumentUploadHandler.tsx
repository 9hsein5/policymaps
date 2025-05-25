import * as React from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { processDocumentForMap } from '../../../services/DocumentProcessingService';
import { sendChatMessage } from '../../../store/browseApp/thunks/chat';

// Document types supported for map visualization
const SUPPORTED_MAP_FORMATS = ['.geojson', '.json', '.zip', '.shp', '.kml', '.kmz', '.csv', '.xlsx'];

interface Props {
  onUploadComplete?: (success: boolean, message: string) => void;
}

const DocumentUploadHandler: React.FC<Props> = ({
  onUploadComplete
}) => {
  const dispatch = useDispatch();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsProcessing(true);
    const files = Array.from(e.target.files);
    let successCount = 0;
    let errorCount = 0;
    
    // Process each file
    for (const file of files) {
      try {
        // Create object URL for the file
        const url = URL.createObjectURL(file);
        
        // Determine if this is a map-compatible format
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const isMapFormat = SUPPORTED_MAP_FORMATS.includes(fileExtension);
        
        // Create attachment object
        const attachment = {
          id: uuidv4(),
          name: file.name,
          type: determineFileType(file),
          url: url,
          appliedToMap: false
        };
        
        // If it's a map format, process it for the map
        if (isMapFormat) {
          try {
            const success = await processDocumentForMap(url);
            if (success) {
              attachment.appliedToMap = true;
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error('Error processing document for map:', error);
            errorCount++;
          }
        }
        
        // Send a message with the attachment
        dispatch(sendChatMessage({
          id: uuidv4(),
          text: `Uploaded ${file.name}${attachment.appliedToMap ? ' and applied to map' : ''}`,
          isUser: true,
          timestamp: new Date(),
          attachments: [attachment]
        }));
        
      } catch (error) {
        console.error('Error handling file upload:', error);
        errorCount++;
      }
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setIsProcessing(false);
    
    // Notify about completion
    if (onUploadComplete) {
      const message = `Processed ${files.length} files. ${successCount} applied to map${errorCount > 0 ? `, ${errorCount} errors` : ''}.`;
      onUploadComplete(errorCount === 0, message);
    }
  };
  
  const determineFileType = (file: File): 'document' | 'image' | 'geojson' | 'shapefile' => {
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
      return 'geojson';
    } else if (file.name.endsWith('.shp') || file.name.endsWith('.zip')) {
      return 'shapefile';
    }
    return 'document';
  };
  
  return (
    <label htmlFor="document-upload-input" className="document-upload-label" style={{ display: 'none' }}>
      Upload Document
      <input
        id="document-upload-input"
        className="document-upload-input"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.geojson,.json,.zip,.shp,.kml,.kmz,.jpg,.jpeg,.png,.gif"
        disabled={isProcessing}
        title="Upload one or more documents"
        placeholder="Select files to upload"
      />
    </label>
  );
};

export default DocumentUploadHandler;
