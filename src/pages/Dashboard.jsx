import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Search,
  Eye,
  X,
  FileText
} from 'lucide-react';
import './Dashboard.css';

const getEstadoBadge = (estado) => {
  switch (estado) {
    case 'Aprobado': return <Badge variant="success">Aprobado</Badge>;
    case 'Pendiente': return <Badge variant="warning">Pendiente</Badge>;
    case 'Rechazado': return <Badge variant="danger">Rechazado</Badge>;
    default: return <Badge>{estado || 'Pendiente'}</Badge>;
  }
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Colores por estado
const CHART_COLORS = {
  Todos: 'var(--color-primary)',
  Aprobado: '#16a34a',
  Pendiente: '#d97706',
  Rechazado: '#dc2626',
};

const CHART_ESTADOS = ['Todos', 'Aprobado', 'Pendiente', 'Rechazado'];

const Dashboard = () => {
  const { isAdmin, isColaborador, user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedChartEstado, setSelectedChartEstado] = useState('Todos');
  const [rendiciones, setRendiciones] = useState([]);
  const [ordenesPago, setOrdenesPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para detalle de comprobante (Colaborador)
  const [modalDetalle, setModalDetalle] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const anio = new Date().getFullYear();
        const mes = parseInt(selectedMonth, 10);

        if (isColaborador) {
          // Endpoint exclusivo para colaboradores
          const dataClaim = await apiService.getAprobacionesPorUsuarioClaim();
          setRendiciones(Array.isArray(dataClaim) ? dataClaim : []);
          setOrdenesPago([]);
        } else if (isAdmin) {
          const [dataRendiciones, dataOrdenes] = await Promise.all([
            apiService.getRendicionesMes(mes, anio).catch(() => []),
            apiService.getOrdenesInternas().catch(() => [])
          ]);
          setRendiciones(dataRendiciones || []);
          setOrdenesPago(dataOrdenes || []);
        } else {
          const departamento = user?.departamento;
          if (!departamento) {
            setLoading(false);
            return;
          }
          const [dataRendiciones, dataOrdenes] = await Promise.all([
            apiService.getRendicionesMesPorDepartamento(departamento, mes, anio).catch(() => []),
            apiService.getOrdenesInternasPorDepartamento(departamento).catch(() => [])
          ]);
          setRendiciones(dataRendiciones || []);
          setOrdenesPago(dataOrdenes || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, isAdmin, isColaborador, user?.departamento]);

  // Si es colaborador y trae todas sus rendiciones, filtrar por el mes seleccionado para KPIs y Gráfico
  const rendicionesPeriodo = isColaborador
    ? rendiciones.filter(r => {
        const rawFecha = r.fecha_Registro || r.fechaEmision || r.fecha_Emision || r.fecha;
        if (!rawFecha) return true;
        const d = new Date(rawFecha);
        return !isNaN(d.getTime()) ? (d.getMonth() + 1) === parseInt(selectedMonth, 10) : true;
      })
    : rendiciones;

  // Calcular KPIs
  const pendientes = rendicionesPeriodo.filter(r => r.estado === 'Pendiente').length;
  const rechazados = rendicionesPeriodo.filter(r => r.estado === 'Rechazado').length;
  const aprobados = rendicionesPeriodo.filter(r => r.estado === 'Aprobado').length;
  const totalRendido = rendicionesPeriodo.reduce((sum, r) => sum + (Number(r.monto || r.importe) || 0), 0);

  // Construir datos por día para el gráfico
  const buildDailyChartData = (estadoFiltro) => {
    const anio = new Date().getFullYear();
    const mesIndex = parseInt(selectedMonth, 10) - 1;
    const diasEnMes = new Date(anio, mesIndex + 1, 0).getDate();

    const fuente = estadoFiltro === 'Todos'
      ? rendicionesPeriodo
      : rendicionesPeriodo.filter(r => r.estado === estadoFiltro);

    const mapaGastos = {};
    fuente.forEach(r => {
      const rawFecha = r.fecha_Registro || r.fechaEmision || r.fecha_Emision || r.fecha;
      const fecha = rawFecha ? new Date(rawFecha) : null;
      if (fecha && !isNaN(fecha.getTime())) {
        const dia = fecha.getDate();
        mapaGastos[dia] = (mapaGastos[dia] || 0) + (Number(r.monto || r.importe) || 0);
      }
    });

    const data = [];
    for (let d = 1; d <= diasEnMes; d++) {
      data.push({ name: `${d}`, gastos: mapaGastos[d] || 0 });
    }
    return data;
  };

  const chartData = buildDailyChartData(selectedChartEstado);
  const chartColor = CHART_COLORS[selectedChartEstado];
  const mesNombre = MONTH_NAMES[parseInt(selectedMonth, 10) - 1];

  // Conteo por estado para los pills
  const conteoEstado = {
    Todos: rendicionesPeriodo.length,
    Aprobado: aprobados,
    Pendiente: pendientes,
    Rechazado: rechazados,
  };

  // Lista de comprobantes para la tabla
  const dataTabla = isColaborador ? rendiciones : rendicionesPeriodo;

  const listaFiltrada = [...dataTabla]
    .filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const serie = (item.serieCorrelativo || '').toLowerCase();
      const razon = (item.razon || item.descripcion || '').toLowerCase();
      const tipo = (item.tipoDocumento || '').toLowerCase();
      const id = (item.rendicionID || item.id || item.aprobacionID || '').toString();
      const emp = (item.nombreCompleto || item.nombreUsuario || '').toLowerCase();
      return serie.includes(q) || razon.includes(q) || tipo.includes(q) || id.includes(q) || emp.includes(q);
    })
    .sort((a, b) => new Date(b.fecha_Registro || b.fechaEmision || b.fecha || 0) - new Date(a.fecha_Registro || a.fechaEmision || a.fecha || 0));

  // Últimas Órdenes de Pago (Solo para Admin / Evaluadores)
  const ultimasOrdenesApi = [...ordenesPago]
    .sort((a, b) => new Date(b.fecha || b.fecha_Registro || b.fechaRegistro || 0) - new Date(a.fecha || a.fecha_Registro || a.fechaRegistro || 0))
    .slice(0, 4);

  return (
    <div className="dashboard-page">
      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isColaborador ? 'Mi Resumen de Gastos' : 'Resumen de Gestión de Gastos'}
          </h1>
          <p className="page-subtitle">
            {isColaborador
              ? 'Seguimiento y estado de mis comprobantes y rendiciones registradas'
              : 'Visión general del estado de reembolsos de la empresa'}
          </p>
        </div>
        <div className="header-actions">
          <select
            className="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {MONTH_NAMES.map((m, idx) => {
              const val = (idx + 1).toString().padStart(2, '0');
              return <option key={val} value={val}>{m}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="kpi-grid">
        <Card className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pendientes de aprobación</span>
            <ClipboardList className="kpi-icon text-primary" size={20} />
          </div>
          <div className="kpi-value">{loading ? '...' : pendientes}</div>
        </Card>

        <Card className="kpi-card border-warning">
          <div className="kpi-header">
            <span className="kpi-title">Gastos rechazados</span>
            <AlertTriangle className="kpi-icon text-warning" size={20} />
          </div>
          <div className="kpi-value">{loading ? '...' : rechazados}</div>
        </Card>

        <Card className="kpi-card border-success">
          <div className="kpi-header">
            <span className="kpi-title">Gastos aprobados</span>
            <CheckCircle className="kpi-icon text-success" size={20} />
          </div>
          <div className="kpi-value">{loading ? '...' : aprobados}</div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">{isColaborador ? 'Total registrado' : 'Total rendido'}</span>
            <DollarSign className="kpi-icon text-primary" size={20} />
          </div>
          <div className="kpi-value">S/ {loading ? '...' : totalRendido.toFixed(2)}</div>
          <div className="kpi-footer text-secondary">En el periodo de {mesNombre}</div>
        </Card>
      </div>

      {/* Sección Central de Gráfico y Actividad */}
      <div className={`dashboard-grid ${isColaborador ? 'colaborador-grid' : ''}`}>
        {/* Gráfico de Gastos por Día */}
        <Card className="chart-card">
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>Gastos por Día — {mesNombre}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                {conteoEstado[selectedChartEstado]} comprobante{conteoEstado[selectedChartEstado] !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Selector de estado (Pills) */}
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {CHART_ESTADOS.map(est => {
                const active = selectedChartEstado === est;
                const col = CHART_COLORS[est];
                return (
                  <button
                    key={est}
                    onClick={() => setSelectedChartEstado(est)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1.5px solid ${active ? col : 'var(--color-border)'}`,
                      background: active ? col : 'transparent',
                      color: active ? '#fff' : 'var(--color-text-secondary)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {est}
                    <span style={{
                      marginLeft: '0.35rem',
                      background: active ? 'rgba(255,255,255,0.25)' : 'var(--color-border)',
                      color: active ? '#fff' : 'var(--color-text-secondary)',
                      borderRadius: '999px',
                      padding: '0 0.35rem',
                      fontSize: '0.7rem',
                    }}>
                      {conteoEstado[est]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="chart-container">
            {loading ? (
              <p className="text-secondary text-sm" style={{ textAlign: 'center', padding: '4rem 0' }}>Cargando datos...</p>
            ) : chartData.every(d => d.gastos === 0) ? (
              <p className="text-secondary text-sm" style={{ textAlign: 'center', padding: '4rem 0' }}>
                Sin gastos {selectedChartEstado !== 'Todos' ? `"${selectedChartEstado}s"` : ''} registrados en {mesNombre}.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    interval={chartData.length > 20 ? 2 : 0}
                  />
                  <YAxis
                    tickFormatter={(value) => `S/ ${value}`}
                    width={80}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    formatter={(value) => [`S/ ${value.toFixed(2)}`, selectedChartEstado === 'Todos' ? 'Total' : selectedChartEstado]}
                    labelFormatter={(label) => `Día ${label} — ${mesNombre}`}
                    contentStyle={{ borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                  />
                  <Bar dataKey="gastos" fill={chartColor} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Solo para Admin / Evaluadores: Tarjeta de Órdenes de Pago */}
        {!isColaborador && (
          <Card className="activity-card">
            <div className="card-header">
              <h3>Órdenes de Pago</h3>
              <Link to="/aprobaciones" className="text-primary text-sm font-medium">Ver todo</Link>
            </div>
            <div className="activity-list">
              {loading ? (
                <p className="text-secondary text-sm">Cargando...</p>
              ) : ultimasOrdenesApi.length > 0 ? (
                ultimasOrdenesApi.map((item, idx) => (
                  <div key={idx} className="activity-item">
                    <div className="activity-icon-container">
                      <ClipboardList size={16} />
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">{item.beneficiario || item.nombreUsuario || 'Usuario'}</div>
                      <div className="activity-desc">
                        Monto: S/ {item.importeFinal ?? item.importe ?? '0.00'} - {item.fecha || (item.fecha_Registro ? new Date(item.fecha_Registro).toLocaleDateString() : '')}
                      </div>
                    </div>
                    <div className="activity-status">
                      {getEstadoBadge(item.estado || 'Pendiente')}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-secondary text-sm">No hay órdenes de pago recientes.</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Tabla Inferior: Para Colaborador se titula "Actividad Reciente", para otros "Últimas Solicitudes" */}
      <Card className="table-card mt-6">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <h3>{isColaborador ? 'Actividad Reciente' : 'Últimas Solicitudes'}</h3>
          <div className="table-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={isColaborador ? "Buscar comprobante o serie..." : "Buscar solicitud..."}
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            </div>
            {isColaborador && (
              <Link to="/carga-masiva">
                <Button variant="primary" size="sm">
                  + Nuevo Gasto
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="ui-table">
            <thead>
              <tr>
                <th>ID</th>
                {isColaborador ? (
                  <>
                    <th>COMPROBANTE</th>
                    <th>CONCEPTO / DESCRIPCIÓN</th>
                  </>
                ) : (
                  <>
                    <th>EMPLEADO</th>
                    <th>CONCEPTO</th>
                  </>
                )}
                <th>FECHA</th>
                <th>MONTO</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4 text-secondary">Cargando...</td></tr>
              ) : listaFiltrada.length > 0 ? (
                listaFiltrada.slice(0, 10).map((item, idx) => {
                  const idDoc = item.rendicionID || item.id || item.aprobacionID || idx + 1;
                  const fechaStr = item.fecha_Registro || item.fechaEmision || item.fecha;
                  const fechaFormat = fechaStr ? new Date(fechaStr).toLocaleDateString() : '—';
                  const montoFormat = Number(item.monto || item.importe || 0).toFixed(2);

                  return (
                    <tr key={idDoc || idx}>
                      <td className="font-medium text-secondary">#{idDoc}</td>

                      {isColaborador ? (
                        <>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {item.tipoDocumento || 'Comprobante'} {item.serieCorrelativo ? `(${item.serieCorrelativo})` : ''}
                            </div>
                            {item.ruc_Proveedor && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                RUC: {item.ruc_Proveedor}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.descripcion || item.razon || 'Rendición de Gastos'}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar-sm"></div>
                              <span>{item.nombreCompleto || item.nombreUsuario || `Usuario #${item.userId}`}</span>
                            </div>
                          </td>
                          <td>{item.razon || item.descripcion || 'Rendición de Gastos'}</td>
                        </>
                      )}

                      <td>{fechaFormat}</td>
                      <td className="font-semibold">S/ {montoFormat}</td>
                      <td>{getEstadoBadge(item.estado)}</td>
                      <td>
                        {isColaborador ? (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye size={14} />}
                            onClick={() => setModalDetalle(item)}
                          >
                            Ver
                          </Button>
                        ) : (
                          <Link to={`/aprobaciones/${idDoc}`} className="text-primary hover:underline text-sm font-medium">
                            Revisar
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-secondary">
                    {isColaborador ? 'No tienes comprobantes registrados aún.' : 'No hay solicitudes recientes'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Detalle de Gasto para Colaborador */}
      {modalDetalle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem'
          }}
          onClick={() => setModalDetalle(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '540px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Detalle del Gasto #{modalDetalle.rendicionID || modalDetalle.id}</h3>
              </div>
              <button
                onClick={() => setModalDetalle(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Tipo Documento</span>
                <div style={{ fontWeight: 600 }}>{modalDetalle.tipoDocumento || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Serie - Correlativo</span>
                <div style={{ fontWeight: 600 }}>{modalDetalle.serieCorrelativo || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>RUC / Proveedor</span>
                <div>{modalDetalle.ruc_Proveedor || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Fecha</span>
                <div>{modalDetalle.fechaEmision || modalDetalle.fecha_Registro ? new Date(modalDetalle.fechaEmision || modalDetalle.fecha_Registro).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Monto</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  S/ {Number(modalDetalle.monto || modalDetalle.importe || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Estado</span>
                <div>{getEstadoBadge(modalDetalle.estado)}</div>
              </div>

              {modalDetalle.cCosto && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Centro de Costo</span>
                  <div>{modalDetalle.cCosto}</div>
                </div>
              )}

              {modalDetalle.aprobadorNombre && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Aprobador</span>
                  <div>{modalDetalle.aprobadorNombre}</div>
                </div>
              )}

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Descripción / Concepto</span>
                <div style={{ marginTop: '0.25rem', color: 'var(--color-text-primary)' }}>
                  {modalDetalle.descripcion || modalDetalle.razon || '—'}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" size="sm" onClick={() => setModalDetalle(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
