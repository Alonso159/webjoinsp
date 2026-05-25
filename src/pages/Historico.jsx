import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Search, Calendar, Filter, Download, Eye } from 'lucide-react';
import './Aprobaciones.css'; // Reutilizamos los estilos de tabla y filtros

const historicoMock = [
  { id: '#EXP-2024-892', fecha: '12/05/2024', usuario: 'Juan Perez', rol: 'Ventas', descripcion: 'Almuerzo con cliente...', tipo: 'Alimentación', monto: 'S/ 145.00', estado: 'Aprobado' },
  { id: '#EXP-2024-891', fecha: '11/05/2024', usuario: 'Maria Rodriguez', rol: 'Marketing', descripcion: 'Taxi a imprenta', tipo: 'Movilidad', monto: 'S/ 25.50', estado: 'Pendiente' },
  { id: '#EXP-2024-885', fecha: '10/05/2024', usuario: 'Carlos Vargas', rol: 'Operaciones', descripcion: 'Hospedaje Cusco - Pr...', tipo: 'Hospedaje', monto: 'S/ 450.00', estado: 'Pagado' },
  { id: '#EXP-2024-880', fecha: '09/05/2024', usuario: 'Elena Quispe', rol: 'RRHH', descripcion: 'Compra de materiales...', tipo: 'Útiles', monto: 'S/ 89.90', estado: 'Rechazado' },
];

const Historico = () => {
  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Aprobado': return <Badge variant="success">Aprobado</Badge>;
      case 'Pagado': return <Badge variant="primary" className="bg-blue-100 text-blue-700">Pagado</Badge>;
      case 'Rechazado': return <Badge variant="danger">Rechazado</Badge>;
      case 'Pendiente': return <Badge variant="warning">Pendiente</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="aprobaciones-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Histórico de Gastos</h1>
          <p className="page-subtitle">Consulta, filtra y exporta el registro detallado de todas las solicitudes de reembolso pasadas.</p>
        </div>
      </div>

      <Card className="filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Fecha Inicio</label>
            <div className="input-with-icon">
              <Calendar size={16} className="input-icon" />
              <input type="text" placeholder="mm/dd/yyyy" className="filter-input" />
            </div>
          </div>
          <div className="filter-group">
            <label>Fecha Fin</label>
            <div className="input-with-icon">
              <Calendar size={16} className="input-icon" />
              <input type="text" placeholder="mm/dd/yyyy" className="filter-input" />
            </div>
          </div>
          <div className="filter-group">
            <label>Colaborador</label>
            <div className="input-with-icon">
              <Search size={16} className="input-icon" />
              <input type="text" placeholder="Buscar por nombre..." className="filter-input" />
            </div>
          </div>
          <div className="filter-group">
            <label>Estado</label>
            <select className="filter-select">
              <option>Todos</option>
              <option>Aprobado</option>
              <option>Rechazado</option>
              <option>Pagado</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="filter-group" style={{ width: '200px' }}>
            <label>Tipo de Gasto</label>
            <select className="filter-select">
              <option>Todos</option>
            </select>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" icon={<X size={16}/>}>Limpiar</Button>
            <Button variant="primary" icon={<Search size={16}/>}>Buscar Registros</Button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 mb-4">
          <span className="text-sm font-medium">Mostrando 1-10 de 1,248 resultados</span>
          <Button variant="ghost" icon={<Download size={16} />} className="text-primary">Descargar Excel</Button>
        </div>

        <div className="table-responsive">
          <table className="ui-table approvals-table">
            <thead>
              <tr>
                <th>ID GASTO</th>
                <th>FECHA</th>
                <th>COLABORADOR</th>
                <th>DESCRIPCIÓN</th>
                <th>TIPO</th>
                <th>MONTO (PEN)</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {historicoMock.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-secondary font-medium">{item.id}</td>
                  <td>{item.fecha}</td>
                  <td>
                    <div className="user-cell">
                      <div className="avatar-sm"></div>
                      <div>
                        <div className="font-medium text-primary">{item.usuario}</div>
                        <div className="text-xs text-secondary">{item.rol}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.descripcion}</td>
                  <td><Badge>{item.tipo}</Badge></td>
                  <td className="font-semibold">{item.monto}</td>
                  <td>{getEstadoBadge(item.estado)}</td>
                  <td>
                    <button className="action-icon-btn"><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-footer">
          <Button variant="outline" size="sm">Anterior</Button>
          <div className="pagination-controls">
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <span className="px-2 text-secondary">...</span>
            <button className="page-btn">12</button>
          </div>
          <Button variant="outline" size="sm">Siguiente</Button>
        </div>
      </Card>
    </div>
  );
};

export default Historico;
