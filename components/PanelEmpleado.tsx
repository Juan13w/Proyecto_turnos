"use client"

import type React from "react"
import { useState, useEffect } from "react"
import "./PanelEmpleado.css"

interface PanelEmpleadoProps {
  user: {
    id: number
    email: string
    turno?: {
      id: number
      hora_entrada?: string
      hora_salida?: string
    }
  }
  onLogout?: () => void
}

const PanelEmpleado: React.FC<PanelEmpleadoProps> = ({ user, onLogout }) => {
  const [horaActual, setHoraActual] = useState<string>("")
  const [fechaActual, setFechaActual] = useState<string>("")
  const [showCompletado, setShowCompletado] = useState(false)
  const [mensaje, setMensaje] = useState<string>("")
  const [loading, setLoading] = useState<string>("")

  // Función para verificar si la hora actual está dentro de un rango permitido
  const estaEnRangoHorario = (
    horaInicio: string,
    horaFin: string,
    tipo: string,
  ): { valido: boolean; mensaje: string } => {
    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minutosActual = ahora.getMinutes()
    const segundosActual = ahora.getSeconds()

    const tiempoActual = horaActual * 60 + minutosActual + segundosActual / 60
    const [horaIni, minutoIni] = horaInicio.split(":").map(Number)
    const [horaEnd, minutoEnd] = horaFin.split(":").map(Number)

    const tiempoInicio = horaIni * 60 + minutoIni
    const tiempoFin = horaEnd * 60 + minutoEnd

    const esValido = tiempoActual >= tiempoInicio && tiempoActual <= tiempoFin

    console.log(`\n🔍 Validando ${horaInicio}-${horaFin} (${tipo}):`)
    console.log(
      `🕒 Hora actual: ${horaActual.toString().padStart(2, "0")}:${minutosActual.toString().padStart(2, "0")}:${segundosActual.toString().padStart(2, "0")}`,
    )
    console.log(`⏱️ Tiempo actual (min): ${tiempoActual.toFixed(2)}`)
    console.log(`📊 Rango (min): ${tiempoInicio} (${horaInicio}) - ${tiempoFin} (${horaFin})`)

    if (esValido) {
      console.log(`✅ ${tipo} está dentro del rango permitido`)
    } else {
      if (tiempoActual < tiempoInicio) {
        console.log(`⏳ ${tipo} es demasiado temprano. Espera hasta las ${horaInicio}`)
      } else if (tiempoActual > tiempoFin) {
        console.log(`⌛ ${tipo} es demasiado tarde. El horario terminó a las ${horaFin}`)
      }
    }

    return {
      valido: esValido,
      mensaje: esValido ? "" : `Fuera de horario (${horaInicio} - ${horaFin})`,
    }
  }

  // Función para verificar si un tipo de registro está en su horario permitido
  const validarHorarioRegistro = (tipo: string) => {
    const ahora = new Date()
    const diaActual = ahora.getDay()
    const nombreDia = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][diaActual]

    console.group(`=== Validando ${tipo} (${nombreDia}) ===`)
    console.log(
      `Hora actual: ${ahora.getHours().toString().padStart(2, "0")}:${ahora.getMinutes().toString().padStart(2, "0")}:${ahora.getSeconds().toString().padStart(2, "0")}`,
    )

    if (diaActual === 0) {
      // 0 es domingo
      const mensaje = "⛔ No se permite registrar los domingos"
      console.log(mensaje)
      console.groupEnd()
      return { valido: false, mensaje: "No se permite registrar los domingos" }
    }

    // Los rangos de horario han sido ajustados para pruebas
    const horarios = {
      entrada: { inicio: "06:00", fin: "08:30" },
      break1_salida: { inicio: "09:00", fin: "10:30" },
      break1_entrada: { inicio: "10:30", fin: "11:30" },
      almuerzo_salida: { inicio: "10:00", fin: "13:00" },
      almuerzo_entrada: { inicio: "13:00", fin: "14:30" },
      break2_salida: { inicio: "14:30", fin: "15:30" }, 
      salida: { inicio: "16:30", fin: "17:30" },
    }

    if (!horarios[tipo as keyof typeof horarios]) {
      console.log("❌ Tipo de registro no válido:", tipo)
      console.groupEnd()
      return { valido: false, mensaje: `Tipo de registro no válido: ${tipo}` }
    }

    const { inicio, fin } = horarios[tipo as keyof typeof horarios]
    console.log(`🕒 Rango horario configurado para ${tipo}: ${inicio} - ${fin}`)

    const resultado = estaEnRangoHorario(inicio, fin, tipo)

    if (resultado.valido) {
      console.log(`✅ ${tipo} está en horario permitido`)
    } else {
      console.log(`❌ ${tipo} está fuera de horario: ${resultado.mensaje}`)
    }

    console.groupEnd()
    return resultado
  }

  // Función para cargar los registros existentes
  const cargarRegistros = async () => {
    if (!user?.id) return

    const now = new Date()
    const fechaHoy =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0")

    console.log("Cargando registros para fecha:", fechaHoy)

    try {
      const response = await fetch(`/api/registro?empleadoId=${user.id}&fecha=${fechaHoy}`)
      if (response.ok) {
        const data = await response.json()
        if (data.registros && data.registros.length > 0) {
          const registroHoy = data.registros[0]
          console.log("Registro encontrado:", registroHoy)
          setRegistro({
            entrada: registroHoy.hora_entrada || "",
            break1Salida: registroHoy.break1_salida || "",
            break1Entrada: registroHoy.break1_entrada || "",
            almuerzoSalida: registroHoy.almuerzo_salida || "",
            almuerzoEntrada: registroHoy.almuerzo_entrada || "",
            break2Salida: registroHoy.break2_salida || "",
            break2Entrada: registroHoy.break2_entrada || "",
            salida: registroHoy.hora_salida || "",
          })
        } else {
          console.log("No se encontraron registros para hoy")
          setRegistro({
            entrada: "",
            break1Salida: "",
            break1Entrada: "",
            almuerzoSalida: "",
            almuerzoEntrada: "",
            break2Salida: "",
            break2Entrada: "",
            salida: "",
          })
        }
      } else {
        setMensaje("Error al cargar registros")
      }
    } catch (error) {
      console.error("Error al cargar registros:", error)
      setMensaje("Error de conexión al cargar registros")
    }
  }

  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date()
      setHoraActual(
        ahora.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      )
      setFechaActual(
        ahora
          .toLocaleDateString("es-CO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
          .toUpperCase(),
      )
    }

    actualizarHora()
    const timer = setInterval(actualizarHora, 1000)
    cargarRegistros()

    return () => clearInterval(timer)
  }, [user?.id])

  const [registro, setRegistro] = useState({
    entrada: "",
    break1Salida: "",
    break1Entrada: "",
    almuerzoSalida: "",
    almuerzoEntrada: "",
    break2Salida: "",
    break2Entrada: "",
    salida: "",
  })

  const guardarRegistroCompleto = async (esSalida = false) => {
    if (esSalida) {
      setMensaje("Jornada laboral finalizada. ¡Hasta pronto!")
      setShowCompletado(true)
    }
    return true
  }

  const validarOrdenRegistro = (campo: keyof typeof registro): { valido: boolean; mensaje?: string } => {
    // Para pruebas: no validar orden de registros, solo horario y si ya está registrado
    if (registro[campo]) {
      return { valido: false, mensaje: `Ya se ha registrado la ${campo.replace(/([A-Z])/g, " $1").toLowerCase()}` }
    }

    // Convertir campo a tipo para validar horario (usar guiones bajos)
    const tipo = campo.replace(/([A-Z])/g, "_$1").toLowerCase()
    const validacionHorario = validarHorarioRegistro(tipo)
    if (!validacionHorario.valido) {
      console.log(`Validación de horario fallida para ${campo}:`, validacionHorario.mensaje)
      return validacionHorario
    }

    console.log(`Validación exitosa para ${campo} (sin orden estricto para pruebas)`)
    return { valido: true }
  }

  const registrarHora = async (campo: keyof typeof registro) => {
    if (!user?.id) {
      setMensaje("No se encontró el empleado asignado. Comunícate con RRHH.")
      return
    }

    const validacion = validarOrdenRegistro(campo)
    if (!validacion.valido) {
      setMensaje(validacion.mensaje || "No se puede registrar esta hora en este momento")
      return
    }

    setLoading(campo)
    setMensaje("")
    const ahora = new Date()
    const hora = ahora.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })

    const nuevoRegistro = { ...registro, [campo]: hora }
    setRegistro(nuevoRegistro)

    let tipo = ""
    switch (campo) {
      case "entrada":
        tipo = "entrada"
        break
      case "salida":
        tipo = "salida"
        break
      case "break1Salida":
        tipo = "break1_salida"
        break
      case "break1Entrada":
        tipo = "break1_entrada"
        break
      case "almuerzoSalida":
        tipo = "almuerzo_salida"
        break
      case "almuerzoEntrada":
        tipo = "almuerzo_entrada"
        break
      case "break2Salida":
        tipo = "break2_salida"
        break
      case "break2Entrada":
        tipo = "break2_entrada"
        break
      default:
        tipo = campo
    }

    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empleadoId: user.id, tipo }),
      })

      const data = await res.json()
      if (data.success) {
        setMensaje(`Hora de ${tipo.replace("_", " ")} registrada correctamente.`)
        if (tipo === "salida") {
          await guardarRegistroCompleto(true)
        }
      } else {
        setMensaje(data.error || "Error al registrar hora")
        setRegistro((prev) => ({ ...prev, [campo]: "" }))
      }
    } catch (error) {
      setRegistro((prev) => ({ ...prev, [campo]: "" }))
      setMensaje("Error de conexión al guardar el registro")
    } finally {
      setLoading("")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMensaje("Esta función no es necesaria, los registros se guardan automáticamente.")
  }

  const isSubmitDisabled = Object.values(registro).some((v) => v === "")

  return (
    <div className="panel-empleado-bg">
      <div className="panel-empleado-container">
        <div className="panel-empleado-content">
          {showCompletado && (
            <div className="modal-jornada-completada">
              <div className="modal-jornada-content">
                <h2>Jornada laboral completada</h2>
                <button
                  className="cerrar-sesion-btn"
                  onClick={() => {
                    setRegistro({
                      entrada: "",
                      break1Salida: "",
                      break1Entrada: "",
                      almuerzoSalida: "",
                      almuerzoEntrada: "",
                      break2Salida: "",
                      break2Entrada: "",
                      salida: "",
                    })
                    setMensaje("")
                    setShowCompletado(false)
                    if (onLogout) onLogout()
                  }}
                >
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
                setRegistro({
                  entrada: "",
                  break1Salida: "",
                  break1Entrada: "",
                  almuerzoSalida: "",
                  almuerzoEntrada: "",
                  break2Salida: "",
                  break2Entrada: "",
                  salida: "",
                })
                setMensaje("")
                setShowCompletado(false)
                if (onLogout) onLogout()
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

            <form onSubmit={handleSubmit} className="registro-horarios-form">
              <div className="registro-grid">
                <RegistroCard
                  emoji="👋"
                  label="Entrada"
                  time={registro.entrada}
                  onRegister={() => registrarHora("entrada")}
                  isLoading={loading === "entrada"}
                  type="entrada"
                  isDisabled={!!registro.entrada || !validarHorarioRegistro("entrada").valido}
                  disabledReason={registro.entrada ? "Ya registrado" : validarHorarioRegistro("entrada").mensaje}
                />

                <RegistroCard
                  emoji="☕"
                  label="Salida Break 1"
                  time={registro.break1Salida}
                  onRegister={() => registrarHora("break1Salida")}
                  isLoading={loading === "break1Salida"}
                  type="break1_salida"
                  isDisabled={!!registro.break1Salida || !validarHorarioRegistro("break1_salida").valido}
                  disabledReason={
                    registro.break1Salida ? "Ya registrado" : validarHorarioRegistro("break1_salida").mensaje
                  }
                />

                <RegistroCard
                  emoji="☕"
                  label="Entrada Break 1"
                  time={registro.break1Entrada}
                  onRegister={() => registrarHora("break1Entrada")}
                  isLoading={loading === "break1Entrada"}
                  type="break1_entrada"
                  isDisabled={!!registro.break1Entrada || !validarHorarioRegistro("break1_entrada").valido}
                  disabledReason={
                    registro.break1Entrada ? "Ya registrado" : validarHorarioRegistro("break1_entrada").mensaje
                  }
                />

                <RegistroCard
                  emoji="🍽️"
                  label="Salida Almuerzo"
                  time={registro.almuerzoSalida}
                  onRegister={() => registrarHora("almuerzoSalida")}
                  isLoading={loading === "almuerzoSalida"}
                  type="almuerzo_salida"
                  isDisabled={!!registro.almuerzoSalida || !validarHorarioRegistro("almuerzo_salida").valido}
                  disabledReason={
                    registro.almuerzoSalida ? "Ya registrado" : validarHorarioRegistro("almuerzo_salida").mensaje
                  }
                />

                <RegistroCard
                  emoji="🍽️"
                  label="Entrada Almuerzo"
                  time={registro.almuerzoEntrada}
                  onRegister={() => registrarHora("almuerzoEntrada")}
                  isLoading={loading === "almuerzoEntrada"}
                  type="almuerzo_entrada"
                  isDisabled={!!registro.almuerzoEntrada || !validarHorarioRegistro("almuerzo_entrada").valido}
                  disabledReason={
                    registro.almuerzoEntrada ? "Ya registrado" : validarHorarioRegistro("almuerzo_entrada").mensaje
                  }
                />

                <RegistroCard
                  emoji="☕"
                  label="Salida Break 2"
                  time={registro.break2Salida}
                  onRegister={() => registrarHora("break2Salida")}
                  isLoading={loading === "break2Salida"}
                  type="break2_salida"
                  isDisabled={!!registro.break2Salida || !validarHorarioRegistro("break2_salida").valido}
                  disabledReason={
                    registro.break2Salida ? "Ya registrado" : validarHorarioRegistro("break2_salida").mensaje
                  }
                />

                <RegistroCard
                  emoji="☕"
                  label="Entrada Break 2"
                  time={registro.break2Entrada}
                  onRegister={() => registrarHora("break2Entrada")}
                  isLoading={loading === "break2Entrada"}
                  type="break2_entrada"
                  isDisabled={!!registro.break2Entrada || !validarHorarioRegistro("break2_entrada").valido}
                  disabledReason={
                    registro.break2Entrada ? "Ya registrado" : validarHorarioRegistro("break2_entrada").mensaje
                  }
                />

                <RegistroCard
                  emoji="👋"
                  label="Salida"
                  time={registro.salida}
                  onRegister={() => registrarHora("salida")}
                  isLoading={loading === "salida"}
                  type="salida"
                  isDisabled={!!registro.salida || !validarHorarioRegistro("salida").valido}
                  disabledReason={registro.salida ? "Ya registrado" : validarHorarioRegistro("salida").mensaje}
                />
              </div>

              {mensaje && (
                <div className={`message ${mensaje.toLowerCase().includes("error") ? "error" : "success"}`}>
                  {mensaje}
                </div>
              )}
            </form>
          </div>
        </div>
        <div className="panel-empleado-image"></div>
      </div>
    </div>
  )
}

interface RegistroCardProps {
  emoji: string
  label: string
  time: string
  onRegister: () => void
  isLoading: boolean
  type: string
  isDisabled?: boolean
  disabledReason?: string
}

const RegistroCard: React.FC<RegistroCardProps> = ({
  emoji,
  label,
  time,
  onRegister,
  isLoading,
  type,
  isDisabled = false,
  disabledReason = "",
}: RegistroCardProps) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleClick = () => {
    if (!isDisabled) {
      onRegister()
    }
  }

  return (
    <div
      className={`registro-card card-${type} ${isDisabled ? "disabled" : ""}`}
      onMouseEnter={() => isDisabled && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="registro-label">
        <span className={`registro-emoji emoji-${type}`}>{emoji}</span>
        {label}
      </span>
      <div className="registro-time">
        <input type="text" value={time || "--:--:--"} placeholder="--:--:--" disabled className="registro-input" />
        {time && <span className="registro-check">✓</span>}
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled || isLoading}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          isDisabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        title={isDisabled ? disabledReason : ""}
      >
        {isLoading ? "Registrando..." : time ? "Registrado" : "Registrar"} Hora
      </button>
      {showTooltip && isDisabled && disabledReason && <div className="registro-tooltip">{disabledReason}</div>}
    </div>
  )
}

export default PanelEmpleado
