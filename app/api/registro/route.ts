import { type NextRequest, NextResponse } from "next/server"
import { sql, pool } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { turnoId, tipo } = await request.json();

    if (!turnoId || !tipo) {
      return NextResponse.json({ error: "Turno ID y tipo son requeridos" }, { status: 400 });
    }

    const now = new Date();
    const hora = now.toTimeString().split(" ")[0];

    // Mapeo de tipos a columnas de la tabla historial_turnos
    const tipoToColumna: Record<string, string> = {
      "entrada": "hora_entrada",
      "break1_salida": "break1_salida",
      "break1_entrada": "break1_entrada",
      "almuerzo_salida": "almuerzo_salida",
      "almuerzo_entrada": "almuerzo_entrada",
      "break2_salida": "break2_salida",
      "break2_entrada": "break2_entrada",
      "salida": "hora_salida"
    };

    const columna = tipoToColumna[tipo];
    if (!columna) {
      return NextResponse.json({ error: `Tipo de registro no válido: ${tipo}` }, { status: 400 });
    }

    // Obtener el email del empleado asociado a este turno
    const turnoIdNum = Number(turnoId);
    console.log('Buscando empleado con Turno_id:', turnoIdNum);
    
    // Buscamos el empleado en la tabla 'empleado' (singular)
    const [empleados] = await pool.execute<any[]>(
      'SELECT Correo_emp as email FROM empleado WHERE empleado_id = ?',
      [turnoIdNum]
    );
    
    console.log('Resultado de la consulta de empleado:', empleados);

    if (!empleados || empleados.length === 0) {
      return NextResponse.json({ error: "No se encontró el empleado asociado a este turno" }, { status: 404 });
    }

    const empleadoEmail = empleados[0]?.email;
    if (!empleadoEmail) {
      console.error('No se pudo obtener el email del empleado');
      return NextResponse.json({ error: "No se pudo obtener la información del empleado" }, { status: 404 });
    }
    const fechaActual = new Date().toISOString().split('T')[0];

    // Primero verificamos si ya existe un registro para este empleado hoy
    const [existingRecords] = await pool.execute<any[]>(
      'SELECT * FROM historial_turnos WHERE empleado_email = ? AND fecha = ?',
      [empleadoEmail, fechaActual]
    );

    if (existingRecords && existingRecords.length > 0) {
      // Si existe, actualizamos solo la columna correspondiente
      const updateQuery = `
        UPDATE historial_turnos 
        SET ${columna} = ? 
        WHERE empleado_email = ? AND fecha = ?
      `;
      
      console.log('Actualizando registro existente:', { empleadoEmail, fechaActual, columna, hora });
      await pool.execute(updateQuery, [hora, empleadoEmail, fechaActual]);
    } else {
      // Si no existe, creamos un nuevo registro con la hora actual
      const insertQuery = `
        INSERT INTO historial_turnos (empleado_email, fecha, ${columna})
        VALUES (?, ?, ?)
      `;
      
      console.log('Creando nuevo registro:', { empleadoEmail, fechaActual, columna, hora });
      await pool.execute(insertQuery, [empleadoEmail, fechaActual, hora]);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Registro guardado exitosamente',
      columna,
      hora,
    });
  } catch (error: unknown) {
    console.error("Error general:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Detalles del error:', { errorMessage, stack: error instanceof Error ? error.stack : 'No hay stack trace' });
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empleadoId = searchParams.get("empleadoId");
    const fechaActual = new Date().toISOString().split('T')[0];

    if (!empleadoId) {
      return NextResponse.json({ error: "Empleado ID es requerido" }, { status: 400 });
    }

    // Obtener el email del empleado desde la tabla empleado
    const [empleados] = await pool.execute<any[]>(
      'SELECT Correo_emp as email FROM empleado WHERE empleado_id = ?',
      [empleadoId]
    );

    if (!empleados || empleados.length === 0) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    const empleadoEmail = empleados[0].email;

    // Consultar registros del empleado para la fecha actual
    const [registros] = await pool.execute<any[]>(
      `SELECT * FROM historial_turnos 
       WHERE empleado_email = ? AND fecha = ?
       ORDER BY id DESC
       LIMIT 1`,
      [empleadoEmail, fechaActual]
    );

    return NextResponse.json({ 
      success: true,
      registros: registros || []
    });
  } catch (error) {
    console.error("Error obteniendo registros:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
