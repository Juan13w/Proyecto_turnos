import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

const createTransporter = () => {
  // Debug: Verificar que las variables de entorno estén cargadas
  console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Definido' : 'No definido');
  console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Definido' : 'No definido');
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Las credenciales de correo no están configuradas correctamente');
  }
  
  // Configuración del transporter para Gmail
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Usa una contraseña de aplicación
    },
  });
};

export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = createTransporter();
    
    // Opciones del correo
    const mailOptions = {
      from: `"Sistema de Turnos" <${process.env.GMAIL_USER}>`,
      ...options,
    };

    // Enviar correo
    const info = await transporter.sendMail(mailOptions);
    console.log('Mensaje enviado: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al enviar el correo' 
    };
  }
};

export const sendPdfEmail = async (
  to: string,
  subject: string,
  text: string,
  pdfBuffer: Buffer,
  filename: string = 'documento.pdf'
) => {
  return sendEmail({
    to,
    subject,
    text,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};
