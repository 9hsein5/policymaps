import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { processDocumentForMap, extractDataFromDocument } from '../../../services/DocumentProcessingService';
import { receiveMessage } from '../../../store/browseApp/reducers/chat';

// Document processor for handling different file types
const DocumentProcessor: React.FC = () => {
  const dispatch = useDispatch();
  
  // Process a document and apply it to the map
  const processDocument = async (file: File) => {
    try {
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      
      // Determine file type and process accordingly
      let result = false;
      let extractedData = null;
      
      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        // Process GeoJSON
        result = await processDocumentForMap(url);
      } else if (file.name.endsWith('.shp') || file.name.endsWith('.zip')) {
        // Process Shapefile
        result = await processDocumentForMap(url);
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        // Extract data and try to process as spatial data
        extractedData = await extractDataFromDocument(url);
        if (extractedData && extractedData.hasGeospatialData) {
          result = await processDocumentForMap(url);
        }
      } else if (file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
        // Extract text data from document
        extractedData = await extractDataFromDocument(url);
      }
      
      // Send a system message with the results
      if (result) {
        dispatch(receiveMessage({
          id: uuidv4(),
          text: `I've successfully applied ${file.name} to the map.`,
          isUser: false,
          timestamp: new Date()
        }));
      } else if (extractedData) {
        dispatch(receiveMessage({
          id: uuidv4(),
          text: `I've analyzed ${file.name} but couldn't find any map data to display.`,
          isUser: false,
          timestamp: new Date()
        }));
      } else {
        dispatch(receiveMessage({
          id: uuidv4(),
          text: `I couldn't process ${file.name} for map display. The format may not be supported.`,
          isUser: false,
          timestamp: new Date()
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error processing document:', error);
      
      dispatch(receiveMessage({
        id: uuidv4(),
        text: `There was an error processing ${file.name}. Please try again or use a different file.`,
        isUser: false,
        timestamp: new Date()
      }));
      
      return false;
    }
  };
  
  return null; // This component doesn't render anything
};

export default DocumentProcessor;
