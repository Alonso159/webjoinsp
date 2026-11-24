import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Eye, Loader, DollarSign, FileText, User, Lock, Printer } from 'lucide-react';
import { apiService } from '../services/api';
import logoSerpost from '../assets/serpost.png';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../context/AuthContext';

const getEstadoBadge = (estado) => {
  switch (estado) {
    case 'Aprobado': return <Badge variant="success">Aprobado</Badge>;
    case 'Pendiente': return <Badge variant="warning">Pendiente</Badge>;
    case 'Rechazado': return <Badge variant="danger">Rechazado</Badge>;
    default: return <Badge>{estado}</Badge>;
  }
};

const RendicionGrupoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [grupo, setGrupo] = useState(null);
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [grupoData, gastosData] = await Promise.all([
        apiService.getGrupoPorId(id),
        apiService.getGastosPorGrupo(id),
      ]);
      setGrupo(grupoData);
      setGastos(gastosData || []);
    } catch (error) {
      console.error('Error cargando detalle de rendición:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleCerrarRendicion = async () => {
    if (!window.confirm('¿Está seguro de cerrar esta rendición? Esta acción no se puede deshacer.')) return;
    setCerrando(true);
    try {
      const aprobadorId = user?.doi || user?.DOI || user?.id;
      await apiService.cerrarGrupoRendicion(id, aprobadorId);
      alert('Rendición cerrada exitosamente.');
      fetchData();
    } catch (error) {
      alert('Error al cerrar la rendición: ' + (error.response?.data?.msg || error.message));
    } finally {
      setCerrando(false);
    }
  };

  const gastosAprobados = gastos.filter(g => g.estado === 'Aprobado');
  const totalMonto = gastosAprobados.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  const usuario = gastos.length > 0 ? (gastos[0].nombreCompleto || `Usuario #${gastos[0].userId}`) : '—';

  const handleGenerarPDF = () => {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-PE');
    const hora = now.toLocaleTimeString('es-PE');
    
    const aprobadoPor = gastosAprobados.length > 0 && gastosAprobados[0].aprobadorNombre ? gastosAprobados[0].aprobadorNombre : "—";
    const tipoGasto = gastosAprobados.length > 0 ? (gastosAprobados[0].tipoGastoNombre || 'Rendición de Gastos') : 'Rendición de Gastos';
    const codigo = id;
    const aFavorDe = usuario;
    const gerencia = user?.departamento || '—';
    const subGerencia = "Lima";

    let tableRows = '';
    gastosAprobados.forEach(g => {
      tableRows += `
        <tr>
          <td style="border: 1px solid #000; padding: 0.5rem; text-align: left;">#${g.aprobacionID || g.rendicionID}</td>
          <td style="border: 1px solid #000; padding: 0.5rem; text-align: left;">${g.fechaEmision ? new Date(g.fechaEmision).toLocaleDateString('es-PE') : '—'}</td>
          <td style="border: 1px solid #000; padding: 0.5rem; text-align: left;">${g.tipoDocumento || 'ND'}</td>
          <td style="border: 1px solid #000; padding: 0.5rem; text-align: left;">${g.razon || '—'}</td>
          <td style="border: 1px solid #000; padding: 0.5rem; text-align: right;">S/ ${Number(g.monto).toFixed(2)}</td>
        </tr>
      `;
    });

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 2rem; color: #000; background: white; box-sizing: border-box; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
          <div style="flex: 1; font-size: 0.9rem;">
            <p style="margin: 0.25rem 0;"><strong>Aprobado por:</strong> ${aprobadoPor}</p>
            <p style="margin: 0.25rem 0;"><strong>Fecha:</strong> ${fecha}</p>
            <p style="margin: 0.25rem 0;"><strong>Hora:</strong> ${hora}</p>
            <p style="margin: 0.25rem 0;"><strong>Tipo de Gasto:</strong> ${tipoGasto}</p>
            <p style="margin: 0.25rem 0;"><strong>A favor de:</strong> ${aFavorDe}</p>
            <p style="margin: 0.25rem 0;"><strong>Código:</strong> ${codigo}</p>
            <p style="margin: 0.25rem 0;"><strong>Gerencia:</strong> ${gerencia}</p>
            <p style="margin: 0.25rem 0;"><strong>Sub Gerencia:</strong> ${subGerencia}</p>
          </div>
          <div>
            <img src="${logoSerpost}" alt="Serpost" style="max-width: 150px;" />
          </div>
        </div>
        
        <div style="text-align: center; font-size: 1.25rem; font-weight: bold; margin-bottom: 1.5rem; text-decoration: underline;">
          REPORTE DE RENDICIÓN DE GASTOS
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; font-size: 0.85rem;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 0.5rem; text-align: left; background-color: #f0f0f0;">ID Gasto</th>
              <th style="border: 1px solid #000; padding: 0.5rem; text-align: left; background-color: #f0f0f0;">Fecha Emisión</th>
              <th style="border: 1px solid #000; padding: 0.5rem; text-align: left; background-color: #f0f0f0;">Tipo Doc.</th>
              <th style="border: 1px solid #000; padding: 0.5rem; text-align: left; background-color: #f0f0f0;">Razón</th>
              <th style="border: 1px solid #000; padding: 0.5rem; text-align: right; background-color: #f0f0f0;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr>
              <td colspan="4" style="border: 1px solid #000; padding: 0.5rem; text-align: right; font-weight: bold;">Total Rendición</td>
              <td style="border: 1px solid #000; padding: 0.5rem; text-align: right; font-weight: bold;">S/ ${totalMonto.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="display: flex; justify-content: space-between; margin-top: 5rem; gap: 1rem;">
          <div style="text-align: center; font-size: 0.75rem; flex: 1;">
            <div style="border-top: 1px solid #000; margin-bottom: 0.5rem; width: 100%;"></div>
            Vo Bo Área que Solicitó<br/>el Recibo Provisional
          </div>
          <div style="text-align: center; font-size: 0.75rem; flex: 1;">
            <div style="border-top: 1px solid #000; margin-bottom: 0.5rem; width: 100%;"></div>
            Autorizado Gerente Area<br/>Solicitante
          </div>
          <div style="text-align: center; font-size: 0.75rem; flex: 1;">
            <div style="border-top: 1px solid #000; margin-bottom: 0.5rem; width: 100%;"></div>
            Vo Bo Finanzas<br/>Dpto. Tesoreria
          </div>
          <div style="text-align: center; font-size: 0.75rem; flex: 1;">
            <div style="border-top: 1px solid #000; margin-bottom: 0.5rem; width: 100%;"></div>
            Recibí conforme
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `Rendicion_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)' }}>
        <Loader size={40} />
        <p>Cargando rendición...</p>
      </div>
    );
  }

  const solicitudCierre = grupo?.solicitudCierre === true || grupo?.solicitudCierre === 1;
  const estadoCerrado = grupo?.estado === true || grupo?.estado === 1;

  return (
    <div className="detalle-page">
      {/* Header */}
      <div className="page-header detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/aprobaciones')}
            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.375rem', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Rendición #{id}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Registrada el {grupo?.fechaRegistro ? new Date(grupo.fechaRegistro).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              <strong>Aprobador:</strong> {grupo?.aprobadorNombre || "Todavia no cerrado"} | <strong>Fecha de Cierre:</strong> {grupo?.fechaCierre ? new Date(grupo.fechaCierre).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : "Todavia no cerrado"}
            </p>
          </div>
          <Badge variant={estadoCerrado ? 'success' : 'warning'}>
            {estadoCerrado ? 'Cerrada' : 'Abierta'}
          </Badge>
          {solicitudCierre && !estadoCerrado && (
            <Badge variant="primary">Solicitud de cierre pendiente</Badge>
          )}
        </div>

        {/* Botón Cerrar Rendición — solo si solicitudCierre=1 y aún no está cerrada */}
        {solicitudCierre && !estadoCerrado && (
          <Button
            variant="primary"
            onClick={handleCerrarRendicion}
            disabled={cerrando}
            icon={<Lock size={16} />}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
          >
            {cerrando ? 'Cerrando...' : 'Cerrar Rendición'}
          </Button>
        )}

        {/* Botón Generar PDF — solo si estadoCerrado=1 */}
        {estadoCerrado && (
          <Button
            variant="outline"
            onClick={handleGenerarPDF}
            icon={<Printer size={16} />}
          >
            Generar PDF
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Usuario</span>
            <User size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{usuario}</div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Monto Total</span>
            <DollarSign size={18} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>S/ {totalMonto.toFixed(2)}</div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Total Gastos</span>
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{gastos.length}</div>
        </Card>

        <Card style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>Aprobados</span>
            <FileText size={18} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>
            {gastos.filter(g => g.estado === 'Aprobado').length}
          </div>
        </Card>
      </div>

      {/* Tabla de Gastos */}
      <Card style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
          Gastos asociados a esta Rendición
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="ui-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>USUARIO</th>
                <th>FECHA EMISIÓN</th>
                <th>TIPO DOC.</th>
                <th>RAZÓN</th>
                <th>MONTO</th>
                <th>ESTADO</th>
                <th>SUNAT</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {gastos.length > 0 ? gastos.map((gasto) => (
                <tr key={gasto.aprobacionID || gasto.rendicionID}>
                  <td className="font-medium text-secondary">#{gasto.aprobacionID || gasto.rendicionID}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{gasto.nombreCompleto || 'Usuario'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{gasto.correo || ''}</div>
                  </td>
                  <td>{gasto.fechaEmision ? new Date(gasto.fechaEmision).toLocaleDateString('es-PE') : '—'}</td>
                  <td>{gasto.tipoDocumento || 'ND'}</td>
                  <td>{gasto.razon || '—'}</td>
                  <td style={{ fontWeight: 600 }}>S/ {gasto.monto}</td>
                  <td>{getEstadoBadge(gasto.estado)}</td>
                  <td>
                    {gasto.sunatValido === true || gasto.sunatValido === 'Válido'
                      ? <Badge variant="success">Válido</Badge>
                      : (gasto.sunatMensaje && gasto.sunatMensaje.trim().length > 0)
                        ? <Badge variant="danger">Inválido</Badge>
                        : <span className="text-secondary" style={{ fontSize: '0.85rem' }}>No validado</span>
                    }
                  </td>
                  <td>
                    <button
                      className="action-icon-btn"
                      onClick={() => navigate(`/aprobaciones/${gasto.aprobacionID || gasto.rendicionID}`)}
                      title="Ver detalle del gasto"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                    No hay gastos asociados a esta rendición.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total resumen al fondo */}
        {gastos.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 500 }}>Total rendición</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>S/ {totalMonto.toFixed(2)}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RendicionGrupoDetalle;
