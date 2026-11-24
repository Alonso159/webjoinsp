import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Printer, History, ZoomIn, ZoomOut, RotateCw, ExternalLink, AlertTriangle, Check, Loader } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AprobacionDetalle.css';

const AprobacionDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validandoSunat, setValidandoSunat] = useState(false);
  const [sunatInvalido, setSunatInvalido] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalData, setResultModalData] = useState({ title: '', message: '', isSuccess: true });


  useEffect(() => {
    const fetchDetalle = async () => {
      setLoading(true);
      try {
        const data = await apiService.getRendicionDetalle(id);
        setDetalle(data);
        if (data.sunatValido === false || (data.sunatMensaje && data.sunatMensaje.includes('No existe'))) {
          setSunatInvalido(true);
        }
      } catch (error) {
        console.error('Error fetching detalle:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetalle();
  }, [id]);

  const handlePrintImage = () => {
    if (detalle?.imagenComprobante) {
      const printWindow = window.open('', '_blank');
      const nombre = detalle.nombreUsuario || 'Usuario Desconocido';
      const fechaObj = detalle.fecha_Registro ? new Date(detalle.fecha_Registro) : new Date();
      const fecha = fechaObj.toLocaleDateString('es-PE');
      const hora = fechaObj.toLocaleTimeString('es-PE');
      
      const tipoGasto = detalle.tipoAprobacion ? (detalle.tipoOrdenInterna || 'Orden Interna') : (detalle.tipoGastoNombre || 'Gasto');
      const area = detalle.departamento || detalle.area || detalle.cCosto || '—';

      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Comprobante</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; margin: 2rem; color: #333; }
              .header { text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem; }
              .info-grid { display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; font-size: 0.9rem; flex-wrap: wrap; }
              .info-item { display: flex; flex-direction: column; align-items: center; }
              .info-label { font-weight: 600; color: #666; text-transform: uppercase; font-size: 0.75rem; margin-bottom: 0.25rem; }
              .info-value { font-weight: 500; font-size: 1rem; }
              .image-container { text-align: center; }
              img { max-width: 100%; max-height: 70vh; object-fit: contain; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
              @media print {
                body { margin: 0; padding: 1rem; }
                img { box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2 style="margin: 0; color: #111;">Comprobante de Gasto / Orden Interna</h2>
              <p style="margin: 0.5rem 0 0 0; color: #666;">ID: #${detalle.aprobacionID || detalle.rendicionID || id}</p>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Usuario</span>
                <span class="info-value">${nombre}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Área</span>
                <span class="info-value">${area}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tipo de Gasto</span>
                <span class="info-value">${tipoGasto}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha de subida</span>
                <span class="info-value">${fecha}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Hora de subida</span>
                <span class="info-value">${hora}</span>
              </div>
            </div>
            <div class="image-container">
              <img src="data:image/jpeg;base64,${detalle.imagenComprobante}" onload="setTimeout(() => { window.print(); window.close(); }, 500);" />
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      alert('No hay imagen para imprimir');
    }
  };

  const handleValidarSunat = async () => {
    if (!detalle) return;
    setValidandoSunat(true);
    try {
      const parts = detalle.serieCorrelativo ? detalle.serieCorrelativo.split('-') : [];
      const serie = parts[0] || '';
      const numero = parts[1] || '';

      const fecha = detalle.fechaEmision ? new Date(detalle.fechaEmision) : new Date();
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const anio = fecha.getFullYear();
      const fechaFormat = `${dia}/${mes}/${anio}`;

      const payload = {
        numRuc: detalle.ruc_Proveedor || '',
        codComp: detalle.tipoDocumento,
        numeroSerie: serie,
        numero: numero,
        fechaEmision: fechaFormat,
        monto: detalle.monto?.toString() || '0'
      };

      const resp = await apiService.validarComprobante(payload);
      const msg = resp.message || '';
      const noExiste = msg.includes('No existe') || msg.includes('no autorizado');

      setDetalle(prev => ({
        ...prev,
        sunatValido: resp.success && !noExiste,
        sunatMensaje: msg
      }));

      if (noExiste || !resp.success) {
        setSunatInvalido(true);
      } else {
        setSunatInvalido(false);
      }

      setResultModalData({
        title: 'Resultado de Validación SUNAT',
        message: msg,
        isSuccess: !noExiste && resp.success
      });
      setShowResultModal(true);
    } catch (error) {
      setResultModalData({
        title: 'Error de Validación',
        message: error.response?.data?.msg || error.message,
        isSuccess: false
      });
      setShowResultModal(true);
    } finally {
      setValidandoSunat(false);
    }
  };

  const handleAprobar = async () => {
    if (!window.confirm('Esta seguro de aprobar esta rendicion?')) return;
    setSubmitting(true);
    try {
      const aprobadorId = user?.doi || user?.DOI || user?.id;
      await apiService.actualizarEstadoRendicion(id, 'Aprobado', '', aprobadorId);
      navigate('/aprobaciones');
    } catch (error) {
      alert('Error al aprobar: ' + (error.response?.data?.msg || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRechazo = async () => {
    if (!motivoRechazo.trim()) {
      alert('Por favor ingrese un motivo de rechazo.');
      return;
    }
    setSubmitting(true);
    try {
      const aprobadorId = user?.doi || user?.DOI || user?.id;
      await apiService.actualizarEstadoRendicion(id, 'Rechazado', motivoRechazo, aprobadorId);
      setShowRechazoModal(false);
      navigate('/aprobaciones');
    } catch (error) {
      alert('Error al rechazar: ' + (error.response?.data?.msg || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="detalle-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)' }}>
        <Loader size={40} />
        <p>Cargando rendicion...</p>
      </div>
    );
  }

  return (
    <div className="detalle-page">
      <div className="page-header detail-header">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="page-title">{detalle?.tipoAprobacion ? 'Orden Interna' : 'Gasto'} #{detalle?.aprobacionID || detalle?.rendicionID || id}</h1>
            {detalle?.estado === 'Aprobado' && <Badge variant="success">Aprobado</Badge>}
            {detalle?.estado === 'Rechazado' && <Badge variant="danger">Rechazado</Badge>}
            {(!detalle?.estado || detalle?.estado === 'Pendiente') && <Badge variant="warning">Pendiente de Aprobacion</Badge>}
          </div>
          <p className="page-subtitle mt-2">
            Registrado el {detalle?.fecha_Registro ? new Date(detalle.fecha_Registro).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} a las {detalle?.fecha_Registro ? new Date(detalle.fecha_Registro).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </p>
        </div>
      </div>

      <div className="detalle-grid">
        {/* Lado Izquierdo: Datos */}
        <div className="detalle-info-panel">
          <Card className="user-card mb-4">
            <div className="user-cell">
              <div>
                <div className="font-semibold text-primary">{detalle?.nombreUsuario || 'Usuario'}</div>
                <div className="text-sm text-secondary">{detalle?.correo || ''}</div>
              </div>
            </div>
          </Card>

          <Card className="data-card">
            <div className="card-header section-title">
              <h3>DATOS DEL DOCUMENTO</h3>
            </div>

            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">Tipo de Documento</span>
                <span className="data-value flex items-center gap-2">{detalle?.tipoDocumento || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">RUC / DOI Proveedor</span>
                <span className="data-value">{detalle?.ruc_Proveedor || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">No de Serie - Correlativo</span>
                <span className="data-value">
                  {detalle?.serieCorrelativo}
                </span>
              </div>
              <div className="data-item">
                <span className="data-label">Fecha de Emision</span>
                <span className="data-value">
                  {detalle?.fechaEmision ? new Date(detalle.fechaEmision).toLocaleDateString('es-PE') : '—'}
                </span>
              </div>
              <div className="data-item">
                <span className="data-label">Aprobador</span>
                <span className="data-value">
                  {detalle?.aprobadorNombre || "Todavia no Aprobado"}
                </span>
              </div>
              <div className="data-item">
                <span className="data-label">Fecha Aprobación</span>
                <span className="data-value">
                  {detalle?.fechaAprobacion ? new Date(detalle.fechaAprobacion).toLocaleDateString('es-PE') : "Todavia no Aprobado"}
                </span>
              </div>
            </div>

            <div className="amount-section mt-4 mb-4">
              <div className="data-item">
                <span className="data-label">Monto Total</span>
                <span className="data-value amount">S/ {detalle?.monto ?? '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Moneda</span>
                <span className="data-value">{detalle?.moneda || 'PEN'}</span>
              </div>
              {detalle?.tipoAprobacion ? (
                <>
                  <div className="data-item">
                    <span className="data-label">Tipo Orden Interna</span>
                    <span className="data-value amount">{detalle?.tipoOrdenInterna ?? '—'}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Placa</span>
                    <span className="data-value amount">{detalle?.placa ?? '—'}</span>
                  </div>
                </>
              ) : (
                <div className="data-item">
                  <span className="data-label">Tipos de Gasto</span>
                  <span className="data-value amount">{detalle?.tipoGastoNombre ?? '—'}</span>
                </div>
              )}
            </div>

            <div
              className="sunat-validation-box mt-4"
              style={{
                borderColor: detalle?.sunatValido ? '#a7f3d0' : (detalle?.sunatMensaje ? '#fecaca' : 'var(--color-border)'),
                backgroundColor: detalle?.sunatValido ? 'var(--color-success-bg)' : (detalle?.sunatMensaje ? '#fef2f2' : 'var(--color-secondary)'),
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid'
              }}
            >
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className={`flex gap-2 font-semibold ${detalle?.sunatValido ? 'text-success' : (detalle?.sunatMensaje ? 'text-danger' : 'text-secondary')}`}>
                    <Check size={18} /> Validación SUNAT: {detalle?.sunatValido ? 'Válido' : (detalle?.sunatMensaje ? 'No Válido' : 'No validado')}
                  </div>
                  {detalle?.sunatMensaje && (
                    <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {detalle.sunatMensaje}
                    </div>
                  )}
                </div>
                {detalle?.estado === 'Pendiente' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleValidarSunat}
                    disabled={validandoSunat}
                    icon={validandoSunat ? <Loader size={14} className="spin" /> : <RotateCw size={14} />}
                  >
                    {validandoSunat ? 'Validando...' : (detalle?.sunatValido || detalle?.sunatMensaje ? 'Re-Validar' : 'Validar SUNAT')}
                  </Button>
                )}
              </div>
            </div>

            <div className="comments-box mt-4">
              <span className="data-label">Comentarios / Razon</span>
              <p className="comments-text">{detalle?.razon || '—'}</p>
            </div>
          </Card>
        </div>

        {/* Lado Derecho: Visor de Imagen */}
        <div className="detalle-viewer-panel">
          <Card className="viewer-card h-full">
            <div className="viewer-toolbar">
              <button className="toolbar-btn"><ZoomOut size={18} /></button>
              <span className="zoom-text">100%</span>
              <button className="toolbar-btn"><ZoomIn size={18} /></button>
              <div className="divider-v"></div>
              <button className="toolbar-btn"><RotateCw size={18} /></button>
              <button className="toolbar-btn" onClick={handlePrintImage} title="Imprimir Imagen"><Printer size={18} /></button>
              <button className="toolbar-btn"><ExternalLink size={18} /></button>
            </div>

            <div className="image-container">
              {detalle?.imagenComprobante
                ? <img src={`data:image/jpeg;base64,${detalle.imagenComprobante}`} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>Sin imagen disponible</div>
              }
            </div>

            <div className="viewer-footer">
              <Badge>{detalle?.imagenBase64 ? 'Imagen adjunta' : 'Sin imagen'}</Badge>
            </div>
          </Card>
        </div>
      </div>

      <div className="bottom-action-bar">
        <div className="flex items-center gap-2 text-secondary text-sm">
          <span>Revisa todos los campos antes de tomar una accion.</span>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/aprobaciones')}>Cerrar</Button>
          {detalle?.estado === 'Pendiente' && (
            <>
              <Button
                variant="outline"
                className="btn-observe"
                onClick={() => setShowRechazoModal(true)}
                icon={<AlertTriangle size={16} />}
                disabled={submitting}
              >
                Rechazar
              </Button>
              <Button
                variant="primary"
                onClick={handleAprobar}
                icon={<Check size={16} />}
                disabled={submitting || sunatInvalido}
                title={sunatInvalido ? "No se puede aprobar porque el comprobante no es válido en SUNAT" : ""}
                style={sunatInvalido ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                {submitting ? 'Procesando...' : 'Aprobar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modal de Rechazo */}
      {showRechazoModal && (
        <div className="modal-overlay">
          <Card className="modal-content">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              Motivo de Rechazo
            </h3>
            <textarea
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)', marginBottom: '1rem', outline: 'none' }}
              rows="4"
              placeholder="Ingrese el motivo por el cual rechaza esta solicitud..."
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
            ></textarea>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="outline" onClick={() => setShowRechazoModal(false)} disabled={submitting}>Cancelar</Button>
              <Button
                variant="primary"
                style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={handleConfirmRechazo}
                disabled={submitting}
              >
                {submitting ? 'Rechazando...' : 'Confirmar Rechazo'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Resultado SUNAT */}
      {showResultModal && (
        <div className="modal-overlay">
          <Card className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              {resultModalData.isSuccess ? <Check size={24} className="text-success" /> : <AlertTriangle size={24} className="text-danger" />}
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0, color: resultModalData.isSuccess ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {resultModalData.title}
              </h3>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {resultModalData.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setShowResultModal(false)}>Aceptar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AprobacionDetalle;
