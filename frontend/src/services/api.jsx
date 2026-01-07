import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const message = error?.response?.data?.message || error.message || 'Error de red';
    return Promise.reject(new Error(message));
  }
);

export const booksAPI = {
  getPublic: () => axios.get(`${API_BASE_URL}/public/books`),
  
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/books?${params}`);
  },
  
  getById: (id) => api.get(`/books/${id}`),
  
  addByISBN: (isbn, coverImage = null) => api.post('/books/add-by-isbn', { isbn, coverImage }),
  
  searchByISBN: (isbn) => api.post('/books/search-by-isbn', { isbn }),
  
  searchExternal: (query) => api.post('/books/search-external', { query }),
  
  update: (id, data) => api.put(`/books/${id}`, data),
  
  updateReadingStatus: (id, person, read, rating, review, reviewDate, goodreadsUrl) => 
    api.put(`/books/${id}/reading-status`, { person, read, rating, review, reviewDate, goodreadsUrl }),
  
  delete: (id) => api.delete(`/books/${id}`),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  
  create: (data) => api.post('/categories', data),
  
  update: (id, data) => api.put(`/categories/${id}`, data),
  
  delete: (id) => api.delete(`/categories/${id}`),
};

export const statsAPI = {
  getOverview: () => api.get('/stats/overview'),
  
  getReadingByMonth: (year) => api.get(`/stats/reading-by-month?year=${year}`),
  
  getByCategory: () => api.get('/stats/by-category'),
  
  getByLocation: () => api.get('/stats/by-location'),
};

export default api;
