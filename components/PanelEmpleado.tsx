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
    actualizarHora();
    const timer = setInterval(actualizarHora, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const guardarRegistroCompleto = async (datosRegistro = registro) => {
    try {
      const response = await fetch("/api/registro/historial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empleado_email: user.email,
          fecha: new Date().toLocaleDateString('es-ES'),
          hora_entrada: datosRegistro.entrada || null,
          hora_salida: datosRegistro.salida || null,
          break1_salida: datosRegistro.break1Salida || null,
          break1_entrada: datosRegistro.break1Entrada || null,
          almuerzo_salida: datosRegistro.almuerzoSalida || null,
          almuerzo_entrada: datosRegistro.almuerzoEntrada || null,
          break2_salida: datosRegistro.break2Salida || null,
          break2_entrada: datosRegistro.break2Entrada || null,
        })
      });
      
      if (response.ok) {
        setMensaje("Registro guardado exitosamente");
        setShowCompletado(true);
        return true;
      } else {
        const errorData = await response.json();
        setMensaje(errorData.error || "Error al guardar el registro");
        return false;
      }
    } catch (error) {
      console.error("Error al guardar el registro:", error);
      setMensaje("Error de conexión al guardar el registro");
      return false;
    }
  };

  const registrarHora = async (campo: keyof typeof registro) => {
    if (!user?.turno?.id) {
      setMensaje("No se encontró el turno asignado. Comunícate con RRHH.");
      return;
    }
    setLoading(campo);
    setMensaje("");
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    
    // Creamos un objeto con la actualización del estado
    const nuevoRegistro = { ...registro, [campo]: hora };
    
    // Actualizamos el estado local primero para una mejor experiencia de usuario
    setRegistro(nuevoRegistro);
    
    let tipo = "";
    switch (campo) {
      case "entrada": tipo = "entrada"; break;
      case "salida": 
        tipo = "salida"; 
        break;
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
        setMensaje(`Hora registrada correctamente para ${tipo.replace('_', ' ')}.`);
        
        // Si es la hora de salida, guardamos automáticamente el registro completo
        if (campo === 'salida') {
          // Usamos el estado actualizado para guardar el registro completo
          const guardado = await guardarRegistroCompleto(nuevoRegistro);
          if (guardado) {
            setMensaje("Hora de salida registrada y guardada correctamente.");
          }
        }
      } else {
        // Si hay un error, revertimos el cambio en el estado local
        setRegistro(prev => ({ ...prev, [campo]: "" }));
        setMensaje(data.error || "Error al registrar hora");
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
      {showCompletado && (
        <div className="modal-jornada-completada">
          <div className="modal-jornada-content">
            <h2>Jornada laboral completada</h2>
            <button className="cerrar-sesion-btn" onClick={() => onLogout && onLogout()}>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <div className="panel-empleado-container">
        <div className="panel-empleado-header">
          <div>
            <h2>Panel de Empleado</h2>
            <div className="panel-empleado-user">👤 {user?.email}</div>
          </div>
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
              <RegistroCard type="entrada" emoji="↪" label="Entrada" time={registro.entrada} onRegister={() => registrarHora('entrada')} isLoading={loading === 'entrada'} />
              <RegistroCard type="pausa" emoji="☕︎" label="Salida Break 1" time={registro.break1Salida} onRegister={() => registrarHora('break1Salida')} isLoading={loading === 'break1Salida'} />
              <RegistroCard type="entrada" emoji="☕︎" label="Entrada Break 1" time={registro.break1Entrada} onRegister={() => registrarHora('break1Entrada')} isLoading={loading === 'break1Entrada'} />
              <RegistroCard type="pausa" emoji="🍴︎" label="Salida Almuerzo" time={registro.almuerzoSalida} onRegister={() => registrarHora('almuerzoSalida')} isLoading={loading === 'almuerzoSalida'} />
              <RegistroCard type="entrada" emoji="🍴︎" label="Entrada Almuerzo" time={registro.almuerzoEntrada} onRegister={() => registrarHora('almuerzoEntrada')} isLoading={loading === 'almuerzoEntrada'} />
              <RegistroCard type="pausa" emoji="☕︎" label="Salida Break 2" time={registro.break2Salida} onRegister={() => registrarHora('break2Salida')} isLoading={loading === 'break2Salida'} />
              <RegistroCard type="entrada" emoji="☕︎" label="Entrada Break 2" time={registro.break2Entrada} onRegister={() => registrarHora('break2Entrada')} isLoading={loading === 'break2Entrada'} />
              <RegistroCard type="salida" emoji="↩" label="Salida" time={registro.salida} onRegister={() => registrarHora('salida')} isLoading={loading === 'salida'} />
            </div>

            {mensaje && (
              <div className={`message ${mensaje.toLowerCase().includes('error') ? 'error' : 'success'}`}>
                {mensaje}
              </div>
            )}

            <div className="button-group">
              <button
                type="button"
                onClick={() => onLogout && onLogout()}
                className="cerrar-sesion-btn"
              >
                Cerrar Sesión
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const RegistroCard: React.FC<{emoji: string, label: string, time: string, onRegister: () => void, isLoading: boolean, type: string}> = ({emoji, label, time, onRegister, isLoading, type}) => (
  <div className={`registro-card card-${type}`}>
    <span className="registro-label"><span className={`registro-emoji emoji-${type}`}>{emoji}</span> {label}</span>
    <input 
      type="text" 
      value={time || "--:--:--"} 
      placeholder="--:--:--" 
      disabled 
      className="registro-input"
    />
    <button 
      type="button" 
      onClick={onRegister}
      disabled={isLoading}
      className="registro-btn"
    >
      {isLoading ? "Guardando..." : "Registrar Hora"}
    </button>
  </div>
);

export default PanelEmpleado;
