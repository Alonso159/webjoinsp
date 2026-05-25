import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Search, Eye, Power } from 'lucide-react';
import './Usuarios.css';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const resp = await apiService.getUsuarios();
      if (resp.success) {
        setUsuarios(resp.data || []);
      }
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (id, estadoActual) => {
    const accion = estadoActual ? 'inactivar' : 'activar';
    if (!window.confirm(`¿Está seguro de ${accion} a este usuario?`)) return;

    try {
      const nuevoEstado = !estadoActual;
      await apiService.cambiarEstadoUsuario(id, nuevoEstado);
      // Update local state
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, activo: nuevoEstado } : u));
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser({ ...selectedUser, activo: nuevoEstado });
      }
    } catch (error) {
      alert('Error al cambiar el estado del usuario.');
    }
  };

  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setShowModal(true);
    try {
      const resp = await apiService.getUsuarioById(id);
      if (resp.success) {
        setSelectedUser(resp.data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Error al obtener los detalles del usuario.');
      setShowModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    (u.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.apellidos?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.correo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">Administra los usuarios registrados en el sistema</p>
        </div>
      </div>

      <Card className="table-card mt-6">
        <div className="card-header">
          <h3>Lista de Usuarios</h3>
          <div className="table-actions">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar usuario..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="ui-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NOMBRE COMPLETO</th>
                <th>CORREO</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4 text-secondary">Cargando usuarios...</td></tr>
              ) : filteredUsuarios.length > 0 ? (
                filteredUsuarios.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium text-secondary">#{user.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar-sm">
                          {user.nombre ? user.nombre.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <span>{user.nombre} {user.apellidos}</span>
                      </div>
                    </td>
                    <td>{user.correo}</td>
                    <td>
                      {user.activo ? (
                        <Badge variant="success">Activo</Badge>
                      ) : (
                        <Badge variant="danger">Inactivo</Badge>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye size={16} />}
                          onClick={() => handleViewDetails(user.id)}
                          title="Ver Detalles"
                        >
                          Detalles
                        </Button>
                        <Button
                          variant={user.activo ? "outline" : "primary"}
                          size="sm"
                          icon={<Power size={16} />}
                          onClick={() => handleToggleEstado(user.id, user.activo)}
                          title={user.activo ? "Inactivar" : "Activar"}
                          className={user.activo ? "btn-danger-outline" : ""}
                        >
                          {user.activo ? "Inactivar" : "Activar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-4 text-secondary">No se encontraron usuarios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Details Modal */}
      {showModal && (
        <div className="modal-overlay">
          <Card className="modal-content user-modal">
            <div className="modal-header">
              <h3>Detalles del Usuario</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {loadingDetails ? (
                <p className="text-center py-4 text-secondary">Cargando detalles...</p>
              ) : selectedUser ? (
                <div className="user-details-grid">
                  <div className="detail-group">
                    <label>ID</label>
                    <p>#{selectedUser.id}</p>
                  </div>
                  <div className="detail-group">
                    <label>Nombre Completo</label>
                    <p>{selectedUser.nombre} {selectedUser.nombreCompleto}</p>
                  </div>
                  <div className="detail-group">
                    <label>Correo Electrónico</label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div className="detail-group">
                    <label>Estado</label>
                    <p>
                      {selectedUser.activo ? (
                        <span className="text-success font-medium">Activo</span>
                      ) : (
                        <span className="text-danger font-medium">Inactivo</span>
                      )}
                    </p>
                  </div>
                  {/* Add more fields here if the API returns them, like role, phone, etc. */}
                </div>
              ) : (
                <p className="text-center text-danger">No se pudo cargar la información.</p>
              )}
            </div>

            <div className="modal-footer">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cerrar</Button>
              {selectedUser && (
                <Button
                  variant={selectedUser.activo ? "outline" : "primary"}
                  className={selectedUser.activo ? "btn-danger-outline" : ""}
                  onClick={() => {
                    handleToggleEstado(selectedUser.id, selectedUser.activo);
                  }}
                >
                  {selectedUser.activo ? "Inactivar Usuario" : "Activar Usuario"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
