import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ tipo: "ninguno", error: "Correo requerido" }, { status: 400 });
    }

    // Buscar en empleados
    const empleado = await sql`SELECT Id_empleado_PK FROM empleado WHERE Correo_emp = ${email}`;
    if (empleado.length > 0) {
      return NextResponse.json({ tipo: "empleado" });
    }

    // Buscar en administradores
    const admin = await sql`SELECT Id_admin_PK FROM administrador WHERE Correo = ${email}`;
    if (admin.length > 0) {
      return NextResponse.json({ tipo: "administrador" });
    }

    return NextResponse.json({ tipo: "ninguno" });
  } catch (error) {
    return NextResponse.json({ tipo: "ninguno", error: "Error interno del servidor" }, { status: 500 });
  }
}
