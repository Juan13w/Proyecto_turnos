import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";

// Función para formatear la fecha al formato YYYY-MM-DD
export function formatDate(dateString: string): string {
  try {
    console.log('Fecha recibida para formateo:', dateString);
    
    // Si ya está en formato YYYY-MM-DD, devolver directamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Intentar con el constructor de Date
    let date = new Date(dateString);
    
    // Si falla, intentar con formato DD/MM/YYYY
    if (isNaN(date.getTime()) && dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      throw new Error('Fecha inválida');
    }
    
    // Formatear a YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}`;
    console.log('Fecha formateada:', formattedDate);
    return formattedDate;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    throw new Error(`Formato de fecha inválido: ${dateString}. Use YYYY-MM-DD`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      empleado_email,
      fecha,
      hora_entrada,
      hora_salida,
      break1_salida,
      break1_entrada,
      almuerzo_salida,
      almuerzo_entrada,
      break2_salida,
      break2_entrada
    } = await request.json();

    if (!empleado_email || !fecha) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Validar y formatear la fecha
    const fechaFormateada = formatDate(fecha);
    
    // Insertar los datos en la tabla historial_turnos
    await pool.execute(
      `INSERT INTO historial_turnos (
        empleado_email, fecha, hora_entrada, hora_salida,
        break1_salida, break1_entrada, almuerzo_salida, almuerzo_entrada,
        break2_salida, break2_entrada
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empleado_email,
        fechaFormateada, // Usar la fecha formateada
        hora_entrada || null,
        hora_salida || null,
        break1_salida || null,
        break1_entrada || null,
        almuerzo_salida || null,
        almuerzo_entrada || null,
        break2_salida || null,
        break2_entrada || null
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error guardando historial de jornada:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Error interno del servidor" 
    }, { status: 500 });
  }
}
