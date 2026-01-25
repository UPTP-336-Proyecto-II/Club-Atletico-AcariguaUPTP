<template>
  <div class="login-container">
    <!-- Fondo con cancha de fútbol -->
    <div class="login-background">
      <div class="soccer-field" />
      <div class="gradient-overlay" />
    </div>

    <!-- Contenedor principal -->
    <div class="login-center-wrapper">
      <!-- Tarjeta de login -->
      <div class="login-card">
        <!-- Header -->
        <div class="login-header">
          <div class="logo-section">
            <div class="logo-container">
              <img src="@/assets/icons/logo.png" alt="Club Atlético Deportivo Acarigua" class="logo-image">
            </div>
            <div class="logo-text">
              <h1>Club Atlético</h1>
              <p>Deportivo Acarigua</p>
              <span class="club-motto">"La Armadura de Dios"</span>
            </div>
          </div>
          <div class="welcome-section">
            <h2>Bienvenido</h2>
            <p>Ingresa al sistema del club</p>
          </div>
        </div>

        <!-- Formulario -->
        <el-form
          ref="loginForm"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @submit.native.prevent="handleLogin"
        >
          <el-form-item prop="username" class="form-item-custom">
            <div class="input-group">
              <el-input
                ref="username"
                v-model="loginForm.username"
                placeholder="Usuario"
                size="large"
                class="mobile-input"
                @input="handleInput"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password" class="form-item-custom">
            <div class="input-group">
              <el-input
                ref="password"
                v-model="loginForm.password"
                :type="passwordType"
                placeholder="Contraseña"
                size="large"
                class="mobile-input"
                @keyup.enter.native="handleLogin"
                @input="handleInput"
              />
              <button type="button" class="password-toggle" aria-label="Mostrar u ocultar contraseña" @click="showPwd">
                <i class="el-icon-view" />
              </button>
            </div>
            <!-- Forgot password link -->
            <div class="forgot-wrapper">
              <a href="#" class="forgot-link" @click.prevent="forgotPassword">¿Olvidaste tu contraseña?</a>
            </div>
          </el-form-item>

          <el-button
            :loading="loading"
            type="primary"
            size="large"
            class="login-button mobile-button"
            native-type="submit"
          >
            <span v-if="!loading">Iniciar Sesión</span>
            <span v-else>Accediendo...</span>
          </el-button>
        </el-form>

        <div class="login-footer">
          <p>¿Necesitas acceso?
            <a href="#" class="register-link" @click.prevent="showContactModal = true">Contacta a la directiva</a>
          </p>
        </div>
      </div> <!-- Fin login-card -->
    </div> <!-- Fin login-center-wrapper -->

    <!-- Modal de Contacto -->
    <el-dialog
      title="Información de Contacto"
      :visible.sync="showContactModal"
      width="400px"
      custom-class="contact-modal"
      :top="'0'"
    >
      <div class="contact-modal-content">
        <div class="modal-logo">
          <img src="@/assets/icons/logo.png" alt="Logo">
        </div>
        <p class="modal-description">Para solicitar acceso o recuperar tu cuenta, por favor comunícate con la administración:</p>

        <div class="contact-list">
          <div class="contact-item">
            <div class="icon-wrapper whatsapp">
              <!-- Using same image but removing heavy filters to keep original look if desired, or matching footer exactly -->
              <img src="@/assets/icons/whatsapp-icon.png" alt="WhatsApp">
            </div>
            <div class="info">
              <span class="label">WhatsApp (Sr. Carlos Perez)</span>
              <a href="https://wa.me/5841215562442" target="_blank" class="value">+58 412-15562442</a>
            </div>
          </div>

          <div class="contact-item">
            <div class="icon-wrapper email">
              <img src="@/assets/icons/email-icon.png" alt="Email">
            </div>
            <div class="info">
              <span class="label">Correo Electrónico</span>
              <a href="mailto:clubatleticodeportivoacarigua@gmail.com" class="value">clubatleticodeportivoacarigua@gmail.com</a>
            </div>
          </div>

          <div class="contact-item">
            <div class="icon-wrapper location">
              <img src="@/assets/icons/maps-icon.png" alt="Map">
            </div>
            <div class="info">
              <span class="label">Ubicación</span>
              <a href="https://goo.gl/maps/..." target="_blank" class="value">U.P.T.P Juan de Jesús Montilla, Acarigua</a>
            </div>
          </div>

          <div class="social-links">
            <a href="https://www.facebook.com/profile.php?id=100086449924024" target="_blank" class="social-btn facebook">
              <img src="@/assets/icons/facebook-icon.png" alt="Facebook">
            </a>
            <a href="https://instagram.com/Deportivoacarigua_oficial" target="_blank" class="social-btn instagram">
              <img src="@/assets/icons/instagram-icon.png" alt="Instagram">
            </a>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Botón de volver -->
    <div class="back-to-home">
      <button
        class="back-button mobile-back-button"
        @click="goToLanding"
      >
        <i class="el-icon-arrow-left" />
        <span>Volver al Inicio</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value || value.trim() === '') {
        callback(new Error('Ingresa tu usuario'))
      } else {
        callback()
      }
    }
    const validatePassword = (rule, value, callback) => {
      if (!value || value.length < 6) {
        callback(new Error('Mínimo 6 caracteres'))
      } else {
        callback()
      }
    }
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', validator: validateUsername }],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }]
      },
      passwordType: 'password',
      loading: false,
      isMobile: false,
      showContactModal: false
    }
  },
  mounted() {
    this.detectMobile()
    this.$nextTick(() => {
      this.$refs.username.focus()
    })

    window.addEventListener('resize', this.detectMobile)
    window.addEventListener('orientationchange', this.detectMobile)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.detectMobile)
    window.removeEventListener('orientationchange', this.detectMobile)
  },
  methods: {
    detectMobile() {
      this.isMobile = window.innerWidth <= 768
    },
    showPwd() {
      this.passwordType = this.passwordType === 'password' ? 'text' : 'password'
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    handleInput() {
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true
          this.$store.dispatch('user/login', this.loginForm)
            .then(() => {
              this.$router.push({ path: this.$route.query.redirect || '/dashboard' })
              this.loading = false
            })
            .catch(() => {
              this.loading = false
            })
        }
      })
    },
    goToLanding() {
      this.$router.push('/')
    },
    forgotPassword() {
      this.$router.push('/recuperar-password')
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow-y: auto;
  background: linear-gradient(135deg, var(--color-primary) 0%, #8B0000 100%);
  padding: 0;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('../../assets/carousel/1.jpeg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.soccer-field {
  display: none;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(229, 29, 34, 0.75) 0%, rgba(139, 0, 0, 0.65) 100%);
}

.login-center-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 440px;
  padding: 1rem;
  margin: 0 auto;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  width: 100%;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 8px;
}

.logo-text h1 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text-dark);
  margin: 0;
  line-height: 1.2;
}

.logo-text p {
  font-size: 0.9rem;
  color: var(--color-text-dark);
  margin: 0;
  font-weight: 600;
  opacity: 0.9;
}

.club-motto {
  font-size: 0.75rem;
  color: var(--color-primary);
  font-style: italic;
  font-weight: 500;
}

.welcome-section h2 {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-text-dark);
  margin: 0 0 0.25rem 0;
}

.welcome-section p {
  color: #000;
  margin: 0;
  font-size: 0.9rem;
}

.login-form {
  margin-bottom: 1.5rem;
}

:deep(.form-item-custom .el-form-item__error) {
  padding-top: 4px !important;
  margin-top: 2px !important;
  position: relative !important;
  top: 0 !important;
  transform: none !important;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.password-toggle {
  position: absolute;
  right: 12px;
  z-index: 3;
  color: var(--color-text-dark);
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  background: rgba(0,0,0,0.04);
  border: none;
  padding: 8px;
  border-radius: 6px;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 50%;
  transform: translateY(-50%);
  opacity: 1;
}

.password-toggle:hover {
  color: var(--color-primary);
  background: rgba(229, 29, 34, 0.1);
}

:deep(.mobile-input .el-input__inner) {
  padding-left: 16px !important;
  padding-right: 50px !important;
  height: 52px !important;
  border: 2px solid var(--color-text-light);
  border-radius: 12px;
  background: #ffffff;
  font-size: 16px !important;
  font-weight: 500;
  transition: all 0.2s ease;
  min-height: 52px;
  color: var(--color-text-dark);
}

:deep(.mobile-input .el-input__inner::placeholder) {
  color: var(--color-text-light);
  opacity: 1;
  padding-left: 30px !important;
  transition: padding-left 0.3s ease;
}

:deep(.mobile-input .el-input__inner:not(:placeholder-shown)) {
  padding-left: 16px !important;
}

:deep(.mobile-input .el-input__inner:hover) {
  border-color: #cbd5e0;
}

:deep(.mobile-input .el-input__inner:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(229, 29, 34, 0.1);
  padding-left: 16px !important;
}

/* Forgot Password */
.forgot-wrapper {
  text-align: right;
  margin-top: -5px;
  margin-bottom: 10px;
}

.forgot-link {
  font-size: 0.85rem;
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.login-button.mobile-button {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, var(--color-primary), #8B0000);
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(229, 29, 34, 0.3);
  min-height: 52px;
}

.login-button.mobile-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(229, 29, 34, 0.4);
}

.login-footer {
  text-align: center;
  padding-top: 1rem;
  margin-bottom: 0.5rem;
}

.login-footer p {
  color: #000;
  margin: 0;
  font-size: 0.85rem;
}

.register-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 4px;
}

.register-link:hover {
  background: rgba(229, 29, 34, 0.05);
  text-decoration: underline;
}

:deep(html) {
  scroll-behavior: smooth;
}

.back-to-home {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 3;
}

.back-button.mobile-back-button {
  color: white;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.back-button.mobile-back-button:hover {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  transform: scale(0.98);
}

/* Modal Styles */
.contact-modal-content {
  text-align: center;
  padding: 10px;
}

.modal-logo img {
  height: 60px;
  margin-bottom: 10px;
}

.modal-description {
  color: #666;
  margin-bottom: 20px;
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: keep-all; /* Fixed line breaking */
  white-space: normal;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  gap: 15px;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Specific centering for icons */
.icon-wrapper img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

/* Only filter whatsapp if not using original */
.icon-wrapper.whatsapp { background: transparent; } /* Modified to transparent if using standard colored icon, or #e0f2f1 if using filtered */

.icon-wrapper.location { background: #feebee; }
.icon-wrapper.email { background: #e3f2fd; }

.info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.info .label {
  font-size: 0.75rem;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.info .value {
  color: #2c3e50;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.95rem;
  word-break: break-word; /* Ensure URLs/emails break if too long */
}

.info .value:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.social-btn {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.social-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 12px rgba(0,0,0,0.15);
}

.social-btn img {
  width: 24px;
  height: 24px;
}

/* Centrado del Modal */
::v-deep .el-dialog__wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

::v-deep .contact-modal {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

::v-deep .vertical-center-modal .el-dialog__body {
    overflow-y: auto;
}

/* Media Queries para móvil */
@media (max-width: 768px) {
  .login-container {
    justify-content: center;
    padding-top: 0;
  }

  .login-center-wrapper {
    padding: 1rem;
  }
}

/* Recovery Modal Styles */
.recovery-step {
  padding: 10px 0;
}

.step-description {
  color: #64748b;
  margin-bottom: 15px;
  font-size: 0.95rem;
}

.question-block {
  margin-bottom: 15px;
}

.question-block label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.recovery-error {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 10px;
  padding: 10px;
  background: #fef2f2;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-step {
  text-align: center;
  padding: 30px 10px;
}

.success-icon {
  font-size: 4rem;
  color: #22c55e;
  margin-bottom: 15px;
}

.success-step h3 {
  color: #22c55e;
  margin-bottom: 10px;
}

.success-step p {
  color: #64748b;
}
</style>
