import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormState {
  email: string;
  password: string;
  loading: boolean;
  error: string;
  tipoUsuario: 'empleado' | 'administrador' | 'ninguno' | '';
  deviceInfo: {
    dispositivo: string;
    userAgent: string;
    platform: string;
  };
  location: {
    latitude: number | null;
    longitude: number | null;
    accuracy?: number | null;
    error: string | null;
  };
  localIP: string;
}

interface UseLoginFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (userData: any) => void;
}

export const useLoginForm = ({ isOpen, onClose, onLogin }: UseLoginFormProps) => {
  const router = useRouter();
  const [state, setState] = useState<LoginFormState>({
    email: '',
    password: '',
    loading: false,
    error: '',
    tipoUsuario: '',
    deviceInfo: { dispositivo: 'Computador', userAgent: '', platform: '' },
    location: { latitude: null, longitude: null, accuracy: null, error: null },
    localIP: '',
  });

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Actualizar el estado de manera segura
  const updateState = useCallback((updates: Partial<LoginFormState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Función para obtener la ubicación del usuario con la máxima precisión posible
  const getGeolocation = useCallback(() => {
    if (!navigator.geolocation) return;

    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;
    const startTime = Date.now();
    const MAX_WAIT_TIME = 30000; // 30 segundos máximo de espera

    const options: PositionOptions = {
      enableHighAccuracy: true,     // Usar GPS si está disponible
      timeout: 60000,              // 60 segundos de timeout
      maximumAge: 0                // No usar caché
    };

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };

    // Usamos watchPosition para obtener múltiples lecturas
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Si es la primera lectura o es más precisa que la anterior
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
          
          // Actualizamos el estado con la mejor posición encontrada
          updateState({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              error: null
            }
          });

          // Si la precisión es muy buena (menos de 20 metros), terminamos
          if (position.coords.accuracy <= 20) {
            cleanup();
          }
        }

        // Si ha pasado el tiempo máximo de espera, terminamos
        if (Date.now() - startTime > MAX_WAIT_TIME) {
          cleanup();
        }
      },
      // Callback de error silencioso
      () => cleanup(),
      options
    );

    // Limpieza en caso de que el componente se desmonte
    return cleanup;
  }, [updateState]);

  // Solicitar permiso de ubicación cuando el componente se monte
  useEffect(() => {
    if (state.tipoUsuario === 'empleado') {
      getGeolocation();
    }
  }, [state.tipoUsuario, getGeolocation]);

  // Configuración inicial del dispositivo
  useEffect(() => {
    const setupDeviceInfo = () => {
      const userAgent = navigator.userAgent;
      let deviceType = 'Computador';
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
      const isTablet = /iPad|Android(?!.*Mobile)|Tablet|Silk/i.test(userAgent);

      if (isMobile) deviceType = 'Móvil';
      else if (isTablet) deviceType = 'Tablet';

      // Detectar sistema operativo
      let os = 'Sistema';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac OS')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

      // Detectar navegador
      let browser = 'Navegador';
      if (userAgent.includes('Firefox/')) browser = 'Firefox';
      else if (userAgent.includes('Edg/')) browser = 'Edge';
      else if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) browser = 'Opera';
      else if (userAgent.includes('Chrome/')) browser = 'Chrome';
      else if (userAgent.includes('Safari/')) browser = 'Safari';

      updateState({
        deviceInfo: {
          dispositivo: `${os} ${deviceType} ${browser}`.substring(0, 50),
          userAgent,
          platform: navigator.platform,
        },
      });
    };

    const getLocalIP = async () => {
      try {
        const peerConnection = new RTCPeerConnection({ iceServers: [] });
        peerConnection.createDataChannel('');
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            const ipMatch = event.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
            if (ipMatch) updateState({ localIP: ipMatch[1] });
          }
        };
      } catch (err) {
        console.error('Error al obtener IP local:', err);
      }
    };

    // Configurar información del dispositivo y obtener IP
    setupDeviceInfo();
    getLocalIP();
  }, [updateState]);

  // Manejar el cambio de tipo de usuario
  const handleTipoUsuarioChange = useCallback((tipo: 'empleado' | 'administrador' | 'ninguno' | '') => {
    updateState({ 
      tipoUsuario: tipo,
      error: '' 
    });
    
    // Si es empleado, solicitar ubicación
    if (tipo === 'empleado') {
      getGeolocation();
    }
  }, [getGeolocation, updateState]);
  
  // Manejar el envío del formulario
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!state.email) {
      updateState({ error: "Por favor ingresa tu correo electrónico" });
      return;
    }
    
    // Si aún no se ha verificado el tipo de usuario
    if (!state.tipoUsuario || state.tipoUsuario === 'ninguno') {
      const isEmployee = await handleEmailCheck(state.email);
      if (!isEmployee) {
        updateState({ error: "No se pudo verificar el tipo de usuario. Por favor, verifica tu correo." });
        return;
      }
    }
    
    // Si es administrador, verificar contraseña
    if (state.tipoUsuario === "administrador" && !state.password) {
      updateState({ error: "Por favor ingresa la contraseña de administrador" });
      return;
    }
    
    // Si es empleado, verificar que tengamos la ubicación
    if (state.tipoUsuario === "empleado") {
      if (!state.location.latitude || !state.location.longitude) {
        // Intentar obtener la ubicación nuevamente
        try {
          await new Promise<void>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                updateState({
                  location: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null
                  }
                });
                resolve();
              },
              (error) => {
                let errorMessage = 'Error al obtener la ubicación';
                if (error.PERMISSION_DENIED) {
                  errorMessage = 'Se requiere acceso a la ubicación para empleados. Por favor, habilita la geolocalización en la configuración de tu navegador.';
                }
                updateState({ 
                  error: errorMessage,
                  location: { 
                    ...state.location,
                    error: errorMessage 
                  }
                });
                reject(new Error(errorMessage));
              },
              { enableHighAccuracy: true, timeout: 10000 }
            );
          });
        } catch (error) {
          console.error('Error al obtener la ubicación:', error);
          return;
        }
      }
      
      if (state.location.error) {
        updateState({ error: state.location.error });
        return;
      }
    }

    updateState({ loading: true, error: '' });

    try {
      // Preparar los datos del dispositivo
      const deviceInfoData = {
        ip: state.localIP || 'unknown',
        dispositivo: state.deviceInfo.dispositivo,
        userAgent: state.deviceInfo.userAgent,
        platform: state.deviceInfo.platform,
        location: state.location.latitude && state.location.longitude
          ? `${state.location.latitude},${state.location.longitude}`
          : 'ubicacion_desconocida',
        accuracy: state.location.accuracy || null,
        source: state.location.latitude ? 'browser' : 'ip'
      };

      console.log('Enviando datos de login:', {
        email: state.email,
        deviceInfo: deviceInfoData,
        hasPassword: state.tipoUsuario === "administrador" ? '***' : 'none'
      });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.email,
          deviceInfo: deviceInfoData,
          ...(state.tipoUsuario === "administrador" && { password: state.password })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error en el inicio de sesión");
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        // Limpiar el formulario
        updateState({ email: '', password: '', tipoUsuario: '', error: '' });
        
        // Guardar datos de sesión
        const isAdmin = data.user.isAdmin;
        localStorage.setItem(isAdmin ? "adminLogueado" : "empleadoLogueado", "true");
        localStorage.setItem(isAdmin ? "adminData" : "empleadoData", JSON.stringify(data.user));
        
        // Notificar el inicio de sesión exitoso
        onLogin(data.user);
        onClose();
        
        // Forzar recarga para asegurar que se aplique la autenticación
        router.refresh();
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      updateState({ 
        error: error instanceof Error ? error.message : "Error en el inicio de sesión",
        loading: false 
      });
    }
  }, [state, onClose, onLogin, router, updateState]);

  // Verificar el tipo de usuario basado en el correo
  const handleEmailCheck = useCallback(async (email: string): Promise<boolean> => {
    if (!email) {
      updateState({ tipoUsuario: '', password: '' });
      return false;
    }
    
    try {
      const response = await fetch("/api/auth/identifica-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) throw new Error("Error al verificar el correo");
      
      const data = await response.json();
      
      if (data.tipo) {
        const updates: Partial<LoginFormState> = { 
          tipoUsuario: data.tipo,
          error: data.tipo === "ninguno" ? "El correo no está registrado" : ""
        };
        
        updateState(updates);
        return data.tipo === 'empleado';
      }
      
      return false;
    } catch (error) {
      console.error("Error al verificar el correo:", error);
      updateState({ 
        error: error instanceof Error ? error.message : "Error al verificar el correo"
      });
      return false;
    }
  }, [updateState]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    updateState({ 
      email: value,
      error: ""
    });
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (value) {
      debounceTimer.current = setTimeout(async () => {
        const isEmployee = await handleEmailCheck(value);
        if (isEmployee) {
          // Si es empleado, solicitar ubicación
          getGeolocation();
        } else {
          // Si no es empleado, limpiar la ubicación
          updateState({
            location: { latitude: null, longitude: null, error: null }
          });
        }
      }, 400);
    } else {
      updateState({ 
        tipoUsuario: "", 
        error: "",
        location: { latitude: null, longitude: null, error: null }
      });
    }
  }, [handleEmailCheck]);

  // Limpiar el timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Resetear el formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      updateState({ 
        tipoUsuario: "", 
        password: "", 
        error: "" 
      });
    }
  }, [isOpen, updateState]);

  // Handle email blur (validation when leaving the field)
  const handleEmailBlur = useCallback(() => {
    if (state.email) {
      handleEmailCheck(state.email);
    }
  }, [state.email, handleEmailCheck]);

  // Return all necessary state and handlers
  return {
    ...state,
    handleSubmit,
    handleEmailChange,
    handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => 
      updateState({ password: e.target.value }),
    handleTipoUsuarioChange,
    handleEmailBlur,
    isFormValid: Boolean(
      state.email && 
      (state.tipoUsuario === 'administrador' ? state.password : true) &&
      (state.tipoUsuario === 'empleado' ? state.location.latitude && state.location.longitude : true)
    ),
  };
}
