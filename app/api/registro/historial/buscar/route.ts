import { type NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Falta el parámetro email" }, { status: 400 });
    }

    const [rows] = await pool.execute(
      `SELECT * FROM historial_turnos WHERE empleado_email = ? ORDER BY fecha DESC` ,
      [email]
    );

    return NextResponse.json({ success: true, historial: rows });
  } catch (error) {
    console.error("Error consultando historial_turnos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
