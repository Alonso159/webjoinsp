import axios from 'axios';
import { encryptAes } from '../utils/crypto';

const API_BASE_URL = 'http://localhost:5220/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token JWT a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const apiService = {
  // --- AUTH ---
  login: async (identifier, password) => {
    const encryptedIdentifier = encryptAes(identifier);
    const encryptedPassword = encryptAes(password);
    const response = await api.post('/Auth/login', {
      identifier: encryptedIdentifier,
      password: encryptedPassword
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/Auth/profile');
    return response.data;
  },

  // --- RENDICIONES / GASTOS ---
  getRendicionesFiltros: async (filtros) => {
    const response = await api.get('/Rendiciones/Rendiciones/Filtros', { params: filtros });
    return response.data;
  },

  getRendicionesMes: async (mes, anio) => {
    const response = await api.get('/Rendiciones/Rendiciones/Mes', { params: { mes, anio } });
    return response.data;
  },

  getRendiciones: async () => {
    const response = await api.get('/Rendiciones/Rendiciones');
    return response.data;
  },

  getRendicionDetalle: async (id) => {
    const response = await api.get(`/Rendiciones/RendicionDetalle/${id}`);
    return response.data;
  },

  actualizarEstadoRendicion: async (id, estado, razon) => {
    const response = await api.put(`/Rendiciones/Rendiciones/${id}/Estado`, {
      estado,
      razon
    });
    return response.data;
  },

  // --- GASTOS / VALIDACION ---
  validarComprobante: async (datosComprobante) => {
    const response = await api.post('/Gastos/ValidarComprobante', datosComprobante);
    return response.data;
  },

  // --- TIPOS DE GASTO ---
  getTiposGasto: async () => {
    const response = await api.get('/TiposGasto/TiposGasto');
    return response.data;
  },

  getTipoGastoById: async (id) => {
    const response = await api.get(`/TiposGasto/TiposGasto/${id}`);
    return response.data;
  },

  createTipoGasto: async (tipoGasto) => {
    const response = await api.post('/TiposGasto/CreateTiposGasto', tipoGasto);
    return response.data;
  },

  updateTipoGasto: async (tipoGasto) => {
    const response = await api.put('/TiposGasto/UpdateTiposGasto', tipoGasto);
    return response.data;
  },

  // --- USUARIOS ---
  getUsuarios: async () => {
    const response = await api.get('/Usuarios');
    return response.data;
  },

  getUsuarioById: async (id) => {
    const response = await api.get(`/Usuarios/${id}`);
    return response.data;
  },

  cambiarEstadoUsuario: async (id, activo) => {
    const response = await api.patch(`/Usuarios/${id}/estado`, { activo });
    return response.data;
  },
};
