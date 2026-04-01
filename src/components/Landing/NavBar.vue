<template>
  <div class="navbar">
    <div class="navbar-container">
      <!-- Logo -->
      <div class="navbar-brand">
        <div class="logo">
          <img src="../../assets/icons/logo.png" class="logo-icon">
          <div class="logo-text">
            <span class="club-name">Club Atlético</span>
            <span class="club-subname">Deportivo Acarigua</span>
            <span class="club-motto">"La Armadura de Dios"</span>
          </div>
        </div>
      </div>

      <!-- Menú de navegación -->
      <div class="navbar-menu">
        <nav class="nav-links">
          <a href="#inicio" class="nav-link">Inicio</a>
          <a href="#nosotros" class="nav-link">Nosotros</a>
          <a href="#footer" class="nav-link">Contacto</a>
        </nav>
      </div>

      <!-- Botón de acción -->
      <div class="navbar-actions">
        <button
          type="button"
          class="theme-toggle"
          :aria-label="theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          :title="theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          @click="toggleTheme"
        >
          <el-icon v-if="theme === 'dark'"><Sunny /></el-icon>
          <el-icon v-else><Moon /></el-icon>
        </button>
        <el-button class="login-btn" @click="goToLogin">Acceder</el-button>

        <!-- Menú móvil -->
        <div class="mobile-menu" @click="toggleMobileMenu">
          <i class="el-icon-menu" />
        </div>
      </div>
    </div>

    <!-- Menú móvil desplegable -->
    <div v-show="mobileMenuOpen" class="mobile-nav">
      <a href="#inicio" class="mobile-nav-link" @click="closeMobileMenu">Inicio</a>
      <a href="#nosotros" class="mobile-nav-link" @click="closeMobileMenu">Nosotros</a>
      <a href="#footer" class="mobile-nav-link" @click="closeMobileMenu">Contacto</a>
      <div class="mobile-actions">
        <el-button class="mobile-login-btn" @click="goToLogin">Acceder</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { Moon, Sunny } from '@element-plus/icons-vue'
import { applyTheme, getSavedTheme, saveTheme } from '@/utils/theme'

export default {
  name: 'LandingNavBar',
  components: {
    Moon,
    Sunny
  },
  data() {
    return {
      mobileMenuOpen: false,
      theme: getSavedTheme()
    }
  },
  mounted() {
    this.theme = applyTheme(this.theme)
    window.addEventListener('resize', this.closeMobileMenu)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.closeMobileMenu)
  },
  methods: {
    goToLogin() {
      this.$router.push('/login')
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false
    },
    toggleTheme() {
      const nextTheme = this.theme === 'light' ? 'dark' : 'light'
      this.theme = saveTheme(nextTheme)
    }
  }
}
</script>

<style scoped>
.navbar {
  background: var(--color-background);
  border-bottom: 1px solid var(--color-text-light);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1rem 0;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

/* Logo y marca */
.navbar-brand {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  height: 50px;
  width: auto;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.club-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-dark);
}

.club-subname {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-dark);
  opacity: 0.8;
}

.club-motto {
  font-size: 0.75rem;
  color: var(--color-primary);
  font-style: italic;
  font-weight: 500;
}

/* Menú de navegación */
.navbar-menu {
  display: flex;
  align-items: center;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: var(--color-text-dark);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  width: 100%;
}

/* Botones de acción */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: var(--color-primary);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(255, 59, 48, 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.theme-toggle :deep(.el-icon) {
  font-size: 1.1rem;
}

.theme-toggle:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(255, 59, 48, 0.28);
}

.theme-toggle:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(255, 59, 48, 0.2),
    0 12px 24px rgba(255, 59, 48, 0.22);
}

.login-btn {
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 500;
}

.login-btn:hover {
  background-color: var(--color-primary);
  color: var(--color-background);
}

/* Menú móvil */
.mobile-menu {
  display: none;
  font-size: 1.5rem;
  color: var(--color-text-dark);
  cursor: pointer;
  padding: 0.5rem;
}

.mobile-nav {
  display: none;
  background: var(--color-background);
  border-top: 1px solid var(--color-text-light);
  padding: 1rem 2rem;
  flex-direction: column;
  gap: 1rem;
}

.mobile-nav-link {
  color: var(--color-text-dark);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-text-light);
  transition: color 0.3s ease;
}

.mobile-nav-link:hover {
  color: var(--color-primary);
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-text-light);
}

.mobile-login-btn {
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 500;
}

.mobile-login-btn:hover {
  background-color: var(--color-primary);
  color: var(--color-background);
}

/* Responsive */
@media (max-width: 768px) {
  .navbar {
    padding: 0.75rem 0;
  }

  .navbar-container {
    padding: 0 1rem;
  }

  .navbar-menu {
    display: none;
  }

  .navbar-actions .login-btn {
    display: none;
  }

  .mobile-menu {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.05);
    transition: background 0.2s ease;
  }

  .mobile-menu:active {
    background: rgba(0, 0, 0, 0.1);
  }

  .mobile-nav {
    display: flex;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mobile-nav-link {
    padding: 0.75rem 0;
    font-size: 1rem;
  }

  .mobile-login-btn {
    width: 100%;
    min-height: 48px;
  }

  .logo-text {
    display: none;
  }

  .logo-icon {
    height: 45px;
  }
}

@media (max-width: 480px) {
  .navbar-container {
    padding: 0.5rem 0.75rem;
  }

  .navbar-actions {
    gap: 0.5rem;
  }

  .logo-icon {
    height: 38px;
  }

  .mobile-menu {
    width: 44px;
    height: 44px;
  }

  .theme-toggle {
    width: 42px;
    height: 42px;
    border-radius: 10px;
  }
}

@media (max-width: 320px) {
  .logo-icon {
    height: 32px;
  }
}
</style>
