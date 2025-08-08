import React, { useState, useEffect } from "react";
import "./PanelAdmin.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    getNumberOfPages(): number;
  }
}

const PanelAdmin: React.FC<{ user: { email: string }; onLogout: () => void }> = ({ user, onLogout }) => {
  const [detalleJornada, setDetalleJornada] = useState<any | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [historial, setHistorial] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [horaActual, setHoraActual] = useState<string>("");
  const [fechaActual, setFechaActual] = useState<string>("");

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

  const generarPDF = async (historial: any[], email: string) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // Formatear fecha de generación
    const ahora = new Date();
    const opcionesFecha: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    const fechaGeneracion = ahora.toLocaleDateString('es-CO', opcionesFecha);

    // Preparar datos para la tabla
    const tableData = historial.map(registro => {
      const fecha = new Date(registro.fecha).toLocaleDateString('es-CO');
      const entrada = registro.hora_entrada || '-';
      const salida = registro.hora_salida || '-';
      const total = calcularHorasTrabajadas(registro);
      
      // Formatear breaks
      const break1 = registro.break1_salida && registro.break1_entrada 
        ? `${registro.break1_salida} / ${registro.break1_entrada}` 
        : '-';
        
      const almuerzo = registro.almuerzo_salida && registro.almuerzo_entrada 
        ? `${registro.almuerzo_salida} / ${registro.almuerzo_entrada}` 
        : '-';
        
      const break2 = registro.break2_salida && registro.break2_entrada 
        ? `${registro.break2_salida} / ${registro.break2_entrada}` 
        : '-';

      return [fecha, entrada, break1, almuerzo, break2, salida, total];
    });

    // ===== Encabezado =====
    
    // Título del reporte
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('REPORTE DE ASISTENCIA', 104, 20, { align: 'right' });

    // Información del empleado
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empleado: ${email}`, 23, 35, { align: 'left' });
    doc.text(`Generado: ${fechaGeneracion}`, 23, 45, { align: 'left' }  );
    
    // ===== Tabla =====
    autoTable(doc, {
      head: [
        [
          { content: 'FECHA', styles: { halign: 'center', fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold', cellWidth: 25 } },
          { content: 'ENTRADA', styles: { halign: 'center', fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold', cellWidth: 18 } },
          { content: 'BREAK 1', styles: { halign: 'center', fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold', cellWidth: 25 } },
          { content: 'ALMUERZO', styles: { halign: 'center', fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold', cellWidth: 25 } },
          { content: 'BREAK 2', styles: { halign: 'center', fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold', cellWidth: 25 } },
          { content: 'SALIDA', styles: { halign: 'center', fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold', cellWidth: 18 } },
          { content: 'TOTAL', styles: { halign: 'center', fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold', cellWidth: 20 } }
        ]
      ],
      body: tableData,
      startY: 55,
      margin: { left: 23, right: 23 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
        textColor: [0, 0, 0],
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      theme: 'grid',
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      showHead: 'everyPage',
      didDrawPage: function (data) {
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height || pageSize.getHeight();
        
        // Pie de página
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageSize.width / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        
        // Línea de pie de página
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, pageHeight - 15, pageSize.width - 20, pageHeight - 15);
        
        // Texto del pie de página
        doc.setFontSize(7);
        doc.text(
          'Sistema de Control de Asistencia - Generado automáticamente',
          pageSize.width / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }
    });

    // Guardar el PDF
    doc.save(`reporte_horarios_${email}_${ahora.toISOString().split('T')[0]}.pdf`);
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
              <h4>Mostrando historial para:</h4>
              <p>{busqueda}</p>
              <button 
                onClick={() => generarPDF(historial, busqueda)}
                className="download-pdf-btn"
              >
                📥 Descargar PDF
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
