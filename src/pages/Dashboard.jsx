import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardList, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import './Dashboard.css';

const getEstadoBadge = (estado) => {
  switch (estado) {
    case 'Aprobado': return <Badge variant="success">Aprobado</Badge>;
    case 'Pendiente': return <Badge variant="warning">Pendiente</Badge>;
    case 'Rechazado': return <Badge variant="danger">Rechazado</Badge>;
    default: return <Badge>{estado}</Badge>;
  }
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Colores por estado
const CHART_COLORS = {
  Todos: 'var(--color-primary)',
  Aprobado: '#16a34a',
  Pendiente: '#d97706',
  Rechazado: '#dc2626',
};

const CHART_ESTADOS = ['Todos', 'Aprobado', 'Pendiente', 'Rechazado'];

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedChartEstado, setSelectedChartEstado] = useState('Todos');
  const [rendiciones, setRendiciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const anio = new Date().getFullYear();
        const data = await apiService.getRendicionesMes(parseInt(selectedMonth), anio);
        setRendiciones(data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]);

  // Calcular KPIs — campos en camelCase según JSON de .NET
  // RendicionDTO: estado, monto, fecha_Registro, fechaEmision, rendicionID
  const pendientes = rendiciones.filter(r => r.estado === 'Pendiente').length;
  const rechazados = rendiciones.filter(r => r.estado === 'Rechazado').length;
  const aprobados = rendiciones.filter(r => r.estado === 'Aprobado').length;
  const totalRendido = rendiciones.reduce((sum, r) => sum + (Number(r.monto) || 0), 0);

  // Construir datos por día filtrando por estado seleccionado en el gráfico
  const buildDailyChartData = (estadoFiltro) => {
    const anio = new Date().getFullYear();
    const mesIndex = parseInt(selectedMonth) - 1;
    const diasEnMes = new Date(anio, mesIndex + 1, 0).getDate();

    const fuente = estadoFiltro === 'Todos'
      ? rendiciones
      : rendiciones.filter(r => r.estado === estadoFiltro);

    const mapaGastos = {};
    fuente.forEach(r => {
      const rawFecha = r.fecha_Registro || r.fechaEmision || r.fecha_Emision;
      const fecha = rawFecha ? new Date(rawFecha) : null;
      if (fecha && !isNaN(fecha)) {
        const dia = fecha.getDate();
        mapaGastos[dia] = (mapaGastos[dia] || 0) + (Number(r.monto) || 0);
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
  const mesNombre = MONTH_NAMES[parseInt(selectedMonth) - 1];

  // Conteo por estado para mostrar en los pills
  const conteoEstado = {
    Todos: rendiciones.length,
    Aprobado: aprobados,
    Pendiente: pendientes,
    Rechazado: rechazados,
  };

  // Últimas solicitudes (hasta 4) — ordenadas por fecha_Registro
  const ultimasSolicitudesApi = [...rendiciones]
    .sort((a, b) => new Date(b.fecha_Registro || b.fechaEmision) - new Date(a.fecha_Registro || a.fechaEmision))
    .slice(0, 4);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resumen de Gestión de Gastos</h1>
          <p className="page-subtitle">Visión general del estado de reembolsos de la empresa</p>
        </div>
        <div className="header-actions">
          <select
            className="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
          >
            <option value="01">Enero</option>
            <option value="02">Febrero</option>
            <option value="03">Marzo</option>
            <option value="04">Abril</option>
            <option value="05">Mayo</option>
            <option value="06">Junio</option>
            <option value="07">Julio</option>
            <option value="08">Agosto</option>
            <option value="09">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>
      </div>

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
            <span className="kpi-title">Total rendido</span>
            <DollarSign className="kpi-icon text-primary" size={20} />
          </div>
          <div className="kpi-value">S/ {loading ? '...' : totalRendido.toFixed(2)}</div>
          <div className="kpi-footer text-secondary">En el periodo actual</div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card className="chart-card">
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h3>Gastos por Día — {mesNombre}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                {conteoEstado[selectedChartEstado]} rendición{conteoEstado[selectedChartEstado] !== 1 ? 'es' : ''}
              </span>
            </div>
            {/* Selector de estado */}
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
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    interval={chartData.length > 20 ? 2 : 0}
                  />
                  <YAxis hide />
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

        <Card className="activity-card">
          <div className="card-header">
            <h3>Actividad Reciente</h3>
            <Link to="/aprobaciones" className="text-primary text-sm font-medium">Ver todo</Link>
          </div>
          <div className="activity-list">
            {loading ? <p className="text-secondary text-sm">Cargando...</p> :
              ultimasSolicitudesApi.length > 0 ? ultimasSolicitudesApi.map((item, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-icon-container">
                    <ClipboardList size={16} />
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">{item.nombreCompleto || item.userId || 'Usuario'}</div>
                    <div className="activity-desc">Monto: S/ {item.monto} - {new Date(item.fecha_Registro || item.fechaEmision).toLocaleDateString()}</div>
                  </div>
                  <div className="activity-status">
                    {getEstadoBadge(item.estado)}
                  </div>
                </div>
              )) : <p className="text-secondary text-sm">No hay actividad reciente.</p>}
          </div>
        </Card>
      </div>

      <Card className="table-card mt-6">
        <div className="card-header">
          <h3>Últimas Solicitudes</h3>
          <div className="table-actions">
            <input type="text" placeholder="Buscar solicitud..." className="search-input" />
            <Button variant="outline">Filtros</Button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="ui-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>EMPLEADO</th>
                <th>CONCEPTO</th>
                <th>FECHA</th>
                <th>MONTO</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="text-center py-4 text-secondary">Cargando...</td></tr> :
                ultimasSolicitudesApi.length > 0 ? ultimasSolicitudesApi.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium text-secondary">#{item.rendicionID}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar-sm"></div>
                        <span>{item.nombreCompleto || `Usuario #${item.userId}`}</span>
                      </div>
                    </td>
                    <td>{item.razon || 'Rendición de Gastos'}</td>
                    <td>{new Date(item.fecha_Registro || item.fechaEmision).toLocaleDateString()}</td>
                    <td className="font-semibold">S/ {item.monto}</td>
                    <td>{getEstadoBadge(item.estado)}</td>
                    <td>
                      <Link to={`/aprobaciones/${item.rendicionID}`} className="text-primary hover:underline text-sm font-medium">Revisar</Link>
                    </td>
                  </tr>
                )) : <tr><td colSpan="7" className="text-center py-4 text-secondary">No hay solicitudes recientes</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
