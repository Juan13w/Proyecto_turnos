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

    // Mapeo de tipos a columnas de la tabla turnos
    const tipoToColumna: Record<string, string> = {
      "entrada": "Hora_Entrada",
      "break1_salida": "Hora_Salida_break",
      "break1_entrada": "Hora_Entrada_break",
      "almuerzo_salida": "Hora_Salida_almuerzo",
      "almuerzo_entrada": "Hora_Entrada_almuerzo",
      "break2_salida": "Hora_Salida_break2",
      "break2_entrada": "Hora_Entrada_break2",
      "salida": "Hora_Salida"
    };

    const columna = tipoToColumna[tipo];
    if (!columna) {
      return NextResponse.json({ error: `Tipo de registro no válido: ${tipo}` }, { status: 400 });
    }

    // Actualizar la columna correspondiente en la fila del turno (forma segura)
        const query = `UPDATE turno SET ${columna} = ? WHERE Turno_id = ?`;
    await pool.execute(query, [hora, turnoId]);

    return NextResponse.json({
      success: true,
      columna,
      hora,
    });
  } catch (error) {
    console.error("Error registrando horario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empleadoId = searchParams.get("empleadoId")

    if (!empleadoId) {
      return NextResponse.json({ error: "Empleado ID es requerido" }, { status: 400 })
    }

    // Consultar registros usando nombres exactos de columnas
    const registros = await sql`
      SELECT * FROM registro_horario
      WHERE Empleado_id = ${empleadoId}
      ORDER BY Fecha DESC, Hora DESC
      LIMIT 50
    `

    return NextResponse.json({
      success: true,
      registros: registros,
    })
  } catch (error) {
    console.error("Error obteniendo registros:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
