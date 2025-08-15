import React from 'react';
import './HomeFeatures.css';

const features = [
  {
    icon: '&#x1F552;', // Reloj
    title: 'Gestión de Horarios',
    description: 'Registra entradas, salidas y descansos con un solo clic. Precisión y facilidad para empleados y administradores.',
  },
  {
    icon: '&#x1F4CB;', // Gráfico de barras
    title: 'Reportes Detallados',
    description: 'Genera informes completos por empleado o período. Visualiza horas trabajadas, ausencias y puntualidad.',
  },
  {
    icon: '&#x1F4CA;', // Teléfono móvil
    title: 'Interfaz Intuitiva',
    description: 'Un diseño limpio y moderno, accesible desde cualquier dispositivo, que no requiere capacitación previa.',
  },
];

const HomeFeatures = () => {
 return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-header">
          <h2>Todo lo que necesitas para una gestión eficiente</h2>
          <p>Descubre las herramientas que transformarán la manera en que administras los turnos de tu equipo.</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                <span 
                  className="emoji" 
                  dangerouslySetInnerHTML={{__html: feature.icon}}
                />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeFeatures;