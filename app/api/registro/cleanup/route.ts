import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';

export async function DELETE(request: Request) {
  try {
    const { empleadoId, email } = await request.json();

    if (!empleadoId || !email) {
      return NextResponse.json(
        { error: 'Se requieren ID de empleado y correo electrónico' },
        { status: 400 }
      );
    }

    // Obtener la fecha actual
    const fechaActual = new Date().toISOString().split('T')[0];
    
    // Eliminar todos los registros del empleado para la fecha actual
    await sql`
      DELETE FROM historial_turnos 
      WHERE empleado_email = ${email} 
      AND fecha = ${fechaActual}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Registros limpiados exitosamente' 
    });

  } catch (error) {
    console.error('Error al limpiar registros:', error);
    return NextResponse.json(
      { error: 'Error al limpiar los registros' },
      { status: 500 }
    );
  }
}
