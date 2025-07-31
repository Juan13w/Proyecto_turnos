import { NextRequest, NextResponse } from 'next/server';

// Función para obtener la IP del cliente
export function getClientIP(request: NextRequest): string {
  // Verificar headers de proxy/load balancer
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for puede contener múltiples IPs, tomar la primera
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback para desarrollo local
  return '127.0.0.1';
}

// Función para validar si la IP está en el rango permitido
function isIPAllowed(clientIP: string, allowedIPs: string[]): boolean {
  // Normalizar la IP del cliente (remover ::ffff: prefix si existe)
  const normalizedClientIP = clientIP.replace(/^::ffff:/, '');
  
  return allowedIPs.some(allowedIP => {
    // Normalizar la IP permitida
    const normalizedAllowedIP = allowedIP.replace(/^::ffff:/, '');
    
    // Verificar coincidencia exacta
    if (normalizedClientIP === normalizedAllowedIP) {
      return true;
    }
    
    // Verificar si es localhost en diferentes formatos
    const localhostIPs = ['127.0.0.1', '::1', 'localhost'];
    if (localhostIPs.includes(normalizedClientIP) && localhostIPs.includes(normalizedAllowedIP)) {
      return true;
    }
    
    return false;
  });
}

export async function POST(request: NextRequest) {
  try {
    // Obtener la IP del cliente
    const clientIP = getClientIP(request);
    
    // Obtener las IPs permitidas desde las variables de entorno
    const allowedIPsString = process.env.ALLOWED_IPS || '';
    const allowedIPs = allowedIPsString.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    
    // Si no hay IPs configuradas, denegar acceso
    if (allowedIPs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No hay IPs configuradas para acceso',
        clientIP,
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }
    
    // Validar si la IP está permitida
    const isAllowed = isIPAllowed(clientIP, allowedIPs);
    
    if (isAllowed) {
      return NextResponse.json({
        success: true,
        message: 'Acceso permitido',
        clientIP,
        allowedIPs: allowedIPs,
        timestamp: new Date().toISOString()
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Acceso denegado - IP no autorizada',
        clientIP,
        allowedIPs: allowedIPs,
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }
    
  } catch (error) {
    console.error('Error en validación de IP:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Endpoint para solo obtener la IP del cliente sin validar
    const clientIP = getClientIP(request);
    
    return NextResponse.json({
      clientIP,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error obteniendo IP:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
