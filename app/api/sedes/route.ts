import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    // Usando nombres exactos de columnas de la estructura original
    const infoSesiones = await sql`
      SELECT id, nombre, direccion_ip as direccionIP
      FROM info_sesion
      ORDER BY nombre
    `

    return NextResponse.json({
      success: true,
      sedes: infoSesiones,
    })
  } catch (error) {
    console.error("Error obteniendo sedes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
