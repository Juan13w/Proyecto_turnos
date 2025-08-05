import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getClientIP } from "@/app/api/ip-validation/route"
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    // Primero buscar si es administrador
    const admin = await sql`
      SELECT * FROM administrador WHERE Correo = ${email}
    `

    if (admin.length > 0) {
      // Es administrador, exige contraseña
      if (!password) {
        return NextResponse.json({ error: "Contraseña requerida para administradores" }, { status: 400 })
      }
      // Validar contraseña (debe estar hasheada en producción)
      if (admin[0].Clave !== password) {
        return NextResponse.json({ error: "Contraseña de administrador incorrecta" }, { status: 401 })
      }
      // Login exitoso de admin
      return NextResponse.json({
        success: true,
        user: {
          id: admin[0].admin_id,
          email: admin[0].Correo,
          isAdmin: true,
        }
      })
    }

    // Si no es admin, buscar empleado con su turno
    const empleado = await sql`
      SELECT e.*, t.* 
      FROM empleado e
      LEFT JOIN turno t ON e.Turno_id = t.Turno_id
      WHERE e.Correo_emp = ${email}`

    if (empleado.length === 0) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 401 })
    }

    // Obtener información del dispositivo desde el User-Agent
    const userAgent = request.headers.get('user-agent') || 'Dispositivo desconocido';
    const ipAddress = await getClientIP(request);

    // Actualizar o insertar en info_sesion
    try {
      await sql`
        INSERT INTO info_sesion (empleado_id, dispositivo, direccion_ip, ubicacion)
        VALUES (${empleado[0].empleado_id}, ${userAgent}, ${ipAddress}, 0)
        ON DUPLICATE KEY UPDATE 
          dispositivo = VALUES(dispositivo),
          direccion_ip = VALUES(direccion_ip)
      `;
    } catch (error) {
      console.error('Error al actualizar info_sesion:', error);
      // Continuar con el login a pesar del error en el registro de sesión
    }

    // Login exitoso de empleado
    const userData = {
      id: empleado[0].empleado_id,
      email: empleado[0].Correo_emp,
      isAdmin: false,
      turno: empleado[0].Turno_id ? {
        id: empleado[0].Turno_id,
        hora_entrada: empleado[0].Hora_entrada || null,
        hora_salida: empleado[0].Hora_salida || null
      } : null
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

