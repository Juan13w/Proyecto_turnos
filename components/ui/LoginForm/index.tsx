import React from 'react';
import { useLoginForm } from '@/hooks/useLoginForm';
import './styles.css';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (userData: any) => void;
  isLoading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ isOpen, onClose, onLogin, isLoading: externalLoading = false }) => {
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
          <button 
            type="button"
            className="close-btn" 
            onClick={onClose} 
            aria-label="Cerrar"
            disabled={loading || externalLoading}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {(error || externalLoading) && (
            <div className="error-message">
              {externalLoading ? 'Redirigiendo...' : error}
            </div>
          )}

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
              className={`submit-btn ${tipoUsuario === 'administrador' ? 'admin' : 'employee'}`} 
              disabled={!isFormValid || loading || externalLoading}
            >
              {loading || externalLoading ? (
                <>
                  <div className="spinner"></div>
                  {externalLoading ? 'Redirigiendo...' : 'Iniciando sesión...'}
                </>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  {tipoUsuario === "administrador" ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Acceso Administrador
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      Iniciar Sesión
                    </>
                  )}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
