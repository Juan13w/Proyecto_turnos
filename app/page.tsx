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
    const userData = JSON.parse(window.localStorage.getItem("adminData") || '{"email": "admin@empresa.com"}');
    const handleLogout = () => {
      localStorage.removeItem("adminLogueado");
      localStorage.removeItem("adminData");
      setEsAdmin(false);
    };
    return <PanelAdmin user={userData} onLogout={handleLogout} />;
  }

  return (
    <>
      <Navbar />
      <MainPage />
    </>
  );
}

