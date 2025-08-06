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
  const [localIP, setLocalIP] = useState<string>("")
  const [deviceInfo, setDeviceInfo] = useState<{
    dispositivo: string
    userAgent: string
    platform: string
  }>({ dispositivo: 'Computador', userAgent: '', platform: '' })
  
  const [location, setLocation] = useState<{
    latitude: number | null
    longitude: number | null
    error: string | null
  }>({ latitude: null, longitude: null, error: null })

  // Obtener la ubicación del usuario
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'La geolocalización no es soportada por tu navegador' }));
      return;
    }

    const success = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null
      });
    };

    const error = (err: GeolocationPositionError) => {
      console.error('Error al obtener la ubicación:', err);
      setLocation(prev => ({
        ...prev,
        error: `No se pudo obtener la ubicación: ${err.message}`
      }));
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  }, []);

  // Detectar información básica del dispositivo al cargar el componente
  useEffect(() => {
    const detectDeviceInfo = () => {
      const userAgent = navigator.userAgent;
      // Usamos simplemente 'Computador' para todos los dispositivos no móviles/tablets
      let deviceType = 'Computador';
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
      const isTablet = /iPad|Android(?!.*Mobile)|Tablet|Silk/i.test(userAgent);

      if (isMobile) {
        deviceType = 'Móvil';
      } else if (isTablet) {
        deviceType = 'Tablet';
      }

      // Detectar sistema operativo
      let os = 'Sistema';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac OS')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) os = 'iOS';

      // Detectar navegador
      let browser = 'Navegador';
      if (userAgent.includes('Firefox/')) browser = 'Firefox';
      else if (userAgent.includes('Edg/')) browser = 'Edge';
      else if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) browser = 'Opera';
      else if (userAgent.includes('Chrome/')) browser = 'Chrome';
      else if (userAgent.includes('Safari/')) browser = 'Safari';

      setDeviceInfo({
        dispositivo: `${os} ${deviceType} ${browser}`.substring(0, 50),
        userAgent: userAgent,
        platform: navigator.platform
      });
    };

    // Obtener IP local
    const getLocalIP = async () => {
      try {
        // Usamos WebRTC para obtener la IP local
        const peerConnection = new RTCPeerConnection({
          iceServers: []
        });
        
        peerConnection.createDataChannel('');
        
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
            const ipMatch = event.candidate.candidate.match(ipRegex);
            if (ipMatch) {
              setLocalIP(ipMatch[1]);
            }
          }
        };
      } catch (err) {
        console.error('Error al obtener IP local:', err);
      }
    };
    
    detectDeviceInfo();
    getLocalIP();
  }, [])

  // Resetear el formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setTipoUsuario("")
      setPassword("")
      setError("")
      
      // Intentar obtener la ubicación nuevamente cuando se abre el formulario
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              error: null
            });
          },
          (err) => {
            console.error('Error al actualizar la ubicación:', err);
            setLocation(prev => ({
              ...prev,
              error: `Error al actualizar: ${err.message}`
            }));
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
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
          deviceInfo: {
            ip: localIP || 'unknown',
            dispositivo: deviceInfo.dispositivo,
            userAgent: deviceInfo.userAgent,
            platform: deviceInfo.platform,
            location: location.latitude && location.longitude 
              ? `${location.latitude},${location.longitude}` 
              : 'ubicacion_desconocida'
          },
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
