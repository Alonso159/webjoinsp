import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Download, TrendingUp, Users, CheckCircle } from 'lucide-react';
import './Reportes.css';

const periodData = [
  { day: '01 Oct', amount: 400 },
  { day: '05 Oct', amount: 1200 },
  { day: '10 Oct', amount: 800 },
  { day: '15 Oct', amount: 2500 },
  { day: '20 Oct', amount: 1800 },
  { day: '25 Oct', amount: 3200 },
  { day: '30 Oct', amount: 2100 },
];

const userTopData = [
  { name: 'Juan Pérez', amount: 4200 },
  { name: 'María Rodriguez', amount: 3150 },
  { name: 'Carlos Diaz', amount: 2800 },
  { name: 'Ana Lopez', amount: 1950 },
  { name: 'Luis Torres', amount: 1200 },
];

const typeData = [
  { name: 'Alimentación', value: 40 },
  { name: 'Transporte', value: 30 },
  { name: 'Alojamiento', value: 20 },
  { name: 'Otros', value: 10 },
];

const COLORS = ['#0066ff', '#3b82f6', '#93c5fd', '#e2e8f0'];

const Reportes = () => {
  return (
    <div className="reportes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes y Estadísticas</h1>
          <p className="page-subtitle">Visión general de gastos corporativos y métricas de reembolso</p>
        </div>
        <div className="header-actions">
          <select className="filter-select period-select">
            <option>Últimos 30 días</option>
            <option>Este Mes</option>
            <option>Mes Anterior</option>
          </select>
          <Button variant="primary" icon={<Download size={16} />}>Exportar Reporte</Button>
        </div>
      </div>

      <div className="metrics-grid">
        <Card className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Gasto Total (PEN)</span>
            <div className="metric-icon success-icon"><TrendingUp size={16}/></div>
          </div>
          <div className="metric-value">S/ 45,230.00</div>
          <div className="metric-footer text-success">+12.5% vs mes anterior</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Solicitudes Aprobadas</span>
            <div className="metric-icon primary-icon"><CheckCircle size={16}/></div>
          </div>
          <div className="metric-value">124</div>
          <div className="metric-footer text-secondary">De 138 solicitudes totales</div>
        </Card>

        <Card className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Promedio por Usuario</span>
            <div className="metric-icon orange-icon"><Users size={16}/></div>
          </div>
          <div className="metric-value">S/ 364.75</div>
          <div className="metric-footer text-secondary">Activos este mes</div>
        </Card>
      </div>

      <Card className="chart-card mb-6">
        <div className="card-header">
          <h3>Gastos por Período</h3>
          <div className="legend-pills">
            <span className="pill approved">Aprobados</span>
            <span className="pill pending">Pendientes</span>
          </div>
        </div>
        <div className="chart-container-large">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={periodData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="var(--color-primary)" strokeWidth={3} dot={{r: 4, fill: 'var(--color-primary)'}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="charts-grid mb-6">
        <Card className="chart-card">
          <div className="card-header">
            <h3>Gastos por Usuario (Top 5)</h3>
            <a href="#" className="text-primary text-sm font-medium">Ver todos</a>
          </div>
          <div className="horizontal-bars">
            {userTopData.map((user, idx) => (
              <div key={idx} className="bar-row">
                <div className="bar-label-group">
                  <span className="bar-name">{user.name}</span>
                  <span className="bar-value">S/ {user.amount}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(user.amount / 4200) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="chart-card pie-card-wrapper">
          <div className="card-header">
            <h3>Gastos por Tipo</h3>
          </div>
          <div className="pie-container flex items-center justify-between">
            <div className="pie-chart-wrapper" style={{ width: '200px', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-center-text">
                <span className="pie-total-label">Total</span>
                <span className="pie-total-value">100%</span>
              </div>
            </div>
            
            <div className="pie-legend">
              {typeData.map((item, idx) => (
                <div key={idx} className="legend-item">
                  <div className="legend-color" style={{backgroundColor: COLORS[idx]}}></div>
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-percent font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reportes;
