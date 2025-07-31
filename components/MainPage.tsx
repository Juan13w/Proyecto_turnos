'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import "./MainPage.css";
import Carousel from './Carousel';
import HomeFeatures from './HomeFeatures';

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
      <Carousel />
      <HomeFeatures />
    </div>
  );
}

export default MainPage;
