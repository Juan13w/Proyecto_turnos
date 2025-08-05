"use client"

import type React from "react"
import { useState, useEffect } from "react"
import "./LoginForm.css"

interface LoginFormProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (userData: any) => void
}

const LoginForm = ({ isOpen, onClose, onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tipoUsuario, setTipoUsuario] = useState<"empleado" | "administrador" | "ninguno" | "">("")
  const [password, setPassword] = useState("")

  // Resetear el formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setTipoUsuario("")
      setPassword("")
      setError("")
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!email) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }
    
    if (tipoUsuario === "administrador" && !password) {
      setError("Por favor ingresa la contraseña de administrador");
      return;
    }

    // Si el tipo de usuario no está definido, intentamos identificarlo
    if (!tipoUsuario) {
      try {
        await handleEmailCheck(email);
        if (!tipoUsuario) {
          setError("No se pudo identificar el tipo de usuario. Por favor, verifica tu correo.");
          return;
        }
      } catch (err) {
        console.error("Error al verificar el correo:", err);
        setError("Error al verificar el correo. Por favor, inténtalo de nuevo.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...(tipoUsuario === "administrador" && { password })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en el inicio de sesión");
      }

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (data.success && data.user) {
        try {
          // Limpiar el formulario
          setEmail("");
          setPassword("");
          setTipoUsuario("");
          setError("");
          
          // Guardar datos de sesión
          if (!data.user.isAdmin) {
            console.log('Guardando datos de empleado en localStorage');
            localStorage.setItem("empleadoLogueado", "true");
            localStorage.setItem("empleadoData", JSON.stringify(data.user));
            
            // Notificar al componente padre
            onLogin(data.user);
            
            // Forzar recarga de la página para actualizar el estado de autenticación
            console.log('Recargando la página para actualizar el estado de autenticación');
            window.location.reload();
            return;
          } else {
            console.log('Guardando datos de administrador en localStorage');
            localStorage.setItem("adminLogueado", "true");
            localStorage.setItem("adminData", JSON.stringify({ email: data.user.email }));
            
            // Notificar al componente padre
            onLogin(data.user);
            
            // Forzar recarga de la página para actualizar el estado de autenticación
            console.log('Recargando la página para actualizar el estado de autenticación');
            window.location.reload();
            return;
          }
        } catch (error) {
          console.error('Error al procesar la respuesta de login:', error);
          setError('Error al procesar la respuesta del servidor');
        }
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      setError(error instanceof Error ? error.message : "Error en el inicio de sesión");
    } finally {
      setLoading(false);
    }
  }

  // Identificar tipo de usuario al salir del campo email o al cambiarlo
  let debounceTimer: NodeJS.Timeout | null = null;
  
  const handleEmailCheck = async (correo: string): Promise<boolean> => {
    console.log('handleEmailCheck llamado con correo:', correo);
    
    if (!correo) {
      console.log('Correo vacío, limpiando estado');
      setTipoUsuario("");
      setPassword("");
      return false;
    }
    
    try {
      console.log('Realizando petición a /api/auth/identifica-usuario');
      const response = await fetch("/api/auth/identifica-usuario", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Debug": "true"
        },
        body: JSON.stringify({ email: correo })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en la respuesta del servidor: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.tipo) {
        setTipoUsuario(data.tipo);
        
        if (data.tipo === "ninguno") {
          setError("El correo no está registrado como empleado ni como administrador");
          return false;
        } else {
          setError("");
          // Si es administrador, mostramos el campo de contraseña
          if (data.tipo === "administrador") {
            setPassword("");
          }
          return true;
        }
      } else {
        throw new Error("Formato de respuesta inesperado");
      }
    } catch (error) {
      console.error("Error al identificar usuario:", error);
      setTipoUsuario("");
      setError("No se pudo verificar el correo. Por favor, inténtalo de nuevo.");
      return false;
    }
  }

  // Debounce para onChange
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setEmail(value);
    
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Solo hacemos la verificación si hay un correo
    if (value) {
      debounceTimer = setTimeout(() => {
        handleEmailCheck(value);
      }, 400);
    } else {
      setTipoUsuario("");
      setError("");
    }
  };

  // onBlur también dispara la verificación inmediata
  const handleEmailBlur = () => {
    if (email) {
      handleEmailCheck(email);
    }
  };

  if (!isOpen) return null

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <div className="login-header">
          <h2>Iniciar Sesión</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="ejemplo@empresa.com"
              required
              disabled={loading}
            />
          </div>



          {tipoUsuario && (
            <div style={{marginBottom: 10, color: '#64748b', fontSize: 13}}>
              <b>Tipo de usuario detectado:</b> {tipoUsuario}
            </div>
          )}

          {tipoUsuario === "administrador" && (
            <div className="form-group admin-password-field fade-in">
              <label htmlFor="password">
                <span role="img" aria-label="candado" style={{marginRight: '6px'}}>🔒</span>
                Contraseña de Administrador
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={tipoUsuario === "administrador"}
                disabled={loading}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña de administrador"
              />
              <small className="admin-info">Solo administradores pueden acceder con contraseña.</small>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="submit-btn" disabled={
              loading ||
              !email || (tipoUsuario === "administrador" && !password)
            }>
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
  )
}

export default LoginForm
