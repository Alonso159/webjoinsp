import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Search, Calendar, Filter, Eye, Check, X, Layers, RefreshCw, Lock } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Aprobaciones.css';

const Aprobaciones = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const departamento = user?.departamento;
  const [activeTab, setActiveTab] = useState('Gastos');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedGrupos, setSelectedGrupos] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [selectedGastos, setSelectedGastos] = useState([]);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [detalleGastos, setDetalleGastos] = useState([]);
  const [gruposRendicion, setGruposRendicion] = useState([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [ordenesInternas, setOrdenesInternas] = useState([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);

  const [filtros, setFiltros] = useState({
    usuario: '',
    fechaInicio: '',
    fechaFin: '',
    tipoDoc: '',
    tipoGasto: '',
    tipoAprobacion: ''
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
      let data;
      if (isAdmin) {
        data = await apiService.getRendicionesFiltros({ ...filtros, ...filtrosAdicionales });
      } else {
        if (!departamento) { setLoading(false); return; }
        data = await apiService.getRendicionesFiltrosPorDepartamento(departamento, { ...filtros, ...filtrosAdicionales });
      }
      setRendiciones(data || []);
    } catch (error) {
      console.error('Error fetching aprobaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdenesInternas = async (filtrosAdicionales = {}) => {
    setLoadingOrdenes(true);
    try {
      let data;
      if (isAdmin) {
        data = await apiService.getOrdenesInternasFiltros({ ...filtros, ...filtrosAdicionales });
      } else {
        if (!departamento) { setLoadingOrdenes(false); return; }
        data = await apiService.getOrdenesInternasFiltrosPorDepartamento(departamento, { ...filtros, ...filtrosAdicionales });
      }
      setOrdenesInternas(data || []);
    } catch (error) {
      console.error('Error fetching ordenes internas:', error);
    } finally {
      setLoadingOrdenes(false);
    }
  };



  React.useEffect(() => {
    if (isAdmin) {
      apiService.getRendiciones().then(data => {
        setRendiciones(data || []);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      if (!departamento) { setLoading(false); return; }
      apiService.getRendicionesPorDepartamento(departamento).then(data => {
        setRendiciones(data || []);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [isAdmin, departamento]);

  const handleSearch = () => {
    if (activeTab === 'Gastos') fetchRendiciones();
    if (activeTab === 'Ordenes de Pago') fetchOrdenesInternas();
  };

  const handleSync = () => {
    setSyncing(true);
    if (activeTab === 'Rendiciones') fetchGrupos();
    else if (activeTab === 'Gastos') fetchRendiciones();
    else if (activeTab === 'Ordenes de Pago') fetchOrdenesInternas();

    setTimeout(() => {
      setSyncing(false);
    }, 6000);
  };

  const handleClear = () => {
    const emptyFilters = { usuario: '', fechaInicio: '', fechaFin: '', tipoDoc: '', tipoGasto: '', tipoAprobacion: '' };
    setFiltros(emptyFilters);
    if (activeTab === 'Gastos') fetchRendiciones(emptyFilters);
    if (activeTab === 'Ordenes de Pago') fetchOrdenesInternas(emptyFilters);
    setShowDatePicker(false);
  };

  const handleAprobarRapido = async (id) => {
    if (!window.confirm('¿Está seguro de aprobar esta rendición rápidamente?')) return;
    try {
      const aprobadorId = user?.doi || user?.DOI || user?.identifier || user?.id;
      await apiService.actualizarEstadoRendicion(id, 'Aprobado', '', aprobadorId);
      fetchRendiciones();
    } catch (error) {
      alert('Error al aprobar: ' + (error.response?.data?.msg || error.message));
    }
  };

  const verDetalle = (id) => {
    navigate(`/aprobaciones/${id}`);
  };

  const verDetalleOrdenInterna = (id) => {
    navigate(`/ordenes-de-pago/${id}`);
  };

  const handleAprobarRapidoOrdenInterna = async (id) => {
    if (!window.confirm('¿Está seguro de aprobar esta orden de pago rápidamente?')) return;
    try {
      await apiService.actualizarEstadoOrdenInterna(id, 'Aprobado', '');
      fetchOrdenesInternas();
    } catch (error) {
      alert('Error al aprobar: ' + (error.response?.data?.msg || error.message));
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Aprobado': return <Badge variant="success">Aprobado</Badge>;
      case 'Pendiente': return <Badge variant="warning">Pendiente</Badge>;
      case 'Rechazado': return <Badge variant="danger">Rechazado</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const getSunatStatus = (status, mensaje) => {
    if (status === true || status === 'Válido' || status === '1') {
      return <span className="text-success flex items-center gap-1"><Check size={14} /> Válido</span>;
    }
    if (mensaje && mensaje.trim().length > 0) {
      return <span className="text-danger flex items-center gap-1"><X size={14} /> Error</span>;
    }
    if (status === 'Error') {
      return <span className="text-danger flex items-center gap-1"><X size={14} /> Error</span>;
    }
    return <span className="text-secondary" style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No validado</span>;
  };

  const displayRendiciones = rendiciones; // Ya no filtramos por activeTab porque ahora son vistas separadas

  const handleSelectGasto = (id) => {
    setSelectedGastos(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllGastos = (e) => {
    if (e.target.checked) {
      setSelectedGastos(displayRendiciones.map(r => r.rendicionID));
    } else {
      setSelectedGastos([]);
    }
  };

  const handleAgruparGastos = async () => {
    if (selectedGastos.length === 0) {
      alert('Seleccione al menos un gasto para agrupar.');
      return;
    }
    // Verificar que ninguno ya tiene grupo asignado
    const yaAgrupados = displayRendiciones.filter(
      r => selectedGastos.includes(r.rendicionID) && r.rendicionGrupoID == true
    );
    if (yaAgrupados.length > 0) {
      alert(`${yaAgrupados.length} gasto(s) seleccionados ya pertenecen a una rendición. Deseléccionalos para continuar.`);
      return;
    }
    if (!window.confirm(`¿Está seguro de agrupar ${selectedGastos.length} gasto(s) en una nueva Rendición?`)) return;

    let nuevoGrupoId = null;
    try {
      const responseGrupo = await apiService.crearRendicionGrupo(
        selectedGastos,
        user?.doi || user?.DOI || user?.identifier || "",
        user?.id || 0
      );
      nuevoGrupoId = responseGrupo?.rendicionGrupoID || responseGrupo?.RendicionGrupoID || responseGrupo?.id;
      alert('Rendición creada exitosamente.');
      setSelectedGastos([]);
      fetchRendiciones({ usuario: '', fechaInicio: '', fechaFin: '', tipoDoc: '', tipoGasto: '', tipoAprobacion: '' });
    } catch (error) {
      // Rollback: eliminar el grupo recién creado si alguna asignación falló
      if (nuevoGrupoId) {
        try {
          await apiService.eliminarGrupoRendicion(nuevoGrupoId);
        } catch (delErr) {
          console.error('Error al hacer rollback del grupo:', delErr);
        }
      }
      alert('No se pudo agrupar los gastos, verifique que no pertenezcan a otra rendición.');
    }
  };

  const fetchGrupos = async () => {
    setLoadingGrupos(true);
    try {
      let data;
      if (isAdmin) {
        data = await apiService.getGruposRendicion();
      } else {
        if (!departamento) { setLoadingGrupos(false); return; }
        data = await apiService.getGruposRendicionPorDepartamento(departamento);
      }
      setGruposRendicion(data || []);
    } catch (error) {
      console.error('Error fetching grupos:', error);
    } finally {
      setLoadingGrupos(false);
    }
  };

  React.useEffect(() => {
    // Limpiar filtros al cambiar de pestaña
    setFiltros({ usuario: '', fechaInicio: '', fechaFin: '', tipoDoc: '', tipoGasto: '', tipoAprobacion: '' });
    setSelectedGastos([]);

    if (activeTab === 'Rendiciones') {
      fetchGrupos();
    } else if (activeTab === 'Gastos') {
      fetchRendiciones({ usuario: '', fechaInicio: '', fechaFin: '', tipoDoc: '', tipoGasto: '', tipoAprobacion: '' });
    } else if (activeTab === 'Ordenes de Pago') {
      fetchOrdenesInternas({ usuario: '', fechaInicio: '', fechaFin: '', tipoDoc: '', tipoGasto: '', tipoAprobacion: '' });
    }
  }, [activeTab]);

  const handleVerDetalleGrupo = (grupo) => {
    navigate(`/rendiciones/${grupo.rendicionID || grupo.rendicionGrupoID}`);
  };

  const handleCerrarRendicion = async () => { }; // Manejado en la página de detalle

  // ─── Calendario helpers ────────────────────────────────────────────────────
  const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Bandeja de Aprobación</h1>
          <p className="page-subtitle">Gestiona las solicitudes de gastos pendientes y verifica su cumplimiento fiscal.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={handleSync} disabled={syncing} icon={<RefreshCw size={16} className={syncing ? 'spin' : ''} />}>
            {syncing ? 'Sincronizando...' : 'Sincronizar Gastos'}
          </Button>
          {activeTab === 'Gastos' && (
            <Button variant="primary" onClick={handleAgruparGastos} icon={<Layers size={16} />}>Agrupar gastos</Button>
          )}
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

          <div className="filter-group">
            <label>Tipo Aprobación</label>
            <div className="input-with-icon">
              <Filter size={16} className="input-icon" />
              <select name="tipoAprobacion" value={filtros.tipoAprobacion} onChange={handleFiltroChange} className="filter-select">
                <option value="">Todos</option>
                <option value="false">Gasto</option>
                <option value="true">Orden de Pago</option>
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
            {['Gastos', 'Rendiciones', 'Ordenes de Pago'].map(tab => (
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

        {activeTab === 'Gastos' && (
          <div className="table-responsive">
            <table className="ui-table approvals-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}></th>
                  <th>USUARIO</th>
                  <th>FECHA DE SUBIDA</th>
                  <th>FECHA DEL RECIBO</th>
                  <th>TIPO DE DOCUMENTO</th>
                  <th>MONTO (S/)</th>
                  <th>ESTADO</th>
                  <th>VALIDACIÓN SUNAT</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="8" className="text-center py-4 text-secondary">Cargando...</td></tr> :
                  displayRendiciones.length > 0 ? displayRendiciones.map((item) => (
                    <tr key={item.aprobacionID || item.rendicionID} className={selectedGastos.includes(item.aprobacionID || item.rendicionID) ? 'selected-row' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedGastos.includes(item.aprobacionID || item.rendicionID)}
                          onChange={() => handleSelectGasto(item.aprobacionID || item.rendicionID)}
                          disabled={item.rendicionGrupoID == true}
                          title={item.rendicionGrupoID == false ? 'Este gasto ya pertenece a una rendición' : ''}
                          style={item.rendicionGrupoID == true ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        />
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-sm"></div>
                          <div>
                            <div className="font-medium text-primary">{item.nombreCompleto || item.nombreUsuario || 'Usuario'}</div>
                            <div className="text-xs text-secondary">{item.correo || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>{item.fecha_Registro || item.fechaRegistro ? new Date(item.fecha_Registro || item.fechaRegistro).toLocaleDateString() : '—'}</td>
                      <td>{item.fechaEmision ? new Date(item.fechaEmision).toLocaleDateString() : '—'}</td>
                      <td>{item.tipoDocumento || 'ND'}</td>
                      <td className="font-semibold">S/ {item.monto}</td>
                      <td>{getEstadoBadge(item.estado)}</td>
                      <td>{getSunatStatus(item.sunatValido, item.sunatMensaje)}</td>
                      <td>
                        <div className="actions-cell">
                          <button className="action-icon-btn" onClick={() => verDetalle(item.aprobacionID || item.rendicionID)} title="Ver detalle">
                            <Eye size={18} />
                          </button>
                          {item.estado === 'Pendiente' && (
                            <button className="action-icon-btn success" onClick={() => handleAprobarRapido(item.aprobacionID || item.rendicionID)} title="Aprobar rápido">
                              <Check size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="8" className="text-center py-4 text-secondary">No se encontraron resultados</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'Rendiciones' && (
          <div className="table-responsive">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>ID RENDICIÓN</th>
                  <th>FECHA REGISTRO</th>
                  <th>ESTADO</th>
                  <th>SOLICITUD CIERRE</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loadingGrupos ? <tr><td colSpan="5" className="text-center py-4 text-secondary">Cargando rendiciones...</td></tr> :
                  gruposRendicion.length > 0 ? gruposRendicion.map((grupo) => {
                    const solicitudCierre = grupo.solicitudCierre === true || grupo.solicitudCierre === 1;
                    const estadoCerrado = grupo.estado === true || grupo.estado === 1;
                    return (
                      <tr key={grupo.rendicionID || grupo.rendicionGrupoID}>
                        <td className="font-medium">#{grupo.rendicionID || grupo.rendicionGrupoID}</td>
                        <td>{new Date(grupo.fechaRegistro || grupo.fecha_Registro).toLocaleDateString()}</td>
                        <td><Badge variant={estadoCerrado ? 'success' : 'warning'}>{estadoCerrado ? 'Cerrada' : 'Abierta'}</Badge></td>
                        <td>{solicitudCierre ? <Badge variant="primary">Solicitado</Badge> : <Badge variant="secondary">No</Badge>}</td>
                        <td>
                          <div className="actions-cell">
                            <button className="action-icon-btn" onClick={() => handleVerDetalleGrupo(grupo)} title="Ver detalle">
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan="5" className="text-center py-4 text-secondary">No hay rendiciones agrupadas.</td></tr>
                }
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 'Ordenes de Pago' && (
          <div className="table-responsive">
            <table className="ui-table approvals-table">
              <thead>
                <tr>
                  <th>N° DOC</th>
                  <th>BENEFICIARIO</th>
                  <th>TIPO DE FORMULARIO</th>
                  <th>FECHA</th>
                  <th>CÓDIGO</th>
                  <th>GERENCIA</th>
                  <th>CRP</th>
                  <th>IMPORTE (S/)</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loadingOrdenes ? <tr><td colSpan="10" className="text-center py-4 text-secondary">Cargando...</td></tr> :
                  ordenesInternas.length > 0 ? ordenesInternas.map((item) => (
                    <tr key={item.id || item.numero_documento}>
                      <td className="font-medium text-secondary">{item.numero_documento || item.id}</td>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-sm"></div>
                          <div>
                            <div className="font-medium text-primary">{item.beneficiario || 'Usuario'}</div>
                          </div>
                        </div>
                      </td>
                      <td>{item.tipoFormulario || '—'}</td>
                      <td>{item.fecha || '—'}</td>
                      <td>{item.codigo || '—'}</td>
                      <td>{item.gerencia || '—'} <span className="text-xs text-secondary block">{item.subgerencia}</span></td>
                      <td>{item.crp || '—'}</td>
                      <td className="font-semibold">S/ {item.importeFinal}</td>
                      <td>{getEstadoBadge(item.estado || 'Pendiente')}</td>
                      <td>
                        <div className="actions-cell">
                          <button className="action-icon-btn" onClick={() => verDetalleOrdenInterna(item.id || item.numero_documento)} title="Ver detalle">
                            <Eye size={18} />
                          </button>
                          {(item.estado === 'Pendiente' || !item.estado) && (
                            <button className="action-icon-btn success" onClick={() => handleAprobarRapidoOrdenInterna(item.id || item.numero_documento)} title="Aprobar rápido">
                              <Check size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="10" className="text-center py-4 text-secondary">No se encontraron resultados</td></tr>}
              </tbody>
            </table>
          </div>
        )}



        <div className="pagination-footer">
          <span className="text-sm text-secondary">Mostrando {activeTab === 'Gastos' ? displayRendiciones.length : activeTab === 'Rendiciones' ? gruposRendicion.length : ordenesInternas.length} registros</span>
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

      {/* Modal de Detalle de Rendición (Grupo) */}
      {showDetalleModal && grupoSeleccionado && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Card style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Detalle de Rendición #{grupoSeleccionado.rendicionID || grupoSeleccionado.rendicionGrupoID}</h2>
              <button onClick={() => setShowDetalleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
              <div>
                <p className="text-xs text-secondary uppercase font-medium">Usuario</p>
                <p className="font-semibold text-primary">{detalleGastos.length > 0 ? (detalleGastos[0].nombreCompleto || `Usuario #${detalleGastos[0].userId}`) : 'Cargando...'}</p>
              </div>
              <div>
                <p className="text-xs text-secondary uppercase font-medium">Monto Total</p>
                <p className="font-semibold text-primary" style={{ fontSize: '1.1rem' }}>S/ {detalleGastos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-secondary uppercase font-medium">Estado</p>
                <p><Badge variant={grupoSeleccionado.estado === 1 ? 'success' : 'warning'}>{grupoSeleccionado.estado === 1 ? 'Aprobado/Cerrado' : 'Abierto'}</Badge></p>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Gastos asociados</h3>
            <table className="ui-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>TIPO</th>
                  <th>RAZÓN</th>
                  <th>MONTO</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {detalleGastos.length > 0 ? detalleGastos.map((gasto) => (
                  <tr key={gasto.aprobacionID || gasto.rendicionID}>
                    <td>{new Date(gasto.fechaEmision || gasto.fecha_Registro).toLocaleDateString()}</td>
                    <td>{gasto.tipoDocumento || 'ND'}</td>
                    <td>{gasto.razon || 'Gasto'}</td>
                    <td className="font-semibold">S/ {gasto.monto}</td>
                    <td>{getEstadoBadge(gasto.estado)}</td>
                  </tr>
                )) : <tr><td colSpan="5" className="text-center py-4 text-secondary">Cargando o sin gastos...</td></tr>}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button variant="outline" onClick={() => setShowDetalleModal(false)}>Cerrar</Button>
              {grupoSeleccionado.solicitudCierre === 1 && grupoSeleccionado.estado !== 1 && (
                <Button variant="primary" onClick={handleCerrarRendicion}>Cerrar Rendición</Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Aprobaciones;
