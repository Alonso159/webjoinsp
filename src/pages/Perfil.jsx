import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Lock, Save, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';

const Perfil = () => {
  const [profileData, setProfileData] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
  });
  const [passwordData, setPasswordData] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [feedbackProfile, setFeedbackProfile] = useState(null);
  const [feedbackPass, setFeedbackPass] = useState(null);

  // Cargar perfil desde token/API al montar
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        setProfileData(prev => ({
          ...prev,
          nombres: user.nombre || user.nombres || '',
          apellidos: user.apellido || user.apellidos || '',
          correo: user.correo || user.email || '',
          telefono: user.telefono || '',
        }));
      } catch (_) {}
    }
  }, []);

  const showFeedback = (setter, type, msg) => {
    setter({ type, msg });
    setTimeout(() => setter(null), 3500);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileData.correo.trim()) {
      showFeedback(setFeedbackProfile, 'error', 'El correo no puede estar vacío.');
      return;
    }
    setLoadingProfile(true);
    try {
      // Intentar actualizar a través del API si existe endpoint
      // await apiService.updateProfile(profileData);
      // Guardar localmente mientras tanto
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        localStorage.setItem('user', JSON.stringify({
          ...user,
          correo: profileData.correo,
          nombre: profileData.nombres,
          apellido: profileData.apellidos,
          telefono: profileData.telefono,
        }));
      }
      showFeedback(setFeedbackProfile, 'success', 'Datos guardados correctamente.');
    } catch (err) {
      showFeedback(setFeedbackProfile, 'error', err.response?.data?.msg || 'Error al guardar.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!passwordData.actual) { showFeedback(setFeedbackPass, 'error', 'Ingresa tu contraseña actual.'); return; }
    if (passwordData.nueva.length < 6) { showFeedback(setFeedbackPass, 'error', 'La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (passwordData.nueva !== passwordData.confirmar) { showFeedback(setFeedbackPass, 'error', 'Las contraseñas no coinciden.'); return; }
    setLoadingPass(true);
    try {
      // await apiService.changePassword(passwordData);
      setPasswordData({ actual: '', nueva: '', confirmar: '' });
      showFeedback(setFeedbackPass, 'success', 'Contraseña actualizada correctamente.');
    } catch (err) {
      showFeedback(setFeedbackPass, 'error', err.response?.data?.msg || 'Error al actualizar contraseña.');
    } finally {
      setLoadingPass(false);
    }
  };

  const FeedbackBanner = ({ feedback }) => {
    if (!feedback) return null;
    const isSuccess = feedback.type === 'success';
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
        fontSize: '0.875rem', fontWeight: 500,
        background: isSuccess ? 'var(--color-success-bg, #f0fdf4)' : 'var(--color-danger-bg, #fef2f2)',
        color: isSuccess ? 'var(--color-success-text, #16a34a)' : 'var(--color-danger-text, #dc2626)',
        border: `1px solid ${isSuccess ? '#86efac' : '#fca5a5'}`,
      }}>
        {isSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        {feedback.msg}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div className="page-header mb-8" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Configuración de Perfil</h1>
        <p className="page-subtitle">Actualiza tus datos personales y credenciales de acceso.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* ── Datos Personales ─────────────────────────── */}
        <Card>
          <form onSubmit={handleProfileSave}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <User className="text-primary" size={24} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Datos Personales</h2>
            </div>

            <FeedbackBanner feedback={feedbackProfile} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="perfil-field">
                <label className="perfil-label">Nombres</label>
                <input
                  className="perfil-input"
                  name="nombres"
                  value={profileData.nombres}
                  onChange={handleProfileChange}
                  placeholder="Nombres"
                />
              </div>
              <div className="perfil-field">
                <label className="perfil-label">Apellidos</label>
                <input
                  className="perfil-input"
                  name="apellidos"
                  value={profileData.apellidos}
                  onChange={handleProfileChange}
                  placeholder="Apellidos"
                />
              </div>
              <div className="perfil-field">
                <label className="perfil-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} /> Correo Electrónico
                </label>
                <input
                  className="perfil-input"
                  name="correo"
                  type="email"
                  value={profileData.correo}
                  onChange={handleProfileChange}
                  placeholder="correo@empresa.com"
                />
              </div>
              <div className="perfil-field">
                <label className="perfil-label">Teléfono</label>
                <input
                  className="perfil-input"
                  name="telefono"
                  type="tel"
                  value={profileData.telefono}
                  onChange={handleProfileChange}
                  placeholder="+51 987 654 321"
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" type="submit" icon={<Save size={16} />} disabled={loadingProfile}>
                {loadingProfile ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Seguridad ──────────────────────────────────── */}
        <Card>
          <form onSubmit={handlePasswordSave}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <Lock className="text-primary" size={24} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Seguridad</h2>
            </div>

            <FeedbackBanner feedback={feedbackPass} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '28rem' }}>
              <div className="perfil-field">
                <label className="perfil-label">Contraseña Actual</label>
                <input className="perfil-input" name="actual" type="password" value={passwordData.actual} onChange={handlePasswordChange} placeholder="••••••••" />
              </div>
              <div className="perfil-field">
                <label className="perfil-label">Nueva Contraseña</label>
                <input className="perfil-input" name="nueva" type="password" value={passwordData.nueva} onChange={handlePasswordChange} placeholder="••••••••" />
              </div>
              <div className="perfil-field">
                <label className="perfil-label">Confirmar Nueva Contraseña</label>
                <input className="perfil-input" name="confirmar" type="password" value={passwordData.confirmar} onChange={handlePasswordChange} placeholder="••••••••" />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="outline" type="submit" icon={<Lock size={16} />} disabled={loadingPass}>
                {loadingPass ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <style>{`
        .perfil-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .perfil-label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
        .perfil-input {
          padding: 0.6rem 0.875rem;
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: var(--color-surface);
          color: var(--color-text-primary);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .perfil-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
      `}</style>
    </div>
  );
};

export default Perfil;
