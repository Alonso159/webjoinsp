import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Edit2, Eye, Search, X, Save, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import './TiposOrdenInterna.css';

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
const TipoOrdenInternaForm = ({ initial = {}, onSave, onCancel, loading, isEdit }) => {
  const [form, setForm] = useState({
    nombre: initial.nombre || '',
    descripcion: initial.descripcion || ''
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
          placeholder="Ej: Materiales"
          disabled={loading || isEdit}
        />
      </div>
      <div className="tg-field">
        <label>Descripción</label>
        <textarea
          className="tg-input tg-textarea"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Descripción del tipo de orden interna..."
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
const TipoOrdenInternaDetalle = ({ item, onClose }) => (
  <div className="tg-detalle">
    <div className="tg-detalle-row">
      <span className="tg-detalle-label">Nombre</span>
      <span className="tg-detalle-value">{item.nombre}</span>
    </div>
    <div className="tg-detalle-row">
      <span className="tg-detalle-label">Descripción</span>
      <span className="tg-detalle-value">{item.descripcion}</span>
    </div>
    <div className="tg-form-actions">
      <Button variant="primary" onClick={onClose}>Cerrar</Button>
    </div>
  </div>
);

/* ─── Componente principal ───────────────────────────────────── */
const TiposOrdenInterna = () => {
  const [tiposOrdenInterna, setTiposOrdenInterna] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modales: null | { mode: 'create' | 'view' | 'edit', item?: object }
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg }

  const fetchTiposOrdenInterna = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTiposOrdenInterna();
      setTiposOrdenInterna(data || []);
    } catch (error) {
      console.error('Error fetching tipos de orden interna:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTiposOrdenInterna(); }, []);

  const filteredTipos = tiposOrdenInterna.filter(tipo =>
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
      await apiService.createTipoOrdenInterna(formData);
      await fetchTiposOrdenInterna();
      setModal(null);
      showFeedback('success', 'Tipo de orden interna creado correctamente.');
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
      // El nombre no cambia, es la llave
      await apiService.updateTipoOrdenInterna(formData.nombre, formData);
      await fetchTiposOrdenInterna();
      setModal(null);
      showFeedback('success', 'Tipo de orden interna actualizado correctamente.');
    } catch (err) {
      showFeedback('error', err.response?.data?.msg || err.message || 'Error al actualizar.');
    } finally {
      setSaving(false);
    }
  };

  // ── Ver detalle ────
  const handleOpenView = async (item) => {
    if (item.nombre) {
      try {
        const detalle = await apiService.getTipoOrdenInternaByName(item.nombre);
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
          <h1 className="page-title">Tipos de Orden Interna</h1>
          <p className="page-subtitle">Gestiona las categorías permitidas para órdenes internas.</p>
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
                placeholder="Buscar tipo de orden interna..."
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
                <tr><td colSpan="3" className="text-center py-6 text-secondary">Cargando...</td></tr>
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
                  <td colSpan="3" className="text-center py-6 text-secondary">No se encontraron resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Modales ─────────────────────────────────────────────── */}
      {modal?.mode === 'create' && (
        <Modal title="Crear Nuevo Tipo de Orden Interna" onClose={closeModal}>
          <TipoOrdenInternaForm
            onSave={handleCreate}
            onCancel={closeModal}
            loading={saving}
            isEdit={false}
          />
        </Modal>
      )}

      {modal?.mode === 'edit' && (
        <Modal title="Editar Tipo de Orden Interna" onClose={closeModal}>
          <TipoOrdenInternaForm
            initial={modal.item}
            onSave={handleEdit}
            onCancel={closeModal}
            loading={saving}
            isEdit={true}
          />
        </Modal>
      )}

      {modal?.mode === 'view' && (
        <Modal title="Detalle del Tipo de Orden Interna" onClose={closeModal}>
          <TipoOrdenInternaDetalle item={modal.item} onClose={closeModal} />
        </Modal>
      )}
    </div>
  );
};

export default TiposOrdenInterna;
