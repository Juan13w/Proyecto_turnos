import React, { useState, useEffect } from "react";
import "./PanelEmpleado.css";
 

interface PanelEmpleadoProps {
  user: {
    id: number;
    email: string;
    turno?: {
      id: number;
      hora_entrada?: string;
      hora_salida?: string;
    };
  };
  onLogout?: () => void;
}

const PanelEmpleado: React.FC<PanelEmpleadoProps> = ({ user, onLogout }) => {
  const [horaActual, setHoraActual] = useState<string>("");
  const [fechaActual, setFechaActual] = useState<string>("");
  const [showCompletado, setShowCompletado] = useState(false);
  const [mensaje, setMensaje] = useState<string>("");
  const [loading, setLoading] = useState<string>("");
  

  

  // Función para cargar los registros existentes
  const cargarRegistros = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/registro?empleadoId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.registros && data.registros.length > 0) {
          // Tomamos el último registro (el más reciente)
          const ultimoRegistro = data.registros[0];
          setRegistro({
            entrada: ultimoRegistro.hora_entrada || "",
            break1Salida: ultimoRegistro.break1_salida || "",
            break1Entrada: ultimoRegistro.break1_entrada || "",
            almuerzoSalida: ultimoRegistro.almuerzo_salida || "",
            almuerzoEntrada: ultimoRegistro.almuerzo_entrada || "",
            break2Salida: ultimoRegistro.break2_salida || "",
            break2Entrada: ultimoRegistro.break2_entrada || "",
            salida: ultimoRegistro.hora_salida || ""
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
    }
  };

  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date();
      setHoraActual(
        ahora.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setFechaActual(
        ahora.toLocaleDateString("es-CO", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).toUpperCase()
      );
    };

    // Inicializar hora y fecha
    actualizarHora();
    const timer = setInterval(actualizarHora, 1000);
    
    // Cargar registros existentes
    cargarRegistros();
    
    return () => clearInterval(timer);
  }, [user?.id]);

  const [registro, setRegistro] = useState({
    entrada: "",
    break1Salida: "",
    break1Entrada: "",
    almuerzoSalida: "",
    almuerzoEntrada: "",
    break2Salida: "",
    break2Entrada: "",
    salida: "",
  });

  const guardarRegistroCompleto = async (esSalida = false) => {
    // Esta función ahora solo maneja el cierre de sesión cuando es necesario
    // ya que cada registro se guarda individualmente en la API
    if (esSalida) {
      // Si es una salida, mostramos el mensaje de despedida
      setMensaje("Jornada laboral finalizada. ¡Hasta pronto!");
      setShowCompletado(true);
    }
    return true;
  };

  const validarOrdenRegistro = (campo: keyof typeof registro): { valido: boolean; mensaje?: string } => {
    const ordenCampos: (keyof typeof registro)[] = [
      'entrada',
      'break1Salida',
      'break1Entrada',
      'almuerzoSalida',
      'almuerzoEntrada',
      'break2Salida',
      'break2Entrada',
      'salida'
    ];

    const indiceCampoActual = ordenCampos.indexOf(campo);
    
    // Verificar si el campo ya está registrado
    if (registro[campo]) {
      return { valido: false, mensaje: `Ya se ha registrado la ${campo.replace(/([A-Z])/g, ' $1').toLowerCase()}` };
    }

    // Para el primer registro (entrada), no hay que verificar nada más
    if (indiceCampoActual === 0) return { valido: true };

    // Verificar que todos los campos anteriores estén registrados
    for (let i = 0; i < indiceCampoActual; i++) {
      const campoAnterior = ordenCampos[i];
      if (!registro[campoAnterior]) {
        const nombreCampoAnterior = campoAnterior.replace(/([A-Z])/g, ' $1').toLowerCase();
        return { 
          valido: false, 
          mensaje: `Primero debes registrar la ${nombreCampoAnterior}` 
        };
      }
    }

    return { valido: true };
  };

  const registrarHora = async (campo: keyof typeof registro) => {
    if (!user?.turno?.id) {
      setMensaje("No se encontró el turno asignado. Comunícate con RRHH.");
      return;
    }

    // Validar el orden de registro
    const validacion = validarOrdenRegistro(campo);
    if (!validacion.valido) {
      setMensaje(validacion.mensaje || 'No se puede registrar esta hora en este momento');
      return;
    }

    setLoading(campo);
    setMensaje("");
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString("es-CO", { 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit", 
      hour12: false 
    });
    
    // Creamos un objeto con la actualización del estado
    const nuevoRegistro = { ...registro, [campo]: hora };
    
    // Actualizamos el estado local primero para una mejor experiencia de usuario
    setRegistro(nuevoRegistro);
    
    let tipo = "";
    switch (campo) {
      case "entrada": tipo = "entrada"; break;
      case "salida": tipo = "salida"; break;
      case "break1Salida": tipo = "break1_salida"; break;
      case "break1Entrada": tipo = "break1_entrada"; break;
      case "almuerzoSalida": tipo = "almuerzo_salida"; break;
      case "almuerzoEntrada": tipo = "almuerzo_entrada"; break;
      case "break2Salida": tipo = "break2_salida"; break;
      case "break2Entrada": tipo = "break2_entrada"; break;
      default: tipo = campo;
    }
    
    try {
      // Primero registramos la hora en el turno
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnoId: user.turno.id, tipo })
      });
      
      const data = await res.json();
      if (data.success) {
        // Actualizamos el estado local
        setRegistro(nuevoRegistro);
        
        // Mostramos el mensaje de confirmación
        const esSalida = tipo === 'salida';
        setMensaje(`Hora de ${tipo.replace('_', ' ')} registrada correctamente.`);
        
        // Si es una salida, mostramos el mensaje de despedida
        if (esSalida) {
          await guardarRegistroCompleto(true);
        }
      } else {
        // Si hay un error, mostramos el mensaje de error
        setMensaje(data.error || "Error al registrar hora");
        
        // Solo revertimos el cambio en el estado local si el error no es de validación
        if (!data.error?.includes('Ya existe un registro') && !data.error?.includes('tiene un valor')) {
          setRegistro(prev => ({ ...prev, [campo]: "" }));
        }
      }
    } catch (error) {
      // Si hay un error, revertimos el cambio en el estado local
      setRegistro(prev => ({ ...prev, [campo]: "" }));
      setMensaje("Error de conexión al guardar el registro");
    } finally {
      setLoading("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/registro/historial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empleado_email: user.email,
          fecha: new Date().toLocaleDateString('es-ES'),
          hora_entrada: registro.entrada || null,
          hora_salida: registro.salida || null,
          break1_salida: registro.break1Salida || null,
          break1_entrada: registro.break1Entrada || null,
          almuerzo_salida: registro.almuerzoSalida || null,
          almuerzo_entrada: registro.almuerzoEntrada || null,
          break2_salida: registro.break2Salida || null,
          break2_entrada: registro.break2Entrada || null,
        })
      });
      if (response.ok) {
        setMensaje("Registro guardado exitosamente");
        setShowCompletado(true);
      } else {
        setMensaje("Error al guardar el registro");
      }
    } catch (error) {
      console.error("Error al guardar el registro:", error);
      setMensaje("Error de conexión al guardar el registro");
    }
  };

  const isSubmitDisabled = Object.values(registro).some(v => v === "");

  return (
    <div className="panel-empleado-bg">
      <div className="panel-empleado-container">
        <div className="panel-empleado-content">
          {showCompletado && (
            <div className="modal-jornada-completada">
              <div className="modal-jornada-content">
                <h2>Jornada laboral completada</h2>
                <button className="cerrar-sesion-btn" onClick={() => {
                  // Reset registration state before logging out
                  setRegistro({
                    entrada: "",
                    break1Salida: "",
                    break1Entrada: "",
                    almuerzoSalida: "",
                    almuerzoEntrada: "",
                    break2Salida: "",
                    break2Entrada: "",
                    salida: ""
                  });
                  setMensaje("");
                  setShowCompletado(false);
                  if (onLogout) onLogout();
                }}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

        <div className="panel-empleado-header">
          <div>
            <h2>Panel de Empleado</h2>
            <div className="panel-empleado-user">👤 {user?.email}</div>
          </div>
          <button 
            onClick={() => {
              // Limpiar el estado local
              setRegistro({
                entrada: "",
                break1Salida: "",
                break1Entrada: "",
                almuerzoSalida: "",
                almuerzoEntrada: "",
                break2Salida: "",
                break2Entrada: "",
                salida: ""
              });
              setMensaje("");
              setShowCompletado(false);
              
              // Cerrar sesión
              if (onLogout) onLogout();
            }}
            className="logout-button"
            title="Cerrar sesión"
          >
            Cerrar sesión
          </button>
          <div className="panel-empleado-fecha-hora">
            <div className="panel-empleado-hora">{horaActual}</div>
            <div className="panel-empleado-fecha">{fechaActual}</div>
          </div>
        </div>

        <div className="panel-empleado-main">
          <h3>Registro de Horarios</h3>
          <p>Registra tus horarios de entrada, breaks y salida</p>
          
          <form onSubmit={(e) => { e.preventDefault(); }} className="registro-horarios-form">
            <div className="registro-grid">
              <RegistroCard 
                type="entrada" 
                emoji="↪" 
                label="Entrada" 
                time={registro.entrada} 
                onRegister={() => registrarHora('entrada')} 
                isLoading={loading === 'entrada'}
                isDisabled={false} // Siempre habilitado como primer paso
              />
              
              <RegistroCard 
                type="pausa" 
                emoji="☕︎" 
                label="Salida Break 1" 
                time={registro.break1Salida} 
                onRegister={() => registrarHora('break1Salida')} 
                isLoading={loading === 'break1Salida'}
                isDisabled={!registro.entrada}
                disabledReason={!registro.entrada ? 'Primero debes registrar la entrada' : ''}
              />
              
              <RegistroCard 
                type="entrada" 
                emoji="☕︎" 
                label="Entrada Break 1" 
                time={registro.break1Entrada} 
                onRegister={() => registrarHora('break1Entrada')} 
                isLoading={loading === 'break1Entrada'}
                isDisabled={!registro.break1Salida}
                disabledReason={!registro.break1Salida ? 'Primero debes registrar la salida del break 1' : ''}
              />
              
              <RegistroCard 
                type="pausa" 
                emoji="🍴︎" 
                label="Salida Almuerzo" 
                time={registro.almuerzoSalida} 
                onRegister={() => registrarHora('almuerzoSalida')} 
                isLoading={loading === 'almuerzoSalida'}
                isDisabled={!registro.break1Entrada}
                disabledReason={!registro.break1Entrada ? 'Primero debes registrar la entrada del break 1' : ''}
              />
              
              <RegistroCard 
                type="entrada" 
                emoji="🍴︎" 
                label="Entrada Almuerzo" 
                time={registro.almuerzoEntrada} 
                onRegister={() => registrarHora('almuerzoEntrada')} 
                isLoading={loading === 'almuerzoEntrada'}
                isDisabled={!registro.almuerzoSalida}
                disabledReason={!registro.almuerzoSalida ? 'Primero debes registrar la salida de almuerzo' : ''}
              />
              
              <RegistroCard 
                type="pausa" 
                emoji="☕︎" 
                label="Salida Break 2" 
                time={registro.break2Salida} 
                onRegister={() => registrarHora('break2Salida')} 
                isLoading={loading === 'break2Salida'}
                isDisabled={!registro.almuerzoEntrada}
                disabledReason={!registro.almuerzoEntrada ? 'Primero debes registrar la entrada de almuerzo' : ''}
              />
              
              <RegistroCard 
                type="entrada" 
                emoji="☕︎" 
                label="Entrada Break 2" 
                time={registro.break2Entrada} 
                onRegister={() => registrarHora('break2Entrada')} 
                isLoading={loading === 'break2Entrada'}
                isDisabled={!registro.break2Salida}
                disabledReason={!registro.break2Salida ? 'Primero debes registrar la salida del break 2' : ''}
              />
              
              <RegistroCard 
                type="salida" 
                emoji="↩" 
                label="Salida" 
                time={registro.salida} 
                onRegister={() => registrarHora('salida')} 
                isLoading={loading === 'salida'}
                isDisabled={!registro.break2Entrada}
                disabledReason={!registro.break2Entrada ? 'Primero debes registrar la entrada del break 2' : ''}
              />
            </div>

            {mensaje && (
              <div className={`message ${mensaje.toLowerCase().includes('error') ? 'error' : 'success'}`}>
                {mensaje}
              </div>
            )}
            
          </form>
        </div>
        </div>
        <div className="panel-empleado-image"></div>
      </div>
    </div>
  );
};

// Interfaz para el componente RegistroCard
interface RegistroCardProps {
  emoji: string;
  label: string;
  time: string;
  onRegister: () => void;
  isLoading: boolean;
  type: string;
  isDisabled?: boolean;
  disabledReason?: string;
}

const RegistroCard: React.FC<RegistroCardProps> = ({
  emoji, 
  label, 
  time, 
  onRegister, 
  isLoading, 
  type,
  isDisabled = false,
  disabledReason = ''
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const handleClick = () => {
      if (!isDisabled) {
        onRegister();
      }
    };

    return (
      <div 
        className={`registro-card card-${type} ${isDisabled ? 'disabled' : ''}`}
        onMouseEnter={() => isDisabled && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="registro-label">
        <span className={`registro-emoji emoji-${type}`}>
          {emoji}
        </span> 
        {label}
      </span>
      <div className="registro-time">
        <input 
          type="text" 
          value={time || "--:--:--"} 
          placeholder="--:--:--" 
          disabled 
          className="registro-input"
        />
        {time && <span className="registro-check">✓</span>}
      </div>
      <button 
        type="button" 
        onClick={handleClick}
        disabled={isLoading || isDisabled}
        className={`registro-btn ${isLoading ? 'loading' : ''}`}
        title={isDisabled ? disabledReason : ''}
      >
        {isLoading ? (
          <span className="loading-spinner">⏳</span>
        ) : time ? (
          '✓ Registrado'
        ) : (
          'Registrar Hora'
        )}
      </button>
      {showTooltip && isDisabled && disabledReason && (
        <div className="registro-tooltip">
          {disabledReason}
        </div>
      )}
    </div>
  );
};

export default PanelEmpleado;
