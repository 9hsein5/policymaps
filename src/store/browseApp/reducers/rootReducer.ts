import { combineReducers } from 'redux';

import itemCollectionsReducer from './itemCollections';
import myFavItemsReducer from './myFavItems';
import mapReducer from './map';
import uiReducer from './UI';
import groupContent from './groupContent'
import chatReducer from './chat';
import searchReducer from './search';

const entities = combineReducers({
    itemCollection: itemCollectionsReducer,
    myFavItems: myFavItemsReducer
});

export default combineReducers({
    entities,
    map: mapReducer,
    ui: uiReducer,
    groupContent,
    chat: chatReducer,
    search: searchReducer
});