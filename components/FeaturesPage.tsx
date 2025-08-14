export default function FeaturesPage() {
  return (
    <div className="main-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Características Principales</h1>
            <p>Descubre cómo nuestra solución puede optimizar la gestión de turnos en tu organización.</p>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                <span className="emoji">&#x1F552;</span>
                </div>
                <div className="feature-content">
                  <h3>Gestión de Personal</h3>
                  <p>Administra y registra tus turnos en el sistema de manera eficiente y organizada. Mantén un control total sobre el personal y sus horarios de trabajo.</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                <span className="emoji">&#x1F4CB;</span>
                </div>
                <div className="feature-content">
                  <h3>Registro Automático</h3>
                  <p>Controla los cambios en los turnos de forma automática y sin complicaciones. El sistema se encarga de todo el proceso de registro.</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                <span className="emoji">&#x1F4CA;</span>
                </div>
                <div className="feature-content">
                  <h3>Reportes Detallados</h3>
                  <p>Genera reportes completos de asistencia y horas trabajadas por empleado. Obtén información valiosa para la toma de decisiones.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
