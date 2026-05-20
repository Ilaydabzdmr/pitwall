import axios from 'axios';

// Backend'in adresi - tüm istekler buraya gidecek
const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});

// Her isteğe otomatik JWT token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // localStorage: tarayıcıda saklanan veri, sayfa yenilense de kalır
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Tüm korumalı endpoint'ler bu header'ı bekliyor
  }
  return config;
});

export default api;