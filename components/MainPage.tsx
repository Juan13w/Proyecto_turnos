'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import "./MainPage.css";
import Carousel from './Carousel';
import HomeFeatures from './HomeFeatures';
import Footer from './Footer';

const MainPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya está autenticado
    const empleadoLogueado = window.localStorage.getItem("empleadoLogueado") === "true";
    const adminLogueado = window.localStorage.getItem("adminLogueado") === "true";
    setIsLoggedIn(empleadoLogueado || adminLogueado);
  }, []);

  if (isLoggedIn) return null;

  return (
    <div className="main-page">
      <div className="page-content">
        <Carousel />
        <HomeFeatures />
      </div>
      <Footer />
    </div>
  );
}

export default MainPage;
