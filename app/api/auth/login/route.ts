import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getClientIP } from "@/app/api/ip-validation/route"
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password, deviceInfo } = await request.json()

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

    // Obtener información del dispositivo del frontend o del User-Agent
    const userAgent = request.headers.get('user-agent') || 'Desconocido';
    const rawIP = deviceInfo?.ip || await getClientIP(request);
    const ipAddress = rawIP || '0.0.0.0';
    
    // Si el frontend envía información del dispositivo, usarla
    // De lo contrario, usar solo la información básica del User-Agent
    let dispositivo = 'Computador';
    let locationData = deviceInfo?.location || 'No disponible';
    
    if (deviceInfo?.dispositivo) {
      // Usar la información del dispositivo proporcionada por el frontend
      dispositivo = deviceInfo.dispositivo.substring(0, 50);
    } else {
      // Análisis básico del User-Agent como respaldo
      let os = 'Sistema';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac OS')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) os = 'iOS';
      
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
      dispositivo = isMobile ? `${os} Móvil` : `${os} Computador`;
    }

    // Procesar la ubicación si está disponible
    let latitud = null;
    let longitud = null;
    let tieneUbicacion = 0;
    
    if (deviceInfo?.location && deviceInfo.location !== 'ubicacion_desconocida') {
      try {
        const [lat, lon] = deviceInfo.location.split(',').map((coord: string) => {
          const num = parseFloat(coord.trim());
          return isNaN(num) ? null : num;
        });
        
        if (lat !== null && lon !== null) {
          latitud = lat;
          longitud = lon;
          tieneUbicacion = 1;
          console.log('Ubicación obtenida:', { latitud, longitud });
        }
      } catch (err) {
        console.error('Error al procesar la ubicación:', err);
      }
    }

    // Insertar nuevo registro de sesión
    console.log('=== INICIO REGISTRO DE SESIÓN ===');
    console.log('Datos de la nueva sesión:', {
      empleado_id: empleado[0].empleado_id,
      dispositivo,
      direccion_ip: ipAddress,
      tiene_ubicacion: tieneUbicacion,
      latitud,
      longitud,
      raw_location: deviceInfo?.location || 'No disponible'
    });

    try {
      // Insertar nuevo registro con la información de ubicación
      const result = await sql`
        INSERT INTO info_sesion 
          (empleado_id, dispositivo, direccion_ip, ubicacion, latitud, longitud)
        VALUES 
          (${empleado[0].empleado_id}, ${dispositivo}, ${ipAddress}, ${tieneUbicacion}, 
           ${latitud}, ${longitud})
      ` as any; // Usamos 'as any' temporalmente para evitar errores de tipo
      
      // Mostrar información del resultado
      const insertResult = Array.isArray(result) ? result[0] : result;
      console.log('Nuevo registro de sesión creado:', {
        affectedRows: insertResult.affectedRows,
        insertId: insertResult.insertId
      });
      
      // Mostrar todos los registros de este empleado
      const registros = await sql`
        SELECT * FROM info_sesion 
        WHERE empleado_id = ${empleado[0].empleado_id}
        ORDER BY empleado_id DESC
      `;
      
      console.log(`Total de registros de sesión para empleado ${empleado[0].empleado_id}:`, registros.length);
      
    } catch (error) {
      console.error('Error al registrar la sesión:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        detalles: error
      });
    }
    
    console.log('=== FIN REGISTRO DE SESIÓN ===');

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

