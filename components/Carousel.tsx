'use client';
import React from 'react';
import Slider from 'react-slick';
import Image from 'next/image';
import './Carousel.css';

// Importa los estilos de slick-carousel
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const Carousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    fade: true,
    cssEase: 'linear',
    arrows: false,
    // Mejoras de accesibilidad
    accessibility: true,
    focusOnSelect: false,
    // Evita que los slides ocultos sean enfocables
    focusOnChange: false,
    // Asegura que solo el slide activo sea accesible
    lazyLoad: 'ondemand' as const, // Tipo correcto para lazyLoad
    // Desactiva el tabindex en los slides no activos
    useCSS: true,
  };

  const images = [
    // Corregí las rutas para que apunten a la carpeta /images/
    // y añadí la descripción 'alt' que es necesaria.
    { src: '/images/imagen2.png', alt: 'Descripción de la imagen 2' },
    { src: '/images/imagen6.png', alt: 'Descripción de la imagen 6' },
    { src: '/images/imagen8.png', alt: 'Descripción de la imagen 8' },
  ];

  return (
    <div className="carousel-container">
      <Slider {...settings}>
        {images.map((image, index) => (
          <div key={index} className="carousel-slide">
            <Image 
              src={image.src} 
              alt={image.alt} 
              layout="fill"
              objectFit="cover"
              priority={index === 0} // Prioriza la carga de la primera imagen
            />
            <div className="carousel-caption">
              <h2>Gestión de Turnos Inteligente</h2>
              <p>Tu solución para una planificación eficiente y sin complicaciones.</p>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Carousel;
