import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import {
  LayoutDashboard as IconDashboard,
  CheckSquare as IconAprobaciones,
  PieChart,
  Settings as IconSettings,
  LogOut as IconLogOut,
  Bell as IconBell,
  Wallet as IconWallet,
  List as IconList,
  Users as IconUsers
} from 'lucide-react';
import './MainLayout.css';

const MainLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <IconWallet size={28} className="logo-icon" />
            <span className="logo-text">GastosEmpresa</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <IconDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/aprobaciones" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <IconAprobaciones size={20} />
            <span>Aprobaciones</span>
          </NavLink>



          <div className="nav-divider"></div>

          <NavLink to="/tipos-gasto" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <IconList size={20} />
            <span>Tipos de Gasto</span>
          </NavLink>

          <NavLink to="/usuarios" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <IconUsers size={20} />
            <span>Usuarios</span>
          </NavLink>

          <NavLink to="/configuracion" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <IconSettings size={20} />
            <span>Configuración</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <IconLogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-search">
            {/* Opcional: Input de búsqueda global */}
          </div>

          <div className="topbar-actions">
            <button className="icon-btn">
              <IconBell size={20} />
            </button>
            <div className="user-profile">
              <div className="avatar">
                <span>AD</span>
              </div>
              <div className="user-info">
                <span className="user-name">Admin Panel</span>
                <span className="user-role">Empresa S.A.</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
