'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import "./MainPage.css";
import Carousel from './Carousel';
import HomeFeatures from './HomeFeatures';
import { Footer } from './Footer';

const MainPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si el usuario ya está autenticado
    const empleadoLogueado = typeof window !== 'undefined' ? window.localStorage.getItem("empleadoLogueado") === "true" : false;
    const adminLogueado = typeof window !== 'undefined' ? window.localStorage.getItem("adminLogueado") === "true" : false;
    
    if (adminLogueado) {
      router.push('/admin');
    } else if (empleadoLogueado) {
      router.push('/empleado');
    }
    
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <div>Cargando...</div>; // O un componente de carga
  }

  return (
    <div className="main-page">
      <Carousel />
      <HomeFeatures />
      <Footer />
    </div>
  );
}

export default MainPage;
