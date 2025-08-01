import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getClientIP } from "@/app/api/ip-validation/route"

export async function POST(request: NextRequest) {
  try {
    const { email, sedeId, password } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    // Primero buscar si es administrador
    const admin = await sql`
      SELECT * FROM administrador WHERE Correo = ${email}
    `

    if (admin.length > 0) {
      // Es administrador, solo exige contraseña
      if (!password) {
        return NextResponse.json({ error: "Contraseña requerida para administradores" }, { status: 400 })
      }
      // Log para depuración de contraseña
      console.log("DB:", admin[0].Clave, "FRONT:", password);
      // Validar contraseña (debe estar hasheada en producción)
      if (admin[0].Clave !== password) {
        return NextResponse.json({ error: "Contraseña de administrador incorrecta" }, { status: 401 })
      }
      // Login exitoso de admin
      return NextResponse.json({
        success: true,
        user: {
          id: admin[0].Id_admin_PK,
          email: admin[0].Correo,
          isAdmin: true,
        }
      })
    }

    // Si no es admin, debe ser empleado: exige sede
    if (!sedeId) {
      return NextResponse.json({ error: "Sede requerida para empleados" }, { status: 400 })
    }

    // Verificar si el empleado existe
    const empleado = await sql`
      SELECT e.*, s.Nombre as sede_nombre, s.Direccion_IP as sede_ip, t.*
      FROM empleado e
      JOIN sede s ON e.Sede_id = s.Id_sede_PK
      LEFT JOIN turno t ON e.Turno_id = t.Turno_id
      WHERE e.Correo_emp = ${email} AND e.Sede_id = ${sedeId}
    `

    if (empleado.length === 0) {
      return NextResponse.json({ error: "Empleado no encontrado o sede incorrecta" }, { status: 401 })
    }

    // Obtener IP del cliente
    let clientIP = getClientIP(request)
    // Si la IP es ::1 (localhost IPv6), usar 127.0.0.1
    if (clientIP === '::1') {
      clientIP = '127.0.0.1'
    }

    // Depuración: mostrar IP detectada y la IP de la sede
    console.log("IP detectada:", clientIP, "IP sede:", empleado[0].sede_ip);

    // Validar si la IP coincide con la de la sede
    const sedeIP = empleado[0].sede_ip?.replace(/^::ffff:/, '')
    const normalizedClientIP = clientIP.replace(/^::ffff:/, '')
    // Permitir acceso en desarrollo si la IP es localhost
    const isLocalhost = ["::1", "127.0.0.1", "localhost"].includes(normalizedClientIP);
    if (sedeIP !== normalizedClientIP && !(process.env.NODE_ENV === 'development' && isLocalhost)) {
      return NextResponse.json({ error: `La IP de la sede no es correcta. IP detectada: ${clientIP}` }, { status: 403 })
    }

    // Actualizar siempre la IP del empleado al iniciar sesión
    await sql`UPDATE empleado SET Direccion_ip = ${clientIP} WHERE Id_empleado_PK = ${empleado[0].Id_empleado_PK}`

    // Login exitoso de empleado
    const userData = {
      id: empleado[0].Id_empleado_PK,
      email: empleado[0].Correo_emp,
      sede: {
        id: empleado[0].Sede_id,
        nombre: empleado[0].sede_nombre,
      },
      turno: typeof empleado[0].Turno_id !== "undefined" && empleado[0].Turno_id !== null
        ? {
            id: Number(empleado[0].Turno_id),
            hora_entrada: empleado[0].Hora_Entrada ?? null,
            hora_salida: empleado[0].Hora_Salida ?? null,
            // Agrega aquí más campos si los necesitas
          }
        : null,
      isAdmin: false,
    }

    console.log("DEBUG userData enviado:", userData);
    console.log("DEBUG respuesta enviada:", { success: true, user: userData });
    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

