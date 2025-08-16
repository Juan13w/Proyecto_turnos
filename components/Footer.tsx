import React from 'react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logos">
          <img 
            src="/images/logo1.png" 
            alt="Logo 1" 
            className="footer-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <img 
            src="/images/logo2.png" 
            alt="Logo 2" 
            className="footer-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <img 
            src="/images/logo3.png" 
            alt="Logo 3" 
            className="footer-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <img 
            src="/images/logo4.png" 
            alt="Logo 4" 
            className="footer-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div className="footer-text">
          <p>© {new Date().getFullYear()} Gestión de Turnos. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};