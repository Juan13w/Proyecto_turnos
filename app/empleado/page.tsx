'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './empleado.css';

export default function EmpleadoPage() {
  const router = useRouter();
  const [empleadoData, setEmpleadoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay datos de empleado en localStorage
    const empleadoLogueado = localStorage.getItem('empleadoLogueado');
    const empleadoDataStr = localStorage.getItem('empleadoData');

    if (!empleadoLogueado || !empleadoDataStr) {
      // Redirigir al login si no hay datos de sesión
      router.push('/');
      return;
    }

    try {
      const data = JSON.parse(empleadoDataStr);
      setEmpleadoData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error al analizar datos del empleado:', err);
      setError('Error al cargar los datos del empleado');
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    // Limpiar datos de sesión
    localStorage.removeItem('empleadoLogueado');
    localStorage.removeItem('empleadoData');
    // Redirigir al login
    router.push('/');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Cargando datos del empleado...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="empleado-container">
      <header className="header">
        <h1>Panel del Empleado</h1>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </header>
      
      <main className="main-content">
        <section className="user-info">
          <h2>Bienvenido, {empleadoData?.nombre || 'Empleado'}</h2>
          <p>Correo: {empleadoData?.email || 'No disponible'}</p>
        </section>

        <section className="actions">
          <h3>Acciones disponibles</h3>
          <div className="action-buttons">
            <button className="action-button">Registrar Entrada</button>
            <button className="action-button">Registrar Salida</button>
            <button className="action-button">Ver Historial</button>
          </div>
        </section>
      </main>
    </div>
  );
}
