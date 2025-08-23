import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { empleadoId, tipo } = await request.json()

    if (!empleadoId || !tipo) {
      return NextResponse.json({ error: "Empleado ID y tipo son requeridos" }, { status: 400 })
    }

    const now = new Date()
    const hora = now.toTimeString().split(" ")[0]
    const fechaActual =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0")

    console.log("Fecha actual calculada:", fechaActual)
    console.log("Hora actual:", hora)

    const tipoToColumna: Record<string, string> = {
      entrada: "hora_entrada",
      break1_salida: "break1_salida",
      break1_entrada: "break1_entrada",
      almuerzo_salida: "almuerzo_salida",
      almuerzo_entrada: "almuerzo_entrada",
      break2_salida: "break2_salida",
      break2_entrada: "break2_entrada",
      salida: "hora_salida",
    }

    const columna = tipoToColumna[tipo]
    if (!columna) {
      return NextResponse.json({ error: `Tipo de registro no válido: ${tipo}` }, { status: 400 })
    }

    const empleadoIdNum = Number(empleadoId)
    console.log("Buscando empleado con empleado_id:", empleadoIdNum)

    const [empleados] = await pool.execute<any[]>("SELECT Correo_emp as email FROM empleado WHERE empleado_id = ?", [
      empleadoIdNum,
    ])

    console.log("Resultado de la consulta de empleado:", empleados)

    if (!empleados || empleados.length === 0) {
      return NextResponse.json({ error: "No se encontró el empleado" }, { status: 404 })
    }

    const empleadoEmail = empleados[0]?.email
    if (!empleadoEmail) {
      console.error("No se pudo obtener el email del empleado")
      return NextResponse.json({ error: "No se pudo obtener la información del empleado" }, { status: 404 })
    }

    console.log("Buscando registro existente para:", { empleadoEmail, fechaActual })

    const [existingRecords] = await pool.execute<any[]>(
      "SELECT * FROM historial_turnos WHERE empleado_email = ? AND fecha = ?",
      [empleadoEmail, fechaActual],
    )

    console.log("Registros encontrados:", existingRecords.length)
    if (existingRecords.length > 0) {
      console.log("Primer registro encontrado:", existingRecords[0])
    }

    if (existingRecords && existingRecords.length > 0) {
      const registroExistente = existingRecords[0]

      if (registroExistente[columna]) {
        return NextResponse.json(
          {
            success: false,
            error: `Ya se ha registrado la ${tipo.replace("_", " ")} para hoy. No se puede actualizar.`,
          },
          { status: 400 },
        )
      }

      const updateQuery = `
        UPDATE historial_turnos 
        SET ${columna} = ? 
        WHERE id = ? AND empleado_email = ? AND fecha = ?
      `

      console.log("Actualizando registro con parámetros:", {
        hora,
        registroId: registroExistente.id,
        empleadoEmail,
        fechaActual,
        columna,
      })

      const [updateResult] = await pool.execute(updateQuery, [hora, registroExistente.id, empleadoEmail, fechaActual])

      console.log("Resultado del UPDATE:", updateResult)

      const [verificationRecords] = await pool.execute<any[]>(
        "SELECT * FROM historial_turnos WHERE id = ? AND fecha = ?",
        [registroExistente.id, fechaActual],
      )

      if (verificationRecords.length === 0 || verificationRecords[0][columna] !== hora) {
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
      const insertQuery = `
        INSERT INTO historial_turnos (empleado_email, fecha, ${columna})
        VALUES (?, ?, ?)
      `

      console.log("Creando nuevo registro:", { empleadoEmail, fechaActual, columna, hora })
      const [insertResult] = await pool.execute(insertQuery, [empleadoEmail, fechaActual, hora])
      console.log("Resultado del INSERT:", insertResult)
    }

    return NextResponse.json({
      success: true,
      message: "Registro guardado exitosamente",
      columna,
      hora,
      fecha: fechaActual,
    })
  } catch (error: unknown) {
    console.error("Error general:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    console.error("Detalles del error:", {
      errorMessage,
      stack: error instanceof Error ? error.stack : "No hay stack trace",
    })
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empleadoId = searchParams.get("empleadoId")
    const fecha = searchParams.get("fecha")

    if (!empleadoId || !fecha) {
      return NextResponse.json({ error: "Empleado ID y fecha son requeridos" }, { status: 400 })
    }

    const [empleados] = await pool.execute<any[]>("SELECT Correo_emp as email FROM empleado WHERE empleado_id = ?", [
      empleadoId,
    ])

    if (!empleados || empleados.length === 0) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
    }

    const empleadoEmail = empleados[0].email

    console.log("Consultando registros para:", { empleadoEmail, fecha })

    const [registros] = await pool.execute<any[]>(
      `SELECT * FROM historial_turnos 
       WHERE empleado_email = ? AND fecha = ?
       ORDER BY id DESC
       LIMIT 1`,
      [empleadoEmail, fecha],
    )

    console.log("Registros encontrados en GET:", registros.length)

    return NextResponse.json({
      success: true,
      registros: registros || [],
    })
  } catch (error) {
    console.error("Error obteniendo registros:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
