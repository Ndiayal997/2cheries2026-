// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://twocheries-backend.onrender.com/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('2cheries_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('2cheries_token');
      localStorage.removeItem('2cheries_user');
      window.location.href = '/';
    }
    return Promise.reject(error.response?.data || { error: 'Erreur réseau' });
  }
);

export default api;
