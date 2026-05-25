import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Search, Calendar, Filter, Eye, Check, X } from 'lucide-react';
import { apiService } from '../services/api';
import './Aprobaciones.css';

const Aprobaciones = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Todos');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [filtros, setFiltros] = useState({
    usuario: '',
    fechaInicio: '',
    fechaFin: '',
    tipoDoc: '',
    tipoGasto: ''
  });

  // Vistas del calendario (para navegación de mes)
  const today = new Date();
  const [calView, setCalView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  // 'start' | 'end' — qué fecha se está seleccionando
  const [selectingDate, setSelectingDate] = useState('start');

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const [rendiciones, setRendiciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRendiciones = async (filtrosAdicionales = {}) => {
    setLoading(true);
    try {
      const data = await apiService.getRendicionesFiltros({ ...filtros, ...filtrosAdicionales });
      setRendiciones(data || []);
    } catch (error) {
      console.error('Error fetching aprobaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    apiService.getRendiciones().then(data => {
      setRendiciones(data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSearch = () => {
    fetchRendiciones();
  };

  const handleClear = () => {
    const emptyFilters = { usuario: '', fechaInicio: '', fechaFin: '', tipoDoc: '', tipoGasto: '' };
    setFiltros(emptyFilters);
    fetchRendiciones(emptyFilters);
    setShowDatePicker(false);
  };

  const handleAprobarRapido = async (id) => {
    if (!window.confirm('¿Está seguro de aprobar esta rendición rápidamente?')) return;
    try {
      await apiService.actualizarEstadoRendicion(id, 'Aprobado', '');
      fetchRendiciones();
    } catch (error) {
      alert('Error al aprobar: ' + (error.response?.data?.msg || error.message));
    }
  };

  const verDetalle = (id) => {
    navigate(`/aprobaciones/${id}`);
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Aprobado': return <Badge variant="success">Aprobado</Badge>;
      case 'Pendiente': return <Badge variant="warning">Pendiente</Badge>;
      case 'Rechazado': return <Badge variant="danger">Rechazado</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const getSunatStatus = (status) => {
    if (status === true || status === 'Válido' || status === '1') return <span className="text-success flex items-center gap-1"><Check size={14} /> Válido</span>;
    if (status === false || status === 'Error' || status === '0') return <span className="text-danger flex items-center gap-1"><X size={14} /> Error</span>;
    return <span className="text-secondary">{status}</span>;
  };

  const displayRendiciones = rendiciones.filter(r => activeTab === 'Todos' || r.estado === activeTab);

  // ─── Calendario helpers ────────────────────────────────────────────────────
  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAY_LABELS = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1; // Lunes = 0
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-PE');
  };

  const handleDayClick = (year, month, day) => {
    const paddedM = String(month + 1).padStart(2, '0');
    const paddedD = String(day).padStart(2, '0');
    const val = `${year}-${paddedM}-${paddedD}`;

    if (selectingDate === 'start') {
      setFiltros(prev => ({ ...prev, fechaInicio: val, fechaFin: '' }));
      setSelectingDate('end');
    } else {
      if (val < filtros.fechaInicio) {
        setFiltros(prev => ({ ...prev, fechaInicio: val, fechaFin: '' }));
        setSelectingDate('end');
      } else {
        setFiltros(prev => ({ ...prev, fechaFin: val }));
        setSelectingDate('start');
        setShowDatePicker(false);
      }
    }
  };

  const isInRange = (year, month, day) => {
    const paddedM = String(month + 1).padStart(2, '0');
    const paddedD = String(day).padStart(2, '0');
    const current = `${year}-${paddedM}-${paddedD}`;
    if (!filtros.fechaInicio || !filtros.fechaFin) return false;
    return current > filtros.fechaInicio && current < filtros.fechaFin;
  };

  const isSelected = (year, month, day) => {
    const paddedM = String(month + 1).padStart(2, '0');
    const paddedD = String(day).padStart(2, '0');
    const current = `${year}-${paddedM}-${paddedD}`;
    return current === filtros.fechaInicio || current === filtros.fechaFin;
  };

  const renderCalendar = () => {
    const { year, month } = calView;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div className="date-picker-dropdown">
        <div className="cal-header">
          <button className="cal-nav" onClick={() => {
            setCalView(v => {
              const m = v.month === 0 ? 11 : v.month - 1;
              const y = v.month === 0 ? v.year - 1 : v.year;
              return { year: y, month: m };
            });
          }}>‹</button>
          <span className="cal-title">{MONTH_NAMES[month]} {year}</span>
          <button className="cal-nav" onClick={() => {
            setCalView(v => {
              const m = v.month === 11 ? 0 : v.month + 1;
              const y = v.month === 11 ? v.year + 1 : v.year;
              return { year: y, month: m };
            });
          }}>›</button>
        </div>
        <div className="cal-hint">
          {selectingDate === 'start' ? 'Selecciona fecha de inicio' : 'Selecciona fecha de fin'}
        </div>
        <div className="cal-grid">
          {DAY_LABELS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
          {cells.map((day, i) => (
            <div
              key={i}
              className={`cal-day ${!day ? 'cal-empty' : ''} ${day && isSelected(year, month, day) ? 'cal-selected' : ''} ${day && isInRange(year, month, day) ? 'cal-in-range' : ''}`}
              onClick={() => day && handleDayClick(year, month, day)}
            >
              {day || ''}
            </div>
          ))}
        </div>
        <div className="cal-footer">
          <span className="cal-range-label">
            {filtros.fechaInicio ? formatDate(filtros.fechaInicio) : '--'} → {filtros.fechaFin ? formatDate(filtros.fechaFin) : '--'}
          </span>
          <button className="cal-clear-btn" onClick={() => {
            setFiltros(prev => ({ ...prev, fechaInicio: '', fechaFin: '' }));
            setSelectingDate('start');
          }}>Limpiar</button>
        </div>
      </div>
    );
  };

  const dateDisplayValue = filtros.fechaInicio
    ? `${formatDate(filtros.fechaInicio)}${filtros.fechaFin ? ` → ${formatDate(filtros.fechaFin)}` : ' → ...'}`
    : '';

  return (
    <div className="aprobaciones-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bandeja de Aprobación</h1>
          <p className="page-subtitle">Gestiona las solicitudes de gastos pendientes y verifica su cumplimiento fiscal.</p>
        </div>
      </div>

      <Card className="filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Buscar por usuario</label>
            <div className="input-with-icon">
              <Search size={16} className="input-icon" />
              <input type="text" name="usuario" value={filtros.usuario} onChange={handleFiltroChange} placeholder="Nombre del empleado" className="filter-input" />
            </div>
          </div>

          {/* ── Date range picker ── */}
          <div className="filter-group" style={{ position: 'relative' }}>
            <label>Rango de fechas</label>
            <div className="input-with-icon">
              <Calendar size={16} className="input-icon" />
              <input
                type="text"
                readOnly
                value={dateDisplayValue}
                placeholder="Seleccionar rango..."
                className="filter-input"
                style={{ cursor: 'pointer' }}
                onClick={() => { setShowDatePicker(v => !v); setSelectingDate('start'); }}
              />
            </div>
            {showDatePicker && renderCalendar()}
          </div>

          <div className="filter-group">
            <label>Tipo de Documento</label>
            <div className="input-with-icon">
              <Filter size={16} className="input-icon" />
              <select name="tipoDoc" value={filtros.tipoDoc} onChange={handleFiltroChange} className="filter-select">
                <option value="">Todos</option>
                <option value="01">Factura</option>
                <option value="03">Boleta</option>
                <option value="04">Liquidación</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label>Tipo de Gastos</label>
            <div className="input-with-icon">
              <Filter size={16} className="input-icon" />
              <select name="tipoGasto" value={filtros.tipoGasto} onChange={handleFiltroChange} className="filter-select">
                <option value="">Todos</option>
                <option value="01">Combustible</option>
                <option value="02">Alimentacion</option>
                <option value="03">Peaje</option>
                <option value="04">Hospedaje</option>
                <option value="05">Mantenimiento</option>
                <option value="06">Otros</option>
              </select>
            </div>
          </div>

          <div className="filter-group" style={{ alignItems: 'flex-start' }}>
            <label>&nbsp;</label>
            <Button variant="primary" onClick={handleSearch} icon={<Search size={16} />}>Buscar</Button>
          </div>
        </div>

        <div className="tabs-row">
          <div className="status-tabs">
            {['Todos', 'Pendiente', 'Aprobado', 'Rechazado'].map(tab => (
              <button
                key={tab}
                className={`status-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="clear-filters text-primary text-sm font-medium" onClick={handleClear}>Limpiar filtros</button>
        </div>

        <div className="table-responsive">
          <table className="ui-table approvals-table">
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>FECHA</th>
                <th>TIPO DE DOCUMENTO</th>
                <th>MONTO (S/)</th>
                <th>ESTADO</th>
                <th>VALIDACIÓN SUNAT</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="text-center py-4 text-secondary">Cargando...</td></tr> :
                displayRendiciones.length > 0 ? displayRendiciones.map((item) => (
                  <tr key={item.rendicionID}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-sm"></div>
                        <div>
                          <div className="font-medium text-primary">{item.nombreCompleto || 'Usuario'}</div>
                          <div className="text-xs text-secondary">{item.correo || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{new Date(item.fechaEmision).toLocaleDateString()}</td>
                    <td>{item.tipoDocumento || 'ND'}</td>
                    <td className="font-semibold">S/ {item.monto}</td>
                    <td>{getEstadoBadge(item.estado)}</td>
                    <td>{getSunatStatus(item.sunatValido)}</td>
                    <td>
                      <div className="actions-cell">
                        {/* Botón Ver detalle: siempre visible */}
                        <button className="action-icon-btn" onClick={() => verDetalle(item.rendicionID)} title="Ver detalle">
                          <Eye size={18} />
                        </button>
                        {/* Aprobar rápido: solo para pendientes */}
                        {item.estado === 'Pendiente' && (
                          <button className="action-icon-btn success" onClick={() => handleAprobarRapido(item.rendicionID)} title="Aprobar rápido">
                            <Check size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="7" className="text-center py-4 text-secondary">No se encontraron resultados</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="pagination-footer">
          <span className="text-sm text-secondary">Mostrando {displayRendiciones.length} registros</span>
          <div className="pagination-controls">
            <button className="page-btn">&lt;</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">&gt;</button>
          </div>
        </div>
      </Card>

      {/* Overlay para cerrar el date picker */}
      {showDatePicker && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 98 }}
          onClick={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
};

export default Aprobaciones;
