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
    const response = await api.get('/Aprobaciones/aprobaciones/Filtros', { params: filtros });
    return response.data;
  },

  getRendicionesFiltrosPorDepartamento: async (departamento, filtros) => {
    const response = await api.get(`/Aprobaciones/aprobaciones/Filtros/Departamento/${departamento}`, { params: filtros });
    return response.data;
  },

  getRendicionesMes: async (mes, anio) => {
    const response = await api.get('/Aprobaciones/aprobaciones/Mes', { params: { mes, anio } });
    return response.data;
  },

  getRendicionesMesPorDepartamento: async (departamento, mes, anio) => {
    const response = await api.get(`/Aprobaciones/aprobaciones/Mes/Departamento/${departamento}`, { params: { mes, anio } });
    return response.data;
  },

  getRendiciones: async () => {
    const response = await api.get('/Aprobaciones/aprobaciones');
    return response.data;
  },

  getRendicionesPorDepartamento: async (departamento) => {
    const response = await api.get(`/Aprobaciones/aprobaciones/Departamento/${departamento}`);
    return response.data;
  },

  getAprobacionesPorUsuarioClaim: async () => {
    try {
      const response = await api.get('/Aprobaciones/aprobaciones/MisAprobaciones');
      return response.data;
    } catch (e) {
      if (e.response && (e.response.status === 404 || e.response.status === 405)) {
        const response = await api.get('/Aprobaciones/MisAprobaciones');
        return response.data;
      }
      throw e;
    }
  },

  getRendicionDetalle: async (id) => {
    const response = await api.get(`/Aprobaciones/aprobacionDetalle/${id}`);
    return response.data;
  },

  actualizarEstadoRendicion: async (id, estado, razon, aprobador) => {
    const response = await api.put(`/Aprobaciones/aprobaciones/${id}/Estado`, {
      estado,
      razon,
      aprobador
    });
    return response.data;
  },

  // --- RENDICIONES GRUPO ---
  crearRendicionGrupo: async (rendicionesIds, dni, userId) => {
    const response = await api.post('/Rendiciones/Agrupar', {
      dni,
      userId,
      RendicionIds: rendicionesIds
    });
    return response.data;
  },

  getGruposRendicion: async () => {
    const response = await api.get('/Rendiciones');
    return response.data;
  },

  getGruposRendicionPorDepartamento: async (departamento) => {
    const response = await api.get(`/Rendiciones/Departamento/${departamento}`);
    return response.data;
  },

  getGrupoPorId: async (id) => {
    const response = await api.get(`/Rendiciones/${id}`);
    return response.data;
  },

  cerrarGrupoRendicion: async (id, aprobador) => {
    const response = await api.put(`/Rendiciones/${id}/Estado`, { aprobador });
    return response.data;
  },

  eliminarGrupoRendicion: async (id) => {
    const response = await api.delete(`/Rendiciones/${id}`);
    return response.data;
  },

  getGastosPorGrupo: async (grupoId) => {
    const response = await api.get(`/Aprobaciones/Grupo/${grupoId}`);
    return response.data;
  },

  // --- GASTOS / VALIDACION ---
  getDocumentosUsuarioDepartamento: async (departamento) => {
    const response = await api.get(`/Gastos/DocumentosUsuario/Departamento/${departamento}`);
    return response.data;
  },

  validarComprobante: async (datosComprobante) => {
    const response = await api.post('/Gastos/ValidarComprobante', datosComprobante);
    return response.data;
  },

  registrarGasto: async (gastoData) => {
    const response = await api.post('/Gastos/RegistrarGasto', gastoData);
    return response.data;
  },

  // --- OCR / CARGA MASIVA ---
  procesarDocumentosMasivo: async (formData) => {
    const response = await api.post('/DocumentOcr/procesar-masivo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

  getUsuariosPorDepartamento: async (departamento) => {
    const response = await api.get(`/Usuarios/Departamento/${departamento}`);
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

  // --- ORDENES INTERNAS ---
  getOrdenesInternasFiltros: async (filtros) => {
    const response = await api.get('/OrdenInterna/Listar', { params: filtros });
    return response.data;
  },

  getOrdenesInternasFiltrosPorDepartamento: async (departamento, filtros) => {
    // Si el backend requiere la ruta antigua, se puede revertir,
    // pero usamos /OrdenInterna/Listar por solicitud del usuario
    const response = await api.get(`/OrdenInterna/Listar`, { params: { ...filtros, departamento } });
    return response.data;
  },

  getOrdenesInternas: async () => {
    const response = await api.get('/OrdenInterna/Listar');
    return response.data;
  },

  getOrdenesInternasPorDepartamento: async (departamento) => {
    const response = await api.get(`/OrdenInterna/Listar`, { params: { departamento } });
    return response.data;
  },

  getOrdenInternaDetalle: async (id) => {
    const response = await api.get(`/OrdenInterna/Detalle/${id}`);
    return response.data;
  },

  actualizarEstadoOrdenInterna: async (id, estado, razon) => {
    const response = await api.put(`/OrdenesInternas/OrdenesInternas/${id}/Estado`, {
      estado,
      razon
    });
    return response.data;
  },

  // --- TIPOS DE ORDEN INTERNA ---
  getTiposOrdenInterna: async () => {
    const response = await api.get('/TiposOrdenInterna');
    return response.data;
  },

  getTipoOrdenInternaByName: async (nombre) => {
    const response = await api.get(`/TiposOrdenInterna/${nombre}`);
    return response.data;
  },

  createTipoOrdenInterna: async (tipoData) => {
    const response = await api.post('/TiposOrdenInterna', tipoData);
    return response.data;
  },

  updateTipoOrdenInterna: async (nombre, tipoData) => {
    const response = await api.put(`/TiposOrdenInterna/${nombre}`, tipoData);
    return response.data;
  },

  deleteTipoOrdenInterna: async (nombre) => {
    const response = await api.delete(`/TiposOrdenInterna/${nombre}`);
    return response.data;
  }
};
