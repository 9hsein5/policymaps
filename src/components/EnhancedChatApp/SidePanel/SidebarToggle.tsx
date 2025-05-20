import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../../store/browseApp/reducers/UI';
import './style.scss';

interface SidebarToggleProps {
  hideSideBar?: boolean;
  onToggleSidebar?: () => void;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({
  hideSideBar = false,
  onToggleSidebar
}) => {
  const dispatch = useDispatch();
  
  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      dispatch(toggleSidebar());
    }
  };
  
  return (
    <div className={`sidebar-toggle ${hideSideBar ? 'sidebar-hidden' : ''}`}>
      <button 
        className="toggle-button" 
        onClick={handleToggle}
        aria-label={hideSideBar ? "Show sidebar" : "Hide sidebar"}
      >
        <i className={`icon-ui-${hideSideBar ? 'right' : 'left'}`}></i>
      </button>
    </div>
  );
};

export default SidebarToggle;
