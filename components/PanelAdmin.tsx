import React, { useState, useEffect } from "react";
import "./PanelAdmin.css";

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
