<template>
  <section id="inicio" class="banner">
    <!-- Carrusel de Fotos - Sin controles -->
    <div class="banner-carousel">
      <el-carousel
        :interval="5000"
        height="100vh"
        :indicator-position="null"
        :arrow="never"
        class="hero-carousel simple-carousel"
      >
        <el-carousel-item v-for="(image, index) in carouselImages" :key="index">
          <div
            class="carousel-slide"
            :style="{ backgroundImage: `url(${image.url})` }"
          >
            <div class="carousel-overlay" />
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- Contenido del Banner (se mantiene igual) -->
    <div class="banner-content">
      <div class="banner-text">
        <div class="badge">
          <span class="badge-text">Fundado 2019</span>
        </div>

        <h1 class="banner-title">
          <span class="title-line">Club Atlético</span>
          <span class="title-line highlight">Deportivo Acarigua</span>
        </h1>

        <p class="banner-description">
          Formando atletas con valores cristianos, disciplina y excelencia deportiva.
          Más de 250 personas beneficiadas en el municipio Páez.
        </p>

        <div class="banner-actions">
          <el-button
            type="primary"
            size="large"
            class="primary-action"
            @click="goToLogin"
          >
            <i class="el-icon-user" />
            Acceder al Sistema
          </el-button>

          <el-button
            size="large"
            class="secondary-action"
            @click="scrollToSection('nosotros')"
          >
            <i class="el-icon-info" />
            Conocer Más
          </el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import img1 from '@/assets/carousel/1.jpeg'
import img2 from '@/assets/carousel/2.jpeg'
import img3 from '@/assets/carousel/3.jpeg'
import img4 from '@/assets/carousel/4.jpeg'
import img5 from '@/assets/carousel/5.jpeg'
import img6 from '@/assets/carousel/6.jpeg'
import img7 from '@/assets/carousel/7.jpeg'

defineOptions({ name: 'LandingBanner' })

const router = useRouter()

const carouselImages = ref([
  { url: img1, alt: 'Equipo en gradas' },
  { url: img2, alt: 'Partido' },
  { url: img3, alt: 'Entrenamiento' },
  { url: img4, alt: 'Eventos del club' },
  { url: img5, alt: 'Equipo' },
  { url: img6, alt: 'Partido' },
  { url: img7, alt: 'Partido' }
])

const goToLogin = () => {
  router.push('/login')
}

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>


<style scoped>
.banner {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: 80px;
  font-family: 'Figtree', 'Segoe UI', sans-serif;
}

/* Carrusel Styles */
.banner-carousel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.hero-carousel {
  width: 100%;
  height: 100%;
}

.carousel-slide {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.carousel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.9) 0%,
    rgba(239, 68, 68, 0.6) 100%
  );
}

/* OCULTAR TODOS LOS CONTROLES DEL CARRUSEL */
:deep(.simple-carousel .el-carousel__container) {
  height: 100vh !important;
}

/* Ocultar indicadores de paginación */
:deep(.simple-carousel .el-carousel__indicators) {
  display: none !important;
}

/* Ocultar flechas de navegación */
:deep(.simple-carousel .el-carousel__arrow) {
  display: none !important;
}

/* Asegurar que no haya scroll */
:deep(.simple-carousel .el-carousel) {
  overflow: hidden !important;
}

:deep(.simple-carousel .el-carousel__container) {
  overflow: hidden !important;
}

/* Contenido del banner */
.banner-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  color: #ffffff;
}

.banner-text {
  color: #ffffff;
}

.badge {
  display: inline-block;
  background: #ffffff;
  color: var(--color-primary);
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.badge-text {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.banner-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.title-line {
  display: block;
}

.highlight {
  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.banner-description {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  opacity: 0.9;
  font-weight: 300;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.banner-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.primary-action {
  background: #ffffff;
  color: var(--color-primary);
  border: 2px solid #ffffff;
  padding: 15px 30px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
}

.secondary-action {
  background: transparent;
  border: 2px solid #ffffff;
  color: #ffffff;
  padding: 15px 30px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.secondary-action:hover {
  background: var(--color-background);
  color: var(--color-primary);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .banner {
    margin-top: 65px;
  }

  .banner-content {
    padding: 1.5rem 1.25rem;
  }

  .banner-title {
    font-size: 2.4rem;
    line-height: 1.15;
  }

  .title-line {
    display: block;
  }

  .banner-description {
    font-size: 1.05rem;
    margin-bottom: 2.5rem;
    line-height: 1.6;
    padding: 0 0.5rem;
  }

  .badge {
    padding: 0.5rem 1.25rem;
    margin-bottom: 1.75rem;
  }

  .badge-text {
    font-size: 0.8rem;
    letter-spacing: 0.5px;
  }

  .banner-actions {
    gap: 1rem;
  }

  .primary-action,
  .secondary-action {
    padding: 14px 28px;
    font-size: 1rem;
    font-weight: 600;
  }
}

@media (max-width: 480px) {
  .banner {
    margin-top: 55px;
  }

  .banner-content {
    padding: 1rem;
  }

  .banner-title {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .title-line.highlight {
    font-size: 2.2rem;
  }

  .banner-description {
    font-size: 0.95rem;
    margin-bottom: 2rem;
    line-height: 1.5;
  }

  .badge {
    padding: 0.5rem 1rem;
    margin-bottom: 1.5rem;
  }

  .badge-text {
    font-size: 0.75rem;
  }

  .banner-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    padding: 0 0.75rem;
    gap: 0.75rem;
  }

  .primary-action,
  .secondary-action {
    width: 100%;
    justify-content: center;
    padding: 16px 24px;
    font-size: 1rem;
    border-radius: 10px;
    box-sizing: border-box;
    border: 2px solid transparent;
  }

  .primary-action {
    box-shadow: 0 4px 15px rgba(229, 29, 34, 0.4);
    border-color: transparent;
  }

  .secondary-action {
    background: transparent;
    border: 2px solid #ffffff;
    color: #ffffff;
  }
}

@media (max-width: 360px) {
  .banner-title {
    font-size: 1.75rem;
  }

  .title-line.highlight {
    font-size: 1.9rem;
  }

  .banner-description {
    font-size: 0.9rem;
  }

  .badge {
    padding: 0.4rem 0.9rem;
  }

  .badge-text {
    font-size: 0.7rem;
  }
}
</style>
