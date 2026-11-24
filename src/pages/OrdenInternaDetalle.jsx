import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Printer, History, ZoomIn, ZoomOut, RotateCw, ExternalLink, AlertTriangle, Check, Loader } from 'lucide-react';
import { apiService } from '../services/api';
import './AprobacionDetalle.css'; // Reusamos los mismos estilos

const OrdenInternaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
        const data = await apiService.getOrdenInternaDetalle(id);
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
    if (!window.confirm('¿Está seguro de aprobar esta orden de pago?')) return;
    setSubmitting(true);
    try {
      await apiService.actualizarEstadoOrdenInterna(id, 'Aprobado', '');
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
      await apiService.actualizarEstadoOrdenInterna(id, 'Rechazado', motivoRechazo);
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
        <p>Cargando orden de pago...</p>
      </div>
    );
  }

  return (
    <div className="detalle-page">
      <div className="page-header detail-header">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="page-title">Orden de Pago #{detalle?.id || detalle?.idOrdenInterna || id}</h1>
            {detalle?.estado === 'Aprobado' && <Badge variant="success">Aprobado</Badge>}
            {detalle?.estado === 'Rechazado' && <Badge variant="danger">Rechazado</Badge>}
            {(!detalle?.estado || detalle?.estado === 'Pendiente') && <Badge variant="warning">Pendiente de Aprobacion</Badge>}
          </div>
          <p className="page-subtitle mt-2">
            Registrado el {detalle?.fecha || (detalle?.fecha_Registro || detalle?.fechaRegistro ? new Date(detalle.fecha_Registro || detalle.fechaRegistro).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div className="detalle-info-panel" style={{ width: '100%' }}>
          <Card className="user-card mb-4">
            <div className="user-cell">
              <div>
                <div className="font-semibold text-primary">{detalle?.beneficiario || detalle?.nombreUsuario || detalle?.nombreCompleto || 'Usuario'}</div>
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
                <span className="data-label">Documento de Origen (OCR)</span>
                <span className="data-value flex items-center gap-2">{detalle?.archivoOrigen || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Tipo de Formulario / Vale</span>
                <span className="data-value">{detalle?.tipoFormulario || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Número de Documento</span>
                <span className="data-value">{detalle?.numeroDocumento || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Fecha</span>
                <span className="data-value">{detalle?.fecha || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Código</span>
                <span className="data-value">{detalle?.codigo || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Gerencia</span>
                <span className="data-value">{detalle?.gerencia || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Subgerencia</span>
                <span className="data-value">{detalle?.subGerencia || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">CRP</span>
                <span className="data-value">{detalle?.crp || '—'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Importe Final</span>
                <span className="data-value amount" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>S/ {detalle?.importeFinal ?? detalle?.importe ?? '—'}</span>
              </div>
            </div>

            <div className="comments-box mt-4">
              <span className="data-label">Descripción / Concepto del Gasto</span>
              <p className="comments-text">{detalle?.descripcion || detalle?.razon || '—'}</p>
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
                disabled={submitting}
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

export default OrdenInternaDetalle;
