import React from 'react';
import { useLoginForm } from '@/hooks/useLoginForm';
import './styles.css';

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (userData: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ isOpen, onClose, onLogin }) => {
  const {
    email,
    password,
    loading,
    error,
    tipoUsuario,
    handleSubmit,
    handleEmailChange,
    handleEmailBlur,
    handlePasswordChange,
    isFormValid
  } = useLoginForm({ isOpen, onClose, onLogin });

  if (!isOpen) return null;

  return (
    <div className="login-overlay active" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <h2>Bienvenido a TurnoSync</h2>
          <p>Inicia sesión para continuar</p>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-with-icon">
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="correo@ejemplo.com"
                required
                disabled={loading}
              />
              <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
          </div>

          {tipoUsuario && (
            <div style={{marginBottom: 10, color: '#64748b', fontSize: 13}}>
              <b>Tipo de usuario detectado:</b> {tipoUsuario}
            </div>
          )}

          {tipoUsuario === "administrador" && (
            <div className="form-group admin-password-field fade-in">
              <label htmlFor="password">Contraseña</label>
              <div className="input-with-icon">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose} 
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || !isFormValid}
            >
              {loading
                ? "Iniciando..."
                : tipoUsuario === "administrador"
                  ? "Iniciar Sesión como Administrador"
                  : "Iniciar Sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
