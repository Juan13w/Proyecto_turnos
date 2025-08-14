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
    location: { latitude: null, longitude: null, error: null },
    localIP: '',
  });

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Actualizar el estado de manera segura
  const updateState = useCallback((updates: Partial<LoginFormState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Configuración inicial del dispositivo y geolocalización
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

    setupDeviceInfo();
    getLocalIP();
  }, [updateState]);

  // Manejar el envío del formulario
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!state.email) {
      updateState({ error: "Por favor ingresa tu correo electrónico" });
      return;
    }
    
    if (state.tipoUsuario === "administrador" && !state.password) {
      updateState({ error: "Por favor ingresa la contraseña de administrador" });
      return;
    }

    updateState({ loading: true, error: '' });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.email,
          deviceInfo: {
            ip: state.localIP || 'unknown',
            dispositivo: state.deviceInfo.dispositivo,
            userAgent: state.deviceInfo.userAgent,
            platform: state.deviceInfo.platform,
            location: state.location.latitude && state.location.longitude
              ? `${state.location.latitude},${state.location.longitude}`
              : 'ubicacion_desconocida',
            accuracy: null,
            source: state.location.latitude ? 'browser' : 'ip'
          },
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
        
        // Guardar datos de sesión y redirigir
        const isAdmin = data.user.isAdmin;
        localStorage.setItem(isAdmin ? "adminLogueado" : "empleadoLogueado", "true");
        localStorage.setItem(isAdmin ? "adminData" : "empleadoData", JSON.stringify(data.user));
        
        onLogin(data.user);
        onClose();
        
        // Redirigir a la ruta correspondiente
        const targetPath = isAdmin ? '/admin' : '/empleado';
        try {
          router.replace(targetPath);
        } catch (_) {
          window.location.href = targetPath;
        }
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
        const updates: Partial<LoginFormState> = { tipoUsuario: data.tipo };
        
        if (data.tipo === "ninguno") {
          updates.error = "El correo no está registrado";
        } else {
          updates.error = "";
          if (data.tipo !== "administrador") updates.password = "";
        }
        
        updateState(updates);
        return data.tipo !== "ninguno";
      }
      
      throw new Error("Formato de respuesta inesperado");
    } catch (error) {
      console.error("Error al identificar usuario:", error);
      updateState({ 
        tipoUsuario: "", 
        error: "No se pudo verificar el correo. Por favor, inténtalo de nuevo." 
      });
      return false;
    }
  }, [updateState]);

  // Manejador de cambio de email con debounce
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    updateState({ email: value });
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    if (value) {
      debounceTimer.current = setTimeout(() => handleEmailCheck(value), 400);
    } else {
      updateState({ tipoUsuario: "", error: "" });
    }
  }, [handleEmailCheck, updateState]);

  // Manejador de blur para el campo de email
  const handleEmailBlur = useCallback(() => {
    if (state.email) handleEmailCheck(state.email);
  }, [state.email, handleEmailCheck]);

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

  return {
    ...state,
    handleSubmit,
    handleEmailChange,
    handleEmailBlur,
    handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => 
      updateState({ password: e.target.value }),
    isFormValid: state.email && (!state.tipoUsuario || state.tipoUsuario !== 'administrador' || state.password)
  };
};
