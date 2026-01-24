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

<script>
export default {
  name: 'LandingBanner',
  data() {
    return {
      carouselImages: [
        {
          url: require('@/assets/carousel/1.jpeg'),
          alt: 'Equipo en gradas'
        },
        {
          url: require('@/assets/carousel/2.jpeg'),
          alt: 'Partido'
        },
        {
          url: require('@/assets/carousel/3.jpeg'),
          alt: 'Entrenamiento'
        },
        {
          url: require('@/assets/carousel/4.jpeg'),
          alt: 'Eventos del club'
        },
        {
          url: require('@/assets/carousel/5.jpeg'),
          alt: 'Equipo'
        },
        {
          url: require('@/assets/carousel/6.jpeg'),
          alt: 'Partido'
        },
        {
          url: require('@/assets/carousel/7.jpeg'),
          alt: 'Partido'
        }
      ]
    }
  },
  methods: {
    goToLogin() {
      this.$router.push('/login')
    },
    scrollToSection(sectionId) {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
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

.simple-carousel {
  /* Elimina cualquier espacio para controles */
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
    rgba(229, 29, 34, 0.7) 0%,
    rgba(139, 0, 0, 0.6) 100%
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
  color: var(--color-background);
}

.banner-text {
  color: var(--color-background);
}

.badge {
  display: inline-block;
  background: var(--color-background);
  color: var(--color-primary);
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  margin-bottom: 2rem;
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
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-text-light) 100%);
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
  background: var(--color-background);
  color: var(--color-primary);
  border: none;
  padding: 15px 30px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
}

.secondary-action {
  background: transparent;
  border: 2px solid var(--color-background);
  color: var(--color-background);
  padding: 15px 30px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.secondary-action:hover {
  background: var(--color-background);
  color: var(--color-primary);
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .banner-content {
    padding: 1rem;
  }

  .banner-title {
    font-size: 2.2rem;
  }

  .banner-description {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .banner-title {
    font-size: 1.8rem;
  }

  .banner-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
