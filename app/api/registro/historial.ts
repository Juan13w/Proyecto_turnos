import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";

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

    // Insertar los datos en la tabla historial_turnos
    await pool.execute(
      `INSERT INTO historial_registros (
        empleado_email, fecha, hora_entrada, hora_salida,
        break1_salida, break1_entrada, almuerzo_salida, almuerzo_entrada,
        break2_salida, break2_entrada
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error guardando historial de jornada:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
