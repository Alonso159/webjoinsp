import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Aprobaciones from './pages/Aprobaciones';
import AprobacionDetalle from './pages/AprobacionDetalle';
import Perfil from './pages/Perfil';
import TiposGasto from './pages/TiposGasto';
import TiposOrdenInterna from './pages/TiposOrdenInterna';
import OrdenInternaDetalle from './pages/OrdenInternaDetalle';
import Usuarios from './pages/Usuarios';
import RendicionGrupoDetalle from './pages/RendicionGrupoDetalle';
import CargaMasiva from './pages/CargaMasiva';

// Ruta privada: redirige a /login si no hay token
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Ruta solo para Admin
const AdminRoute = ({ children }) => {
  const { isAdmin, loadingProfile } = useAuth();
  if (loadingProfile) return null; // espera a cargar el perfil
  return isAdmin ? children : <Navigate to="/" replace />;
};

// Ruta no accesible por Colaboradores (solo Aprobadores/Admin)
const NoColaboradorRoute = ({ children }) => {
  const { isColaborador, loadingProfile } = useAuth();
  if (loadingProfile) return null;
  return !isColaborador ? children : <Navigate to="/carga-masiva" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Rutas accesibles por todos los roles */}
        <Route index element={<Dashboard />} />
        <Route path="carga-masiva" element={<CargaMasiva />} />
        <Route path="ordenes-de-pago/:id" element={<OrdenInternaDetalle />} />
        <Route path="configuracion" element={<Perfil />} />
        <Route path="rendiciones/:id" element={<RendicionGrupoDetalle />} />

        {/* Rutas solo para Aprobadores / Admin (No colaboradores) */}
        <Route path="aprobaciones" element={<NoColaboradorRoute><Aprobaciones /></NoColaboradorRoute>} />
        <Route path="aprobaciones/:id" element={<NoColaboradorRoute><AprobacionDetalle /></NoColaboradorRoute>} />

        {/* Rutas solo Admin */}
        <Route path="tipos-gasto" element={<AdminRoute><TiposGasto /></AdminRoute>} />
        <Route path="tipos-orden-interna" element={<AdminRoute><TiposOrdenInterna /></AdminRoute>} />
        <Route path="usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
