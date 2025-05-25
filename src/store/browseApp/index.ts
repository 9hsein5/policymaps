import { combineReducers } from '@reduxjs/toolkit';
import uiReducer from './reducers/UI';
import searchReducer from './reducers/search';
import mapReducer from './reducers/map';
import chatReducer from './reducers/chat';

const browseAppReducer = combineReducers({
  ui: uiReducer,
  search: searchReducer,
  map: mapReducer,
  chat: chatReducer
});

export default browseAppReducer;
