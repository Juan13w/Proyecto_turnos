import React, { useState, useEffect } from "react";
import "./PanelAdmin.css";
import dynamic from 'next/dynamic';

// Tipo para los registros de horario
interface RegistroHorario {
  fecha: string;
  hora_entrada?: string;
  break1_salida?: string;
  break1_entrada?: string;
  almuerzo_salida?: string;
  almuerzo_entrada?: string;
  break2_salida?: string;
  break2_entrada?: string;
  hora_salida?: string;
  total_horas?: string;
}

// Función para generar el PDF
declare global {
  interface Window {
    jsPDF: any;
  }
}

const generarPDFCompleto = async (historial: any[], busqueda: string, setGenerandoPDF: (loading: boolean) => void): Promise<Blob> => {
  if (historial.length === 0) {
    throw new Error('No hay datos para generar el PDF');
  }

  setGenerandoPDF(true);

  try {
    const { jsPDF } = (await import('jspdf'));
    const autoTable = (await import('jspdf-autotable')).default;
    
    // Crear un nuevo documento PDF
    const doc = new jsPDF();
    
    // Título del documento
    doc.setFontSize(18);
    doc.text('Registro de Turnos', 14, 22);
    
    // Subtítulo con fecha de búsqueda si existe
    if (busqueda) {
      doc.setFontSize(11);
      doc.text(`Filtro aplicado: ${busqueda}`, 14, 30);
    }
    
    // Configurar la tabla
    const tableColumn = ["ID", "Nombre", "Apellido", "Sede", "Fecha", "Hora Entrada", "Hora Salida", "Horas Trabajadas"];
    const tableRows: any[] = [];
    
    // Llenar los datos de la tabla
    historial.forEach(registro => {
      const registroData = [
        registro.id,
        registro.nombre || 'N/A',
        registro.apellido || 'N/A',
        registro.sede || 'N/A',
        registro.fecha || 'N/A',
        registro.hora_entrada || 'N/A',
        registro.hora_salida || 'N/A',
        registro.horas_trabajadas || 'N/A'
      ];
      tableRows.push(registroData);
    });
    
    // Agregar la tabla al PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 40 }
    });
    
    // Obtener el PDF como Blob
    const pdfBlob = doc.output('blob');
    
    // También mantener la opción de descarga directa
    doc.save('registro_turnos.pdf');
    
    return pdfBlob;
    
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    throw error; // Relanzar el error para manejarlo en el llamador
  } finally {
    setGenerandoPDF(false);
  }
};

// Extender la interfaz de jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
    autoTable: (options: any) => jsPDF;
  }
}

const PanelAdmin: React.FC<{ user: { email: string }; onLogout: () => void }> = ({ user, onLogout }) => {
  const [detalleJornada, setDetalleJornada] = useState<RegistroHorario | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [historial, setHistorial] = useState<RegistroHorario[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [horaActual, setHoraActual] = useState<string>("");
  const [fechaActual, setFechaActual] = useState<string>("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    recipient: "",
    message: ""
  });
  const [emailSending, setEmailSending] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const generarPDFCompleto = async (historial: any[], busqueda: string): Promise<Blob> => {
    if (historial.length === 0) {
      throw new Error('No hay datos para generar el PDF');
    }
    
    setGenerandoPDF(true);
    
    try {
      // Cargar dinámicamente solo en el cliente
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      // Crear una nueva instancia de PDF en orientación vertical
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configuración inicial
      doc.setFont('helvetica');
      doc.setFontSize(16);
      
      // Cargar y dibujar logos (los mismos de la navbar) arriba del título
      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        } catch (e) { reject(e as any); }
      });
      
      // Título centrado
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Intentar pintar una fila de logos centrada
      try {
        const logoPaths = ['/images/logo1.png', '/images/logo2.png', '/images/emtra.png', '/images/logo4.png'];
        const results = await Promise.allSettled(logoPaths.map(loadImage));
        const imgs: HTMLImageElement[] = results.filter(r => r.status === 'fulfilled').map(r => (r as PromiseFulfilledResult<HTMLImageElement>).value);
        if (imgs.length > 0) {
          const logoW = 30; // mm
          const logoH = 15; // mm
          const gap = 10;   // mm
          const totalW = imgs.length * logoW + (imgs.length - 1) * gap;
          let x = (pageWidth - totalW) / 2;
          const y = 14; // altura para logos
          imgs.forEach((img) => {
            doc.addImage(img, 'PNG', x, y, logoW, logoH);
            x += logoW + gap;
          });
        }
      } catch {}

      const title = 'Reporte de Horarios';
      const titleWidth = doc.getStringUnitWidth(title) * 16 / doc.internal.scaleFactor;
      doc.text(title, (pageWidth - titleWidth) / 2, 42);
      
      // Información del empleado y fecha de generación
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Empleado: ${busqueda}`, 15, 54);
      
      const fechaGeneracion = new Date().toLocaleString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.text(`Fecha de generación: ${fechaGeneracion}`, 15, 60);
      
      // Ordenar el historial por fecha (más reciente primero)
      const historialOrdenado = [...historial].sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      
      // Helpers para calcular total trabajado (HH:mm:ss)
      const toSeconds = (hms: string) => {
        const [h, m, s] = hms.split(':').map((v: string) => parseInt(v, 10) || 0);
        return h * 3600 + m * 60 + s;
      };
      const formatHMS = (sec: number) => {
        if (sec < 0) sec = 0;
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
      };
      const safeDiff = (start?: string, end?: string) => {
        if (!start || !end) return 0;
        try { return toSeconds(end) - toSeconds(start); } catch { return 0; }
      };
      const calcularTotal = (r: any) => {
        // Requiere al menos entrada y salida del día
        if (!r?.hora_entrada || !r?.hora_salida) return undefined;
        let total = safeDiff(r.hora_entrada, r.hora_salida);
        // Restar tiempos de breaks cuando hay par de salida/entrada
        total -= safeDiff(r.break1_salida, r.break1_entrada);
        total -= safeDiff(r.almuerzo_salida, r.almuerzo_entrada);
        total -= safeDiff(r.break2_salida, r.break2_entrada);
        return formatHMS(total);
      };
      
      // Preparar los datos para la tabla con columnas agrupadas
      const headers = [
        'Fecha',
        'Entrada',
        'Break 1',
        'Almuerzo',
        'Break 2',
        'Salida',
        'Total'
      ];
      
      const data = historialOrdenado.map(registro => {
        // Formatear la fecha como M/D/YYYY (sin ceros a la izquierda) para coincidir con el ejemplo
        const fecha = new Date(registro.fecha).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        });
        
        // Formatear break 1 (salida/entrada) en una sola línea con barra
        const break1 = (registro.break1_salida && registro.break1_entrada)
          ? `${registro.break1_salida} / ${registro.break1_entrada}`
          : (registro.break1_salida ? `Sal: ${registro.break1_salida}`
            : (registro.break1_entrada ? `Ent: ${registro.break1_entrada}` : '-'));
        
        // Formatear almuerzo (salida/entrada) en una sola línea con barra
        const almuerzo = (registro.almuerzo_salida && registro.almuerzo_entrada)
          ? `${registro.almuerzo_salida} / ${registro.almuerzo_entrada}`
          : (registro.almuerzo_salida ? `Sal: ${registro.almuerzo_salida}`
            : (registro.almuerzo_entrada ? `Ent: ${registro.almuerzo_entrada}` : '-'));
        
        // Formatear break 2 (salida/entrada) en una sola línea con barra
        const break2 = (registro.break2_salida && registro.break2_entrada)
          ? `${registro.break2_salida} / ${registro.break2_entrada}`
          : (registro.break2_salida ? `Sal: ${registro.break2_salida}`
            : (registro.break2_entrada ? `Ent: ${registro.break2_entrada}` : '-'));
        
        const total = calcularTotal(registro) ?? registro.total_horas ?? '-';
        return [
          fecha,
          registro.hora_entrada || '-',
          break1,
          almuerzo,
          break2,
          registro.hora_salida || '-',
          total
        ];
      });
      
      // (Sin nota debajo del encabezado para replicar exactamente el ejemplo)

      // Usar autoTable para crear una sola tabla con todos los registros
      // Calcular ancho util (página - márgenes izq/der)
      const usableWidth = pageWidth - 30; // márgenes de 15mm a cada lado
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 68,
        margin: { 
          top: 10,
          left: 15,
          right: 15,
          bottom: 15
        },
        tableWidth: usableWidth,
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 3,
          lineWidth: 0.1,
          overflow: 'ellipsize',
          cellWidth: 'auto',
          valign: 'middle',
          halign: 'center'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
          lineWidth: 0.1,
          cellPadding: 2,
          valign: 'middle',
          halign: 'center'
        },
        columnStyles: {
          0: { fontSize: 7, halign: 'center' }, // Fecha
          1: { fontSize: 8, halign: 'center' }, // Entrada
          2: { fontSize: 7, halign: 'center' }, // Break 1
          3: { fontSize: 7, halign: 'center' }, // Almuerzo
          4: { fontSize: 7, halign: 'center' }, // Break 2
          5: { fontSize: 8, halign: 'center' }, // Salida
          6: { fontSize: 8, halign: 'center', fontStyle: 'bold' }  // Total
        },
        didParseCell: function(data) {
          // Evitar que los encabezados se quiebren por caracteres
          if (data.row.index === 0) {
            data.cell.styles.overflow = 'visible';
            data.cell.styles.cellWidth = 'auto';
          }
        },
        didDrawPage: function(data) {
          // Agregar número de página
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          doc.text(
            `Página ${data.pageNumber}`, 
            data.settings.margin.left, 
            pageHeight - 10
          );
        }
      });
      
      // Generar el Blob del PDF
      const pdfBlob = doc.output('blob');
      
      // También guardar el PDF localmente
      const nombreArchivo = `historial-${busqueda.split('@')[0]}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);
      
      return pdfBlob;
      
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      throw error;
    } finally {
      setGenerandoPDF(false);
    }
  };

  useEffect(() => {
    const actualizarHora = () => {
      const ahora = new Date();
      setHoraActual(
        ahora.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setFechaActual(
        ahora.toLocaleDateString("es-CO", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).toUpperCase()
      );
    };
    actualizarHora();
    const timer = setInterval(actualizarHora, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerarPDF = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const pdfBlob = await generarPDFCompleto(historial, busqueda);
      // Opcional: Si necesitas hacer algo con el blob aquí
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSending(true);
    
    try {
      // Generar el PDF primero
      const pdfBlob = await generarPDFCompleto(historial, busqueda);
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('email', emailData.recipient);
      formData.append('message', emailData.message);
      
      // Convertir el Blob a File
      const pdfFile = new File([pdfBlob], 'registro_turnos.pdf', { type: 'application/pdf' });
      formData.append('pdf', pdfFile);
      
      // Enviar a la API
      const response = await fetch('/api/email', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar el correo');
      }
      
      // Mostrar mensaje de éxito
      setShowSuccessMessage(true);
      setEmailData({ recipient: "", message: "" });
      
      // Ocultar el mensaje después de 3 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowEmailModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
      alert(error instanceof Error ? error.message : 'Error al enviar el correo');
    } finally {
      setEmailSending(false);
    }
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setHistorial([]);
    setLoading(true);
    try {
      const res = await fetch(`/api/registro/historial/buscar?email=${encodeURIComponent(busqueda)}`);
      const data = await res.json();
      if (data.success) {
        setHistorial(data.historial);
        if (data.historial.length === 0) setError("No se encontraron registros para ese correo.");
      } else {
        setError(data.error || "Error al buscar el historial");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const calcularHorasTrabajadas = (detalle: any) => {
    if (!detalle.hora_entrada || !detalle.hora_salida) {
      return "N/A";
    }

    const parseTime = (timeStr: string) => new Date(`1970-01-01T${timeStr}Z`).getTime();

    let totalMillis = parseTime(detalle.hora_salida) - parseTime(detalle.hora_entrada);

    const breaks = [
      { start: detalle.break1_salida, end: detalle.break1_entrada },
      { start: detalle.almuerzo_salida, end: detalle.almuerzo_entrada },
      { start: detalle.break2_salida, end: detalle.break2_entrada },
    ];

    breaks.forEach(breakItem => {
      if (breakItem.start && breakItem.end) {
        totalMillis -= (parseTime(breakItem.end) - parseTime(breakItem.start));
      }
    });

    if (totalMillis < 0) totalMillis = 0;

    const hours = Math.floor(totalMillis / 3600000);
    const minutes = Math.floor((totalMillis % 3600000) / 60000);
    const seconds = Math.floor(((totalMillis % 3600000) % 60000) / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="admin-panel-container">
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <h3>Panel de Administrador</h3>
          <span className="admin-email">{user.email}</span>
        </div>
        <div className="datetime-container">
          <div className="clock">
            <span role="img" aria-label="clock">⏰</span> {horaActual}
          </div>
          <div className="date">{fechaActual}</div>
        </div>
      </nav>

      <div className="admin-main-content">
        <main>
        <div className="search-card">
          <form className="search-form" onSubmit={handleBuscar}>
            <label htmlFor="search-input">Buscar Historial de Empleado</label>
            <div className="search-row">
              <input
                id="search-input"
                type="text"
                placeholder="Correo electrónico del empleado..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              <button type="submit" className="primary-btn">Buscar</button>
            </div>
          </form>
        </div>

        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading-message">Buscando historial...</div>}

        {historial.length > 0 && (
          <div className="results-container">
            <div className="employee-info">
              <div>
                <h4>Mostrando historial para:</h4>
                <p>{busqueda}</p>
              </div>
              <div className="button-group">
                <button 
                  onClick={() => generarPDFCompleto(historial, busqueda)} 
                  className="pdf-button"
                  disabled={generandoPDF}
                >
                  {generandoPDF ? 'Generando PDF...' : '📊 Descargar PDF Completo'}
                </button>
                <button 
                  className="email-button"
                  onClick={() => setShowEmailModal(true)}
                  disabled={generandoPDF}
                >
                  ✉️ Enviar por correo
                </button>
              </div>
            </div>
            <div className="history-list">
              <h5>Fechas registradas:</h5>
              <ul>
                {historial.map((row, idx) => (
                  <li key={idx}>
                    <button
                      className="date-btn"
                      onClick={() => setDetalleJornada(row)}
                    >
                      {new Date(row.fecha).toLocaleDateString('es-CO', {year: 'numeric', month: '2-digit', day: '2-digit'})}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {detalleJornada && (
          <div className="details-modal-overlay">
            <div className="details-modal">
              <h3>Detalle de jornada: {new Date(detalleJornada.fecha).toLocaleDateString('es-CO', {year: 'numeric', month: '2-digit', day: '2-digit'})}</h3>
              <table className="details-table">
                <tbody>
                  <tr><td>Entrada</td><td>{detalleJornada.hora_entrada || '-'}</td></tr>
                  <tr><td>Salida Break 1</td><td>{detalleJornada.break1_salida || '-'}</td></tr>
                  <tr><td>Entrada Break 1</td><td>{detalleJornada.break1_entrada || '-'}</td></tr>
                  <tr><td>Salida Almuerzo</td><td>{detalleJornada.almuerzo_salida || '-'}</td></tr>
                  <tr><td>Entrada Almuerzo</td><td>{detalleJornada.almuerzo_entrada || '-'}</td></tr>
                  <tr><td>Salida Break 2</td><td>{detalleJornada.break2_salida || '-'}</td></tr>
                  <tr><td>Entrada Break 2</td><td>{detalleJornada.break2_entrada || '-'}</td></tr>
                  <tr><td>Salida</td><td>{detalleJornada.hora_salida || '-'}</td></tr>
                  <tr className="total-hours-row"><td><b>Horas Trabajadas</b></td><td><b>{calcularHorasTrabajadas(detalleJornada)}</b></td></tr>
                </tbody>
              </table>
              <button className="secondary-btn" onClick={() => setDetalleJornada(null)}>
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div className="logout-section">
          <button onClick={onLogout} className="logout-btn">
            Cerrar sesión
          </button>
        </div>
        </main>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="email-modal">
            <div className="modal-header">
              <h3>Enviar por correo</h3>
              <button 
                className="close-button"
                onClick={() => setShowEmailModal(false)}
                disabled={emailSending}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSendEmail} className="email-form">
              <div className="form-group">
                <label htmlFor="recipient">Correo destinatario:</label>
                <input
                  type="email"
                  id="recipient"
                  name="recipient"
                  value={emailData.recipient}
                  onChange={handleEmailInputChange}
                  required
                  placeholder="ejemplo@empresa.com"
                  disabled={emailSending}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Mensaje (opcional):</label>
                <textarea
                  id="message"
                  name="message"
                  value={emailData.message}
                  onChange={handleEmailInputChange}
                  placeholder="Escribe un mensaje..."
                  rows={4}
                  disabled={emailSending}
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowEmailModal(false)}
                  disabled={emailSending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="send-button"
                  disabled={emailSending || !emailData.recipient}
                >
                  {emailSending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
              
              {showSuccessMessage && (
                <div className="success-message">
                  <svg className="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>¡Enviado correctamente!</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAdmin;
