import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Plus, Edit2, Eye, Search, X, Save, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import './TiposGasto.css';

/* ─── Modal genérico ─────────────────────────────────────────── */
const Modal = ({ title, onClose, children }) => (
  <>
    <div className="tg-overlay" onClick={onClose} />
    <div className="tg-modal">
      <div className="tg-modal-header">
        <h2 className="tg-modal-title">{title}</h2>
        <button className="tg-modal-close" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="tg-modal-body">{children}</div>
    </div>
  </>
);

/* ─── Formulario compartido (Crear / Editar) ─────────────────── */
const TipoGastoForm = ({ initial = {}, onSave, onCancel, loading }) => {
  const [form, setForm] = useState({
    nombre: initial.nombre || '',
    descripcion: initial.descripcion || '',
    estado: initial.estado || 'Activo',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return; }
    if (!form.descripcion.trim()) { setError('La descripción es requerida.'); return; }
    setError('');
    onSave({ ...initial, ...form });
  };

  return (
    <form onSubmit={handleSubmit} className="tg-form">
      {error && (
        <div className="tg-error-msg">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div className="tg-field">
        <label>Nombre</label>
        <input
          className="tg-input"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej: Combustible"
          disabled={loading}
        />
      </div>
      <div className="tg-field">
        <label>Descripción</label>
        <textarea
          className="tg-input tg-textarea"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Descripción del tipo de gasto..."
          rows={3}
          disabled={loading}
        />
      </div>
      <div className="tg-form-actions">
        <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button variant="primary" type="submit" icon={<Save size={16} />} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
};

/* ─── Vista de detalle ───────────────────────────────────────── */
const TipoGastoDetalle = ({ item, onClose }) => (
  <div className="tg-detalle">
    <div className="tg-detalle-row">
      <span className="tg-detalle-label">Nombre</span>
      <span className="tg-detalle-value">{item.nombre}</span>
    </div>
    <div className="tg-detalle-row">
      <span className="tg-detalle-label">Descripción</span>
      <span className="tg-detalle-value">{item.descripcion}</span>
    </div>
    {item.idTipoGasto && (
      <div className="tg-detalle-row">
        <span className="tg-detalle-label">ID</span>
        <span className="tg-detalle-value">#{item.idTipoGasto}</span>
      </div>
    )}
    <div className="tg-form-actions">
      <Button variant="primary" onClick={onClose}>Cerrar</Button>
    </div>
  </div>
);

/* ─── Componente principal ───────────────────────────────────── */
const TiposGasto = () => {
  const [tiposGasto, setTiposGasto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modales: null | { mode: 'create' | 'view' | 'edit', item?: object }
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg }

  const fetchTiposGasto = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTiposGasto();
      setTiposGasto(data || []);
    } catch (error) {
      console.error('Error fetching tipos de gasto:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTiposGasto(); }, []);

  const filteredTipos = tiposGasto.filter(tipo =>
    tipo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipo.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ── Crear ──────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    setSaving(true);
    try {
      await apiService.createTipoGasto(formData);
      await fetchTiposGasto();
      setModal(null);
      showFeedback('success', 'Tipo de gasto creado correctamente.');
    } catch (err) {
      showFeedback('error', err.response?.data?.msg || err.message || 'Error al crear.');
    } finally {
      setSaving(false);
    }
  };

  // ── Editar ─────────────────────────────────────────────────────
  const handleEdit = async (formData) => {
    setSaving(true);
    try {
      await apiService.updateTipoGasto(formData);
      await fetchTiposGasto();
      setModal(null);
      showFeedback('success', 'Tipo de gasto actualizado correctamente.');
    } catch (err) {
      showFeedback('error', err.response?.data?.msg || err.message || 'Error al actualizar.');
    } finally {
      setSaving(false);
    }
  };

  // ── Ver detalle (carga desde API por ID si está disponible) ────
  const handleOpenView = async (item) => {
    // Si existe endpoint por ID, intentar cargarlo para tener datos actualizados
    if (item.idTipoGasto) {
      try {
        const detalle = await apiService.getTipoGastoById(item.idTipoGasto);
        setModal({ mode: 'view', item: detalle || item });
        return;
      } catch (_) { /* fallback al item local */ }
    }
    setModal({ mode: 'view', item });
  };

  const closeModal = () => setModal(null);

  return (
    <div className="tipos-gasto-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tipos de Gasto</h1>
          <p className="page-subtitle">Gestiona las categorías de gastos permitidas para rendiciones.</p>
        </div>
        <div className="header-actions">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setModal({ mode: 'create' })}
          >
            Crear Nuevo Tipo
          </Button>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className={`tg-toast tg-toast-${feedback.type}`}>
          {feedback.type === 'success' ? '✓' : '✗'} {feedback.msg}
        </div>
      )}

      <Card className="table-card mt-6">
        <div className="card-header">
          <div className="table-actions w-full max-w-md">
            <div className="input-with-icon w-full">
              <Search size={16} className="input-icon" />
              <input
                type="text"
                placeholder="Buscar tipo de gasto..."
                className="filter-input w-full"
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
                <th>NOMBRE</th>
                <th>DESCRIPCIÓN</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-6 text-secondary">Cargando...</td></tr>
              ) : filteredTipos.length > 0 ? filteredTipos.map((item, idx) => (
                <tr key={idx}>
                  <td className="font-semibold text-primary">{item.nombre}</td>
                  <td>{item.descripcion}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="action-icon-btn"
                        title="Ver detalle"
                        onClick={() => handleOpenView(item)}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="action-icon-btn primary"
                        title="Editar"
                        onClick={() => setModal({ mode: 'edit', item })}
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-secondary">No se encontraron resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Modales ─────────────────────────────────────────────── */}
      {modal?.mode === 'create' && (
        <Modal title="Crear Nuevo Tipo de Gasto" onClose={closeModal}>
          <TipoGastoForm
            onSave={handleCreate}
            onCancel={closeModal}
            loading={saving}
          />
        </Modal>
      )}

      {modal?.mode === 'edit' && (
        <Modal title="Editar Tipo de Gasto" onClose={closeModal}>
          <TipoGastoForm
            initial={modal.item}
            onSave={handleEdit}
            onCancel={closeModal}
            loading={saving}
          />
        </Modal>
      )}

      {modal?.mode === 'view' && (
        <Modal title="Detalle del Tipo de Gasto" onClose={closeModal}>
          <TipoGastoDetalle item={modal.item} onClose={closeModal} />
        </Modal>
      )}
    </div>
  );
};

export default TiposGasto;
