import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

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
      break2_entrada,
    } = await request.json()

    if (!empleado_email || !fecha) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    const now = new Date()
    const fechaActual =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0")

    console.log("Historial API - Fecha recibida:", fecha)
    console.log("Historial API - Fecha actual:", fechaActual)

    if (fecha !== fechaActual) {
      console.error("ERROR: Intento de actualizar registro de fecha diferente al día actual")
      return NextResponse.json(
        {
          error: "Solo se pueden actualizar registros del día actual",
        },
        { status: 400 },
      )
    }

    // Verificar si existe registro para el empleado y fecha
    const [existingRecords] = await pool.execute<any[]>(
      "SELECT id FROM historial_turnos WHERE empleado_email = ? AND fecha = ?",
      [empleado_email, fecha],
    )

    if (existingRecords.length > 0) {
      const registroId = existingRecords[0].id
      console.log("Actualizando registro existente con ID:", registroId)

      await pool.execute(
        `UPDATE historial_turnos SET
          hora_entrada = ?, hora_salida = ?,
          break1_salida = ?, break1_entrada = ?,
          almuerzo_salida = ?, almuerzo_entrada = ?,
          break2_salida = ?, break2_entrada = ?
        WHERE id = ? AND empleado_email = ? AND fecha = ?`,
        [
          hora_entrada || null,
          hora_salida || null,
          break1_salida || null,
          break1_entrada || null,
          almuerzo_salida || null,
          almuerzo_entrada || null,
          break2_salida || null,
          break2_entrada || null,
          registroId,
          empleado_email,
          fecha,
        ],
      )

      const [verificationRecords] = await pool.execute<any[]>(
        "SELECT * FROM historial_turnos WHERE id = ? AND fecha = ?",
        [registroId, fecha],
      )

      if (verificationRecords.length === 0) {
        console.error("ERROR: La actualización no se aplicó correctamente")
        return NextResponse.json(
          {
            error: "Error al actualizar el registro - verificación falló",
          },
          { status: 500 },
        )
      }

      console.log("Verificación exitosa - registro actualizado correctamente")
    } else {
      // Insertar nuevo registro
      console.log("Creando nuevo registro para:", { empleado_email, fecha })
      await pool.execute(
        `INSERT INTO historial_turnos (
          empleado_email, fecha, hora_entrada, hora_salida,
          break1_salida, break1_entrada, almuerzo_salida, almuerzo_entrada,
          break2_salida, break2_entrada
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          empleado_email,
          fecha,
          hora_entrada || null,
          hora_salida || null,
          break1_salida || null,
          break1_entrada || null,
          almuerzo_salida || null,
          almuerzo_entrada || null,
          break2_salida || null,
          break2_entrada || null,
        ],
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error guardando historial de jornada:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
