'use client';
import React, { useState, useEffect } from "react";
import MainPage from "@/components/MainPage";
import PanelEmpleado from "@/components/PanelEmpleado";
import PanelAdmin from "@/components/PanelAdmin";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [esEmpleado, setEsEmpleado] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    setEsEmpleado(window.localStorage.getItem("empleadoLogueado") === "true");
    setEsAdmin(window.localStorage.getItem("adminLogueado") === "true");
  }, []);

  if (esEmpleado) {
    const userData = JSON.parse(window.localStorage.getItem("empleadoData") || '{"email": "empleado@empresa.com"}');
    const handleLogout = () => {
      localStorage.removeItem("empleadoLogueado");
      localStorage.removeItem("empleadoData");
      setEsEmpleado(false);
    };
    return <PanelEmpleado user={userData} onLogout={handleLogout} />;
  }

  if (esAdmin) {
    // Redirigir a la ruta de administrador
    if (typeof window !== 'undefined') {
      window.location.href = '/admin';
    }
    // Mostrar un mensaje de carga mientras se redirige
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirigiendo al panel de administración...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <MainPage />
    </>
  );
}

