import axios from 'axios';

// Centralized Axios instance for API calls.
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
