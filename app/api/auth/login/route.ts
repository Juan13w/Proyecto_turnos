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
    const serverIP = getClientIP(request);
    const frontendIPRaw = typeof deviceInfo?.ip === 'string' ? deviceInfo.ip.trim() : '';
    const frontendIP = frontendIPRaw.toLowerCase();
    const isUnknown = (v: string) => v === '' || v === 'unknown' || v === 'undefined' || v === 'null';
    const isPrivateIP = (ip: string) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|127\.|::1|fc00:|fe80:)/.test(ip);
    // Priorizar IP del request; usar IP del frontend solo si es válida y pública
    let ipAddress = serverIP;
    if (!isUnknown(frontendIP) && !isPrivateIP(frontendIPRaw)) {
      ipAddress = frontendIPRaw;
    }
    if (!ipAddress) ipAddress = '0.0.0.0';
    console.log('Detección de IP:', { serverIP, frontendIP: frontendIPRaw, ipElegida: ipAddress });
    
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

    // Fallback: intentar obtener ubicación aproximada por IP si no hay coordenadas del navegador
    if ((latitud === null || longitud === null) && ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '0.0.0.0') {
      try {
        // Evitar llamar al servicio para IPs privadas típicas
        const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|127\.|::1|fc00:|fe80:)/.test(ipAddress);
        if (!isPrivateIP) {
          // Timeout corto para no bloquear el login
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          let res: Response | null = null;
          try {
            res = await fetch(`https://ipapi.co/${ipAddress}/json/`, { cache: 'no-store' as any, signal: controller.signal });
          } finally {
            clearTimeout(timeoutId);
          }
          if (res) {
            if (res.ok) {
              const data = await res.json() as any;
              const lat = parseFloat(data.latitude);
              const lon = parseFloat(data.longitude);
              if (!isNaN(lat) && !isNaN(lon)) {
                latitud = lat;
                longitud = lon;
                tieneUbicacion = 1;
                console.log('Ubicación por IP obtenida');
              } else {
                console.warn('ipapi.co sin coordenadas válidas');
              }
            } else {
              console.warn('Fallo petición a ipapi.co:', res.status);
            }
          } else {
            console.warn('ipapi.co timeout');
          }
        } else {
          console.log('IP privada detectada; se omite geolocalización por IP.');
        }
      } catch (e) {
        console.warn('Error en geolocalización por IP:', e instanceof Error ? e.message : 'error');
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
      // Construir URL de Google Maps si hay coordenadas
      const mapsUrl = (latitud !== null && longitud !== null)
        ? `https://www.google.com/maps?q=${latitud},${longitud}`
        : null;

      // Intento 1: Insert con esquema nuevo extendido (incluye latitud/longitud y maps_url)
      let insertResult: any;
      try {
        const resultNuevo = await sql`
          INSERT INTO info_sesion 
            (empleado_id, dispositivo, direccion_ip, ubicacion, latitud, longitud, maps_url)
          VALUES 
            (${empleado[0].empleado_id}, ${dispositivo}, ${ipAddress}, ${tieneUbicacion}, 
             ${latitud}, ${longitud}, ${mapsUrl})
        ` as any;
        insertResult = Array.isArray(resultNuevo) ? resultNuevo[0] : resultNuevo;
        console.log('Registro de sesión (esquema nuevo+maps_url) creado:', {
          affectedRows: insertResult?.affectedRows,
          insertId: insertResult?.insertId
        });
      } catch (eNuevo) {
        // Fallback 1: Insert con esquema nuevo sin maps_url (solo lat/long)
        console.warn('Fallo insert con esquema nuevo+maps_url, intentando esquema nuevo sin maps_url...', {
          message: eNuevo instanceof Error ? eNuevo.message : 'error desconocido'
        });
        try {
          const resultNuevoSinMaps = await sql`
            INSERT INTO info_sesion 
              (empleado_id, dispositivo, direccion_ip, ubicacion, latitud, longitud)
            VALUES 
              (${empleado[0].empleado_id}, ${dispositivo}, ${ipAddress}, ${tieneUbicacion}, 
               ${latitud}, ${longitud})
          ` as any;
          insertResult = Array.isArray(resultNuevoSinMaps) ? resultNuevoSinMaps[0] : resultNuevoSinMaps;
          console.log('Registro de sesión (esquema nuevo sin maps_url) creado:', {
            affectedRows: insertResult?.affectedRows,
            insertId: insertResult?.insertId
          });
        } catch (eNuevoSinMaps) {
          // Fallback 2: Insert con esquema antiguo (sin latitud/longitud, sin fecha_acceso explícita)
          console.warn('Fallo insert con esquema nuevo sin maps_url, intentando esquema antiguo...', {
            message: eNuevoSinMaps instanceof Error ? eNuevoSinMaps.message : 'error desconocido'
          });
          const resultAntiguo = await sql`
            INSERT INTO info_sesion 
              (empleado_id, dispositivo, direccion_ip, ubicacion)
            VALUES 
              (${empleado[0].empleado_id}, ${dispositivo}, ${ipAddress}, ${tieneUbicacion})
          ` as any;
          insertResult = Array.isArray(resultAntiguo) ? resultAntiguo[0] : resultAntiguo;
          console.log('Registro de sesión (esquema antiguo) creado:', {
            affectedRows: insertResult?.affectedRows,
            insertId: insertResult?.insertId
          });
        }
      }
      
      // Omitir SELECT adicional para no agregar latencia al login
      
    } catch (error) {
      console.error('Error al registrar la sesión (bloque externo):', {
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

