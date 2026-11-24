import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Computed: es admin si el rol contiene "Admin" (case-insensitive)
  const isAdmin = user?.rol?.toLowerCase().includes('admin') ?? false;

  // Computed: es colaborador si el rol contiene "Colaborador" (case-insensitive)
  const isColaborador = user?.rol?.toLowerCase().includes('colaborador') ?? false;

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await apiService.getProfile();
      setUser(profile);
      // Persistir en localStorage para reload rápido
      localStorage.setItem('userProfile', JSON.stringify(profile));
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Si falla, limpiar sesión
      localStorage.removeItem('token');
      localStorage.removeItem('userProfile');
      setUser(null);
    }
  }, []);

  // Al montar: si hay token, recuperar perfil
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Intentar desde cache primero para velocidad
      const cached = localStorage.getItem('userProfile');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch (_) {}
      }
      fetchProfile().finally(() => setLoadingProfile(false));
    } else {
      setLoadingProfile(false);
    }
  }, [fetchProfile]);

  // login: guarda token y carga perfil
  const login = useCallback(async (token) => {
    localStorage.setItem('token', token);
    await fetchProfile();
  }, [fetchProfile]);

  // logout: limpia todo
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, isColaborador, loadingProfile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
