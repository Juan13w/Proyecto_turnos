'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import MainPage from "@/components/MainPage";
import PanelEmpleado from "@/components/PanelEmpleado";
import Navbar from "@/components/Navbar";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación en el cliente
    const isEmployee = localStorage.getItem("empleadoLogueado") === "true";
    const isAdmin = localStorage.getItem("adminLogueado") === "true";
    
    if (isAdmin) {
      router.replace('/admin');
      return;
    }

    if (isEmployee) {
      const storedData = localStorage.getItem("empleadoData");
      setUserData(storedData ? JSON.parse(storedData) : { email: "empleado@empresa.com" });
    }
    
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("empleadoLogueado");
    localStorage.removeItem("empleadoData");
    setUserData(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userData) {
    return <PanelEmpleado user={userData} onLogout={handleLogout} />;
  }

  return (
    <>
      <Navbar />
      <MainPage />
    </>
  );
}

