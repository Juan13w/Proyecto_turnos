import { NextResponse } from 'next/server';
import { sendPdfEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Obtener los datos del formulario
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    const pdfFile = formData.get('pdf') as File | null;
    
    if (!email || !pdfFile) {
      return NextResponse.json(
        { success: false, error: 'Correo electrónico y archivo PDF son requeridos' },
        { status: 400 }
      );
    }

    // Convertir el archivo PDF a Buffer
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    
    // Enviar el correo con el PDF adjunto
    const result = await sendPdfEmail(
      email,
      'Registro de Turnos - Documento PDF',
      message || 'Adjunto encontrará el registro de turnos solicitado.',
      pdfBuffer,
      'registro_turnos.pdf'
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId 
    });
    
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor al procesar la solicitud' 
      },
      { status: 500 }
    );
  }
}
