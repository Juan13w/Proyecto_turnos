'use client';
import React from 'react';
import Slider from 'react-slick';
import Image from 'next/image';
import './Carousel.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Carousel = () => {
  const settings = {
    dots: true, infinite: true, speed: 500,
    slidesToShow: 1, slidesToScroll: 1,
    autoplay: true, autoplaySpeed: 3000,
    fade: true, cssEase: 'linear', arrows: false,
    accessibility: true, focusOnSelect: false,
    focusOnChange: false, lazyLoad: 'ondemand' as const, useCSS: true,
  };

  const images = [
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
              priority={index === 0}
            />
            <div className="carousel-caption">
              <h2>Gestión de Turnos Inteligente</h2>
              <p>Tu solución para una planificación eficiente y sin complicaciones.</p>
            </div>
          </div>
        ))}
      </Slider>

      {/* Divisor ondulado hacia HomeFeatures */}
      <div className="carousel-divider" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradient" gradientTransform="rotate(90)">
              <stop offset="0%" stopColor="#0d1b2a" stopOpacity="1" />
              <stop offset="100%" stopColor="#0d1b2a" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d="M0,32L48,37.3C96,43,192,53,288,53.3C384,53,480,43,576,43.3C672,43,768,53,864,50C960,48,1056,43,1152,39.3C1248,36,1344,36,1392,36L1440,36L1440,0L0,0Z" />
        </svg>
      </div>
    </div>
    
  );
};

export default Carousel;
