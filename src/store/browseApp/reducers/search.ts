import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../configureStore';

// Define types
export interface SearchParams {
  term: string;
  categories: string[];
  location?: string;
  timeFilter?: string;
}

interface SearchState {
  term: string;
  results: any[];
  isLoading: boolean;
  error: string | null;
  categories: string[];
}

const initialState: SearchState = {
  term: '',
  results: [],
  isLoading: false,
  error: null,
  categories: []
};

// Create async thunks for search actions
export const searchByTerm = createAsyncThunk(
  'browseApp/search/byTerm',
  async (term: string, { dispatch }) => {
    try {
      dispatch(searchStart(term));
      // In a real implementation, this would call an API
      // For now, we'll simulate a response
      const results = [
        { id: 1, title: `Result for ${term} 1` },
        { id: 2, title: `Result for ${term} 2` },
        { id: 3, title: `Result for ${term} 3` }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch(searchSuccess(results));
      return results;
    } catch (error) {
      dispatch(searchFailure(error.message));
      throw error;
    }
  }
);

export const searchByCategorySchema = createAsyncThunk(
  'browseApp/search/byCategory',
  async ({ category }: { category: string }, { dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const currentTerm = state.search.term;
      
      dispatch(searchStart(currentTerm));
      
      // In a real implementation, this would call an API with category filter
      // For now, we'll simulate a response
      const results = [
        { id: 1, title: `${category} result 1` },
        { id: 2, title: `${category} result 2` },
        { id: 3, title: `${category} result 3` }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch(searchSuccess(results));
      dispatch(addCategory(category));
      return results;
    } catch (error) {
      dispatch(searchFailure(error.message));
      throw error;
    }
  }
);

const searchSlice = createSlice({
  name: 'browseApp/search',
  initialState,
  reducers: {
    searchStart: (state, action: PayloadAction<string>) => {
      state.term = action.payload;
      state.isLoading = true;
      state.error = null;
    },
    searchSuccess: (state, action: PayloadAction<any[]>) => {
      state.results = action.payload;
      state.isLoading = false;
    },
    searchFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearSearch: (state) => {
      state.term = '';
      state.results = [];
      state.error = null;
      state.categories = [];
    },
    addCategory: (state, action: PayloadAction<string>) => {
      if (!state.categories.includes(action.payload)) {
        state.categories.push(action.payload);
      }
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(cat => cat !== action.payload);
    }
  }
});

export const { 
  searchStart, 
  searchSuccess, 
  searchFailure, 
  clearSearch,
  addCategory,
  removeCategory
} = searchSlice.actions;

export default searchSlice.reducer;
