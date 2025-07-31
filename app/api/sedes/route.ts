import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    // Usando nombres exactos de columnas de la estructura original
    const sedes = await sql`
      SELECT Id_sede_PK, Nombre, Direccion_IP
      FROM sede
      ORDER BY Nombre
    `

    return NextResponse.json({
      success: true,
      sedes: sedes,
    })
  } catch (error) {
    console.error("Error obteniendo sedes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
