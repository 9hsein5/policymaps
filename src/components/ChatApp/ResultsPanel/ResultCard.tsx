import * as React from 'react';
import './style.scss';

interface Result {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  url: string;
  owner: string;
  created: Date;
  type: string;
}

interface Props {
  result: Result;
  onView: () => void;
  onAddToMap: () => void;
}

const ResultCard: React.FC<Props> = ({
  result,
  onView,
  onAddToMap
}) => {
  const { title, description, thumbnailUrl, owner, created } = result;
  
  const formattedDate = new Date(created).toLocaleDateString();
  
  return (
    <div className="result-card">
      <div className="result-thumbnail">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} />
        ) : (
          <div className="placeholder-thumbnail">
            <span className="icon-ui-map"></span>
          </div>
        )}
      </div>
      
      <div className="result-content">
        <h3 className="result-title">{title}</h3>
        <p className="result-description">{description}</p>
        
        <div className="result-metadata">
          <span className="result-owner">
            <span className="icon-ui-user"></span> {owner}
          </span>
          <span className="result-date">
            <span className="icon-ui-calendar"></span> {formattedDate}
          </span>
        </div>
        
        <div className="result-actions">
          <button 
            className="btn-view" 
            onClick={onView}
            title="View details"
          >
            <span className="icon-ui-description"></span> View
          </button>
          
          <button 
            className="btn-add-to-map" 
            onClick={onAddToMap}
            title="Add to map"
          >
            <span className="icon-ui-map-pin"></span> Add to Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
