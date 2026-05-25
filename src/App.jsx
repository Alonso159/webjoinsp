import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Aprobaciones from './pages/Aprobaciones';
import AprobacionDetalle from './pages/AprobacionDetalle';
import Reportes from './pages/Reportes';
import Historico from './pages/Historico';
import Perfil from './pages/Perfil';
import TiposGasto from './pages/TiposGasto';
import Usuarios from './pages/Usuarios';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="aprobaciones" element={<Aprobaciones />} />
          <Route path="aprobaciones/:id" element={<AprobacionDetalle />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="historico" element={<Historico />} />
          <Route path="configuracion" element={<Perfil />} />
          <Route path="tipos-gasto" element={<TiposGasto />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
