"use client"

import type React from "react"
import { useState, useEffect } from "react"
import "./LoginForm.css"

interface LoginFormProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (userData: any) => void
}

interface Sede {
  Id_sede_PK: number
  Nombre: string
  Direccion_IP: string
}

const LoginForm = ({ isOpen, onClose, onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("")
  const [sedeId, setSedeId] = useState("")
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tipoUsuario, setTipoUsuario] = useState<"empleado" | "administrador" | "ninguno" | "">("")
  const [password, setPassword] = useState("")

  // Cargar sedes al abrir el formulario
  useEffect(() => {
    if (isOpen) {
      fetchSedes()
      setTipoUsuario("")
      setPassword("")
    }
  }, [isOpen])

  const fetchSedes = async () => {
    try {
      const response = await fetch("/api/sedes")
      const data = await response.json()

      if (data.success) {
        setSedes(data.sedes)
      } else {
        setError("Error cargando las sedes")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error de conexión")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || (tipoUsuario !== "administrador" && !sedeId)) return;
    if (tipoUsuario === "administrador" && !password) {
      setError("Por favor ingresa la contraseña de administrador")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          ...(tipoUsuario !== "administrador" && { sedeId: Number.parseInt(sedeId) }),
          ...(tipoUsuario === "administrador" && { password })
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Guardar datos de sesión de empleado en localStorage
        if (!data.user.isAdmin) {
          localStorage.setItem("empleadoLogueado", "true");
          localStorage.setItem("empleadoData", JSON.stringify(data.user));
          window.location.reload();
        } else {
          localStorage.setItem("adminLogueado", "true");
          localStorage.setItem("adminData", JSON.stringify({
            email: data.user.email
          }));
          window.location.reload();
        }
        setEmail("")
        setSedeId("")
        setPassword("")
        setTipoUsuario("")
        setError("")
      } else {
        setError(data.error || "Error en el inicio de sesión")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Identificar tipo de usuario al salir del campo email o al cambiarlo
  let debounceTimer: NodeJS.Timeout;
  const handleEmailCheck = async (correo: string) => {
    if (!correo) {
      setTipoUsuario("");
      setPassword("");
      return;
    }
    try {
      const response = await fetch("/api/auth/identifica-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo })
      })
      const data = await response.json()
      console.log("data.tipo recibido:", data.tipo)
      setTipoUsuario(data.tipo)
      if (data.tipo === "ninguno") {
        setError("El correo no está registrado como empleado ni como administrador")
      } else {
        setError("")
      }
    } catch (error) {
      setTipoUsuario("")
      setError("No se pudo identificar el tipo de usuario")
    }
  }

  // Debounce para onChange
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      handleEmailCheck(e.target.value)
    }, 400)
  }

  // onBlur también dispara la verificación inmediata
  const handleEmailBlur = () => {
    handleEmailCheck(email)
  }

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

          {(tipoUsuario as string) !== "administrador" && (
            <div className="form-group">
              <label htmlFor="sede">Seleccionar Sede</label>
              <select id="sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)} required={(tipoUsuario as string) !== "administrador"} disabled={loading}>
                <option value="">-- Selecciona una sede --</option>
                {sedes.map((sede) => (
                  <option key={sede.Id_sede_PK} value={sede.Id_sede_PK}>
                    {sede.Nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              !email ||
              (tipoUsuario !== "administrador" && !sedeId) ||
              (tipoUsuario === "administrador" && !password)
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
