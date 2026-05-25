import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, ArrowLeft, Building2, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../services/api';
import './Login.css';

const Login = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.login(email, password);
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        navigate('/');
      } else {
        alert(response.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error in login:', error);
      alert(error.response?.data?.message || 'Error al conectar con el servidor');
    }
  };

  const handleRecover = (e) => {
    e.preventDefault();
    // TODO: Lógica para enviar correo de recuperación
    console.log('Recover password for', email);
    alert('Si el correo existe, recibirás instrucciones para recuperar tu contraseña.');
    setIsRecovering(false);
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-shape shape-1"></div>
        <div className="login-shape shape-2"></div>
      </div>

      <div className="login-content">
        <Card className="login-card">
          <div className="login-header">
            <div className="login-logo-container">
              <Building2 className="login-logo-icon" size={32} />
            </div>
            <h2>{isRecovering ? 'Recuperar Contraseña' : 'Bienvenido de nuevo'}</h2>
            <p className="text-secondary text-sm">
              {isRecovering 
                ? 'Ingresa tu correo para recibir instrucciones' 
                : 'Ingresa a tu cuenta para gestionar gastos'}
            </p>
          </div>

          {!isRecovering ? (
            <form onSubmit={handleLogin} className="login-form">
              <Input 
                label="Correo electrónico" 
                type="email" 
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <div className="password-field">
                <Input 
                  label="Contraseña" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  suffix={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'inherit' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
                <button 
                  type="button" 
                  className="forgot-password-link text-sm"
                  onClick={() => setIsRecovering(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <Button type="submit" variant="primary" className="w-full mt-4">
                Iniciar Sesión
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRecover} className="login-form">
              <Input 
                label="Correo electrónico" 
                type="email" 
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <Button type="submit" variant="primary" className="w-full mt-4">
                Enviar Enlace de Recuperación
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full mt-2"
                icon={<ArrowLeft size={16} />}
                onClick={() => setIsRecovering(false)}
              >
                Volver al Login
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Login;
