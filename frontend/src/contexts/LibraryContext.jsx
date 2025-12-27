import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { booksAPI, categoriesAPI } from '../services/api.jsx';

const LibraryContext = createContext();

const initialState = {
  books: [],
  categories: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    location: '',
  },
  selectedBook: null,
  showBookDetail: false,
};

const libraryReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_BOOKS':
      return { ...state, books: action.payload, loading: false };
    
    case 'ADD_BOOK':
      return { ...state, books: [...state.books, action.payload], loading: false };
    
    case 'UPDATE_BOOK':
      return {
        ...state,
        books: state.books.map(book =>
          book._id === action.payload._id ? action.payload : book
        ),
        selectedBook: state.selectedBook?._id === action.payload._id 
          ? action.payload 
          : state.selectedBook
      };
    
    case 'DELETE_BOOK':
      return {
        ...state,
        books: state.books.filter(book => book._id !== action.payload),
        selectedBook: state.selectedBook?._id === action.payload ? null : state.selectedBook
      };
    
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'SET_SELECTED_BOOK':
      return { ...state, selectedBook: action.payload };
    
    case 'TOGGLE_BOOK_DETAIL':
      return { ...state, showBookDetail: !state.showBookDetail };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

export const LibraryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(libraryReducer, initialState);
  const debounceRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    loadBooks();
    loadCategories();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      loadBooks();
    }, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [state.filters]);

  const loadBooks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await booksAPI.getAll(state.filters);
      dispatch({ type: 'SET_BOOKS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      dispatch({ type: 'SET_CATEGORIES', payload: response.data });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const addBook = async (isbn, coverImage = null) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await booksAPI.addByISBN(isbn, coverImage);
      dispatch({ type: 'ADD_BOOK', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateBook = async (id, data) => {
    try {
      const response = await booksAPI.update(id, data);
      dispatch({ type: 'UPDATE_BOOK', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateReadingStatus = async (id, person, read, rating, review, reviewDate, goodreadsUrl) => {
    try {
      const response = await booksAPI.updateReadingStatus(id, person, read, rating, review, reviewDate, goodreadsUrl);
      dispatch({ type: 'UPDATE_BOOK', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteBook = async (id) => {
    try {
      await booksAPI.delete(id);
      dispatch({ type: 'DELETE_BOOK', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const addCategory = async (categoryData) => {
    try {
      const response = await categoriesAPI.create(categoryData);
      dispatch({ type: 'ADD_CATEGORY', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const selectBook = (book) => {
    dispatch({ type: 'SET_SELECTED_BOOK', payload: book });
    dispatch({ type: 'TOGGLE_BOOK_DETAIL' });
  };

  const closeBookDetail = () => {
    dispatch({ type: 'TOGGLE_BOOK_DETAIL' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    loadBooks,
    loadCategories,
    addBook,
    updateBook,
    updateReadingStatus,
    deleteBook,
    addCategory,
    setFilters,
    selectBook,
    closeBookDetail,
    clearError,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
