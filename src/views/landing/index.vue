<template>
  <div class="landing-container">
    <!-- NavBar Component -->
    <NavBar />

    <!-- Banner Component -->
    <Banner />

    <!-- Secciones de contenido -->
    <main class="main-content">
      <!-- Sección Nosotros -->
      <section id="nosotros" class="content-section">
        <div class="section-content">
          <div class="section-header">
            <h2>Nuestra Historia</h2>
            <p class="section-subtitle">De movimiento social a escuela de formación deportiva</p>
          </div>

          <div class="about-grid">
            <div class="about-card">
              <div class="card-icon">⛪</div>
              <h3>Nuestros Inicios</h3>
              <p>Fundado en junio 2019 como "Movimiento de Atletas Cristianos" por el Prof. Carlos Pérez, iniciando como proyecto social para alejar a los jóvenes de los vicios y la delincuencia durante la pandemia.</p>
            </div>

            <div class="about-card">
              <div class="card-icon">🏛️</div>
              <h3>Evolución Institucional</h3>
              <p>El 19/09/2021 se convierte en Club Atlético Deportivo Acarigua, registrándose legalmente el 15/11/2022. Hoy contamos con junta directiva, consejo de honor y asamblea de padres.</p>
            </div>

            <div class="about-card">
              <div class="card-icon">🎯</div>
              <h3>Misión</h3>
              <p>Formar atletas profesionales altamente capacitados física, motriz y cognitivamente, con principios cristianos que gerencien su desarrollo humanístico para la excelencia deportiva.</p>
            </div>

            <div class="about-card">
              <div class="card-icon">👁️</div>
              <h3>Visión</h3>
              <p>Ser una institución modelo de impacto social, constituida con fundamentos cristianos, inspirando a atletas en su desarrollo integral y validando su potencial deportivo.</p>
            </div>

            <div class="about-card">
              <div class="card-icon">🤝</div>
              <h3>Alianzas</h3>
              <p>Trabajamos en convenio con la U.P.T.P Juan de Jesús Montilla, utilizando sus instalaciones deportivas y desarrollando proyectos de mejoras continuas para beneficio de la comunidad.</p>
            </div>

            <div class="about-card">
              <div class="card-icon">📊</div>
              <h3>Impacto Social</h3>
              <p>Capacitamos mensualmente a más de 250 personas entre niños, adolescentes y adultos, fortaleciendo el núcleo familiar y desarrollando el potencial deportivo del municipio Páez.</p>
            </div>
          </div>

          <div class="stats-section">
            <div class="stat-item">
              <div class="stat-number">250+</div>
              <div class="stat-label">Personas Beneficiadas</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">2019</div>
              <div class="stat-label">Año de Fundación</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">60</div>
              <div class="stat-label">Miembros Iniciales</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Sección Contacto eliminada según solicitud del usuario -->
    </main>

    <!-- Footer Component -->
    <Footer />
  </div>
</template>

<script>
import NavBar from '@/components/Landing/NavBar.vue'
import Banner from '@/components/Landing/Banner.vue'
import Footer from '@/components/Landing/Footer.vue'

export default {
  name: 'LandingPage',
  components: {
    NavBar,
    Banner,
    Footer
  }
}
</script>

<style scoped>
.landing-container {
  min-height: 100vh;
  font-family: 'Figtree', 'Segoe UI', sans-serif;
}

.main-content {
  min-height: 100vh;
}

.content-section {
  padding: 5rem 2rem;
  max-width: 1200px;
  margin: 0 auto 3rem;
  border-radius: 10px;
}

.content-section:nth-child(even) {
  background: #f8f9fa;
}

.section-content {
  text-align: center;
}

.section-header {
  margin-bottom: 4rem;
}

.section-header h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-text-dark);
  font-weight: 700;
}

.section-subtitle {
  font-size: 1.2rem;
  color: #000000;
  font-weight: 400;
  max-width: 600px;
  margin: 0 auto;
}

/* Estilos para la sección Nosotros */
.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.about-card {
  background: var(--color-background);
  padding: 2.5rem 2rem;
  border: 1px solid var(--color-text-light);
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s ease;
}

.about-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.about-card h3 {
  color: var(--color-primary);
  font-size: 1.3rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.about-card p {
  color: var(--color-text-dark);
  line-height: 1.7;
  opacity: 0.8;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  text-align: center;
  padding: 3rem 0;
  border-top: 1px solid var(--color-text-light);
}

.stat-item {
  padding: 1rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--color-text-dark);
  font-weight: 500;
  opacity: 0.8;
}

/* Estilos de contacto eliminados */

/* Responsive */
@media (max-width: 992px) {
  .about-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .content-section {
    padding: 2.5rem 1rem;
    margin: 0 auto 2rem;
  }

  .section-header {
    margin-bottom: 2.5rem;
  }

  .section-header h2 {
    font-size: 1.75rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }

  .about-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .about-card {
    padding: 1.75rem 1.5rem;
  }

  .card-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .about-card h3 {
    font-size: 1.15rem;
  }

  .about-card p {
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .stats-section {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    padding: 2rem 0;
  }

  .stat-number {
    font-size: 1.75rem;
  }

  .stat-label {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .content-section {
    padding: 2rem 0.75rem;
  }

  .section-header h2 {
    font-size: 1.5rem;
  }

  .section-subtitle {
    font-size: 0.9rem;
  }

  .about-grid {
    grid-template-columns: 1fr;
  }

  .about-card {
    padding: 1.5rem 1.25rem;
  }

  .stats-section {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .stat-item {
    padding: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }
}

@media (max-width: 320px) {
  .section-header h2 {
    font-size: 1.35rem;
  }

  .about-card h3 {
    font-size: 1.05rem;
  }
}
</style>
