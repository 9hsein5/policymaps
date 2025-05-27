import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from './reducers/UI';
import mapReducer from './reducers/map';

const browseAppReducer = combineReducers({
  ui: uiReducer,
  map: mapReducer,
});

export default browseAppReducer;
