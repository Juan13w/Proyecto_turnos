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

const generarPDFCompleto = async (historial: any[], busqueda: string, setGenerandoPDF: (loading: boolean) => void) => {
  if (historial.length === 0) return;
  
  setGenerandoPDF(true);
  
  try {
    // Cargar dinámicamente solo en el cliente
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    // Crear una nueva instancia de PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configuración inicial
    doc.setFont('helvetica');
    doc.setFontSize(18);
    doc.text('Historial Completo de Registros', 14, 22);
    
    // Información del empleado
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Empleado: ${busqueda}`, 14, 32);
    
    // Ordenar el historial por fecha (más reciente primero)
    const historialOrdenado = [...historial].sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
    
    let startY = 50;
    
    // Para cada día en el historial
    for (const [index, registro] of historialOrdenado.entries()) {
      if (index > 0) {
        doc.addPage();
        startY = 20;
      }
      
      // Fecha del registro
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Registro del ${new Date(registro.fecha).toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`, 
        14, 
        startY
      );
      
      // Crear la tabla de horarios para este día
      const headers = [['Tipo', 'Hora Registrada']];
      const data = [
        ['Entrada', registro.hora_entrada || 'No registrada'],
        ['Salida Break 1', registro.break1_salida || 'No registrada'],
        ['Entrada Break 1', registro.break1_entrada || 'No registrada'],
        ['Salida Almuerzo', registro.almuerzo_salida || 'No registrada'],
        ['Entrada Almuerzo', registro.almuerzo_entrada || 'No registrada'],
        ['Salida Break 2', registro.break2_salida || 'No registrada'],
        ['Entrada Break 2', registro.break2_entrada || 'No registrada'],
        ['Salida', registro.hora_salida || 'No registrada']
      ];
      
      // Usar autoTable
      autoTable(doc, {
        head: headers,
        body: data,
        startY: startY + 10,
        styles: {
          font: 'helvetica',
          fontSize: 10
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        }
      });
      
      // Actualizar la posición Y para el siguiente elemento
      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 10;
      
      // Agregar total de horas trabajadas si está disponible
      if (registro.total_horas) {
        doc.setFontSize(12);
        doc.text(`Total de horas trabajadas: ${registro.total_horas}`, 14, startY);
        startY += 10;
      }
    }
    
    // Guardar el PDF
    doc.save(`historial-${new Date().toISOString().split('T')[0]}.pdf`);
    
  } catch (error) {
    console.error('Error al generar el PDF:', error);
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

  const generarPDFCompleto = async (historial: any[], busqueda: string) => {
    if (historial.length === 0) return;
    
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
      
      // Guardar el PDF con un nombre que incluya el nombre del empleado y la fecha
      const nombreArchivo = `historial-${busqueda.split('@')[0]}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);
      
    } catch (error) {
      console.error('Error al generar el PDF:', error);
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
    await generarPDFCompleto(historial, busqueda);
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
              <button 
                onClick={() => generarPDFCompleto(historial, busqueda)} 
                className="pdf-button"
                disabled={generandoPDF}
              >
                {generandoPDF ? 'Generando PDF...' : '📊 Descargar PDF Completo'}
              </button>
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
    </div>
  );
};

export default PanelAdmin;
