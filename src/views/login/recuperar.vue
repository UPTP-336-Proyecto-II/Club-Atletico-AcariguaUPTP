<template>
  <div class="recovery-container">
    <!-- Fondo con cancha de fútbol -->
    <div class="recovery-background">
      <div class="soccer-field" />
      <div class="gradient-overlay" />
    </div>

    <!-- Contenedor principal -->
    <div class="recovery-center-wrapper">
      <!-- Tarjeta de recuperación -->
      <div class="recovery-card">
        <!-- Header -->
        <div class="recovery-header">
          <div class="logo-section">
            <div class="logo-container">
              <img src="@/assets/icons/logo.png" alt="Club Atlético Deportivo Acarigua" class="logo-image">
            </div>
            <div class="logo-text">
              <h1>Club Atlético</h1>
              <p>Deportivo Acarigua</p>
            </div>
          </div>
          <div class="welcome-section">
            <h2>Recuperar Contraseña</h2>
            <p>{{ stepDescriptions[recoveryStep] }}</p>
          </div>
        </div>

        <!-- Indicador de pasos -->
        <div class="steps-indicator">
          <div
            v-for="step in 3"
            :key="step"
            class="step-dot"
            :class="{ active: recoveryStep >= step, current: recoveryStep === step }"
          >
            <span>{{ step }}</span>
          </div>
        </div>

        <!-- Paso 1: Ingresar Email -->
        <div v-if="recoveryStep === 1" class="recovery-step">
          <el-form ref="emailForm" :model="recoveryForm" class="recovery-form">
            <el-form-item prop="email">
              <el-input
                v-model="recoveryForm.email"
                placeholder="Correo electrónico"
                prefix-icon="el-icon-message"
                size="large"
                @keyup.enter.native="verifyEmail"
              />
            </el-form-item>
          </el-form>
          <div v-if="recoveryError" class="recovery-error">
            <i class="el-icon-warning" /> {{ recoveryError }}
          </div>
          <el-button
            type="primary"
            size="large"
            class="recovery-button"
            :loading="loading"
            @click="verifyEmail"
          >
            Continuar
          </el-button>
        </div>

        <!-- Paso 2: Responder Preguntas -->
        <div v-if="recoveryStep === 2" class="recovery-step">
          <el-form ref="questionsForm" :model="recoveryForm" class="recovery-form">
            <div class="question-block">
              <label>{{ recoveryForm.pregunta_1 }}</label>
              <el-input
                v-model="recoveryForm.respuesta_1"
                placeholder="Tu respuesta"
                size="large"
              />
            </div>
            <div class="question-block">
              <label>{{ recoveryForm.pregunta_2 }}</label>
              <el-input
                v-model="recoveryForm.respuesta_2"
                placeholder="Tu respuesta"
                size="large"
                @keyup.enter.native="verifyAnswers"
              />
            </div>
          </el-form>
          <div v-if="recoveryError" class="recovery-error">
            <i class="el-icon-warning" /> {{ recoveryError }}
          </div>
          <el-button
            type="primary"
            size="large"
            class="recovery-button"
            :loading="loading"
            @click="verifyAnswers"
          >
            Verificar Respuestas
          </el-button>
        </div>

        <!-- Paso 3: Nueva Contraseña -->
        <div v-if="recoveryStep === 3" class="recovery-step">
          <el-form ref="passwordForm" :model="recoveryForm" class="recovery-form">
            <el-form-item>
              <el-input
                v-model="recoveryForm.nueva_password"
                type="password"
                placeholder="Nueva contraseña"
                size="large"
                show-password
                @input="checkPasswordStrength"
              />
            </el-form-item>
            <el-form-item>
              <el-input
                v-model="recoveryForm.confirmar_password"
                type="password"
                placeholder="Confirmar contraseña"
                size="large"
                show-password
                @keyup.enter.native="changePassword"
              />
            </el-form-item>
          </el-form>

          <!-- Password Checklist -->
          <div class="password-checklist">
            <div class="checklist-title">Tu contraseña debe tener:</div>
            <div class="checklist-item" :class="{ valid: passwordChecks.length }">
              <i :class="passwordChecks.length ? 'el-icon-check' : 'el-icon-close'" />
              Mínimo 12 caracteres
            </div>
            <div class="checklist-item" :class="{ valid: passwordChecks.uppercase }">
              <i :class="passwordChecks.uppercase ? 'el-icon-check' : 'el-icon-close'" />
              Una letra mayúscula (A-Z)
            </div>
            <div class="checklist-item" :class="{ valid: passwordChecks.lowercase }">
              <i :class="passwordChecks.lowercase ? 'el-icon-check' : 'el-icon-close'" />
              Una letra minúscula (a-z)
            </div>
            <div class="checklist-item" :class="{ valid: passwordChecks.number }">
              <i :class="passwordChecks.number ? 'el-icon-check' : 'el-icon-close'" />
              Al menos un número (0-9)
            </div>
            <div class="checklist-item" :class="{ valid: passwordChecks.special }">
              <i :class="passwordChecks.special ? 'el-icon-check' : 'el-icon-close'" />
              Un carácter especial (!@#$%^&*)
            </div>
            <!-- Strength Bar -->
            <div class="strength-bar">
              <div class="strength-label">Fortaleza: <span :class="'strength-' + passwordStrength">{{ passwordStrengthLabel }}</span></div>
              <div class="strength-track">
                <div class="strength-fill" :class="'strength-' + passwordStrength" :style="{ width: passwordStrengthPercent + '%' }" />
              </div>
            </div>
          </div>

          <div v-if="recoveryError" class="recovery-error">
            <i class="el-icon-warning" /> {{ recoveryError }}
          </div>
          <el-button
            type="primary"
            size="large"
            class="recovery-button"
            :loading="loading"
            :disabled="!isPasswordValid"
            @click="changePassword"
          >
            Cambiar Contraseña
          </el-button>
        </div>

        <!-- Paso 4: Éxito -->
        <div v-if="recoveryStep === 4" class="recovery-step success-step">
          <i class="el-icon-circle-check success-icon" />
          <h3>¡Contraseña Actualizada!</h3>
          <p>Tu contraseña ha sido cambiada exitosamente.</p>
          <el-button
            type="primary"
            size="large"
            class="recovery-button"
            @click="goToLogin"
          >
            Iniciar Sesión
          </el-button>
        </div>

        <div v-if="recoveryStep < 4" class="recovery-footer">
          <p>
            <a href="#" class="back-link" @click.prevent="goToLogin">
              <i class="el-icon-arrow-left" /> Volver al inicio de sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { obtenerPreguntasPorEmail, verificarSoloRespuestas, verificarYCambiarPassword } from '@/api/preguntasSeguridad'

export default {
  name: 'RecuperarPassword',
  data() {
    return {
      recoveryStep: 1,
      loading: false,
      recoveryError: '',
      stepDescriptions: {
        1: 'Ingresa tu correo electrónico',
        2: 'Responde tus preguntas de seguridad',
        3: 'Crea tu nueva contraseña',
        4: '¡Listo!'
      },
      recoveryForm: {
        email: '',
        usuario_id: null,
        pregunta_1: '',
        pregunta_2: '',
        respuesta_1: '',
        respuesta_2: '',
        nueva_password: '',
        confirmar_password: ''
      },
      passwordChecks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      }
    }
  },
  computed: {
    isPasswordValid() {
      const checks = this.passwordChecks
      return checks.length && checks.uppercase && checks.lowercase && checks.number && checks.special
    },
    passwordStrength() {
      const count = Object.values(this.passwordChecks).filter(v => v).length
      if (count <= 2) return 'weak'
      if (count <= 4) return 'medium'
      return 'strong'
    },
    passwordStrengthLabel() {
      const labels = { weak: 'Débil', medium: 'Media', strong: 'Fuerte' }
      return labels[this.passwordStrength]
    },
    passwordStrengthPercent() {
      const count = Object.values(this.passwordChecks).filter(v => v).length
      return (count / 5) * 100
    }
  },
  methods: {
    checkPasswordStrength() {
      const password = this.recoveryForm.nueva_password || ''
      this.passwordChecks = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      }
    },
    async verifyEmail() {
      if (!this.recoveryForm.email) {
        this.recoveryError = 'Ingresa tu correo electrónico'
        return
      }
      this.loading = true
      this.recoveryError = ''
      try {
        const response = await obtenerPreguntasPorEmail(this.recoveryForm.email)
        this.recoveryForm.usuario_id = response.data.usuario_id
        this.recoveryForm.pregunta_1 = response.data.pregunta_1
        this.recoveryForm.pregunta_2 = response.data.pregunta_2
        this.recoveryStep = 2
      } catch (error) {
        this.recoveryError = error.response?.data?.error || 'No se encontró el usuario o no tiene preguntas de seguridad'
      } finally {
        this.loading = false
      }
    },
    async verifyAnswers() {
      if (!this.recoveryForm.respuesta_1 || !this.recoveryForm.respuesta_2) {
        this.recoveryError = 'Debes responder ambas preguntas'
        return
      }
      this.loading = true
      this.recoveryError = ''
      try {
        await verificarSoloRespuestas({
          usuario_id: this.recoveryForm.usuario_id,
          respuesta_1: this.recoveryForm.respuesta_1,
          respuesta_2: this.recoveryForm.respuesta_2
        })
        this.recoveryStep = 3
      } catch (error) {
        this.recoveryError = error.response?.data?.error || 'Las respuestas no son correctas'
      } finally {
        this.loading = false
      }
    },
    async changePassword() {
      if (!this.isPasswordValid) {
        this.recoveryError = 'La contraseña no cumple todos los requisitos'
        return
      }
      if (this.recoveryForm.nueva_password !== this.recoveryForm.confirmar_password) {
        this.recoveryError = 'Las contraseñas no coinciden'
        return
      }
      this.loading = true
      this.recoveryError = ''
      try {
        await verificarYCambiarPassword({
          usuario_id: this.recoveryForm.usuario_id,
          respuesta_1: this.recoveryForm.respuesta_1,
          respuesta_2: this.recoveryForm.respuesta_2,
          nueva_password: this.recoveryForm.nueva_password
        })
        this.recoveryStep = 4
      } catch (error) {
        this.recoveryError = error.response?.data?.error || 'Las respuestas no son correctas'
      } finally {
        this.loading = false
      }
    },
    goToLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style lang="scss" scoped>
.recovery-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.recovery-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.soccer-field {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a5c1a 0%, #2d7d2d 50%, #1a5c1a 100%);
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%);
}

.recovery-center-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 2rem;
}

.recovery-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.recovery-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 1rem;
}

.logo-container {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-text h1 {
  font-size: 1.2rem;
  color: #E51D22;
  margin: 0;
  font-weight: 700;
}

.logo-text p {
  font-size: 0.9rem;
  color: #333;
  margin: 0;
}

.welcome-section h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 5px 0;
}

.welcome-section p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

/* Steps Indicator */
.steps-indicator {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 1.5rem;
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  transition: all 0.3s;
  position: relative;
}

.step-dot.active {
  background: #E51D22;
  color: white;
}

.step-dot.current {
  box-shadow: 0 0 0 4px rgba(229, 29, 34, 0.2);
}

.step-dot:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  width: 30px;
  height: 2px;
  background: #e2e8f0;
  transform: translateY(-50%);
}

.step-dot.active:not(:last-child)::after {
  background: #E51D22;
}

/* Form styles */
.recovery-form {
  margin-bottom: 1rem;
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
  margin-bottom: 15px;
  padding: 10px;
  background: #fef2f2;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recovery-button {
  width: 100%;
  background: #E51D22 !important;
  border-color: #E51D22 !important;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  padding: 12px;
  height: auto;
}

.recovery-button:hover {
  background: #c41a1d !important;
  border-color: #c41a1d !important;
}

.recovery-button:disabled {
  background: #94a3b8 !important;
  border-color: #94a3b8 !important;
}

/* Password Checklist */
.password-checklist {
  margin-bottom: 15px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.checklist-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #94a3b8;
  padding: 3px 0;
  transition: color 0.2s;
}

.checklist-item.valid {
  color: #22c55e;
}

.strength-bar {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}

.strength-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 5px;
}

.strength-track {
  height: 5px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s, background 0.3s;
}

.strength-fill.strength-weak { background: #ef4444; }
.strength-fill.strength-medium { background: #f59e0b; }
.strength-fill.strength-strong { background: #22c55e; }
.strength-weak { color: #ef4444; font-weight: 600; }
.strength-medium { color: #f59e0b; font-weight: 600; }
.strength-strong { color: #22c55e; font-weight: 600; }

/* Success step */
.success-step {
  text-align: center;
  padding: 20px 0;
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
  margin-bottom: 20px;
}

/* Footer */
.recovery-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.recovery-footer p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.back-link {
  color: #E51D22;
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .recovery-center-wrapper {
    padding: 1rem;
  }

  .recovery-card {
    padding: 1.5rem;
  }
}
</style>
