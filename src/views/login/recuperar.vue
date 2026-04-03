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
                  size="large"
                  @keyup.enter="verifyEmail"
                >
                  <template #prefix>
                    <el-icon><MessageIcon /></el-icon>
                  </template>
                </el-input>
            </el-form-item>
          </el-form>
          <div v-if="recoveryError" class="recovery-error">
            <el-icon><Warning /></el-icon> {{ recoveryError }}
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
              />
            </div>
            <div v-if="recoveryForm.pregunta_3" class="question-block">
              <label>{{ recoveryForm.pregunta_3 }}</label>
              <el-input
                v-model="recoveryForm.respuesta_3"
                placeholder="Tu respuesta"
                size="large"
                @keyup.enter="verifyAnswers"
              />
            </div>
          </el-form>
          <div v-if="recoveryError" class="recovery-error">
            <el-icon><Warning /></el-icon> {{ recoveryError }}
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
                  @keyup.enter="changePassword"
                />
            </el-form-item>
          </el-form>

          <!-- Password Checklist -->
          <div class="password-checklist">
            <div class="checklist-title">Tu contraseña debe tener:</div>
            <div class="checklist-item" :class="{ valid: passwordChecks.length }">
              <el-icon><component :is="passwordChecks.length ? Check : Close" /></el-icon>
              Mínimo 12 caracteres
            </div>
            <div class="checklist-item" :class="{ valid: passwordChecks.uppercase }">
              <el-icon><component :is="passwordChecks.uppercase ? Check : Close" /></el-icon>
              Una letra mayúscula (A-Z)
            </div>
            <div class="checklist-item" :class="{ valid: passwordChecks.lowercase }">
              <el-icon><component :is="passwordChecks.lowercase ? Check : Close" /></el-icon>
              Una letra minúscula (a-z)
            </div>
            <div class="checklist-item" :class="{ valid: passwordChecks.number }">
              <el-icon><component :is="passwordChecks.number ? Check : Close" /></el-icon>
              Al menos un número (0-9)
            </div>
            <div class="checklist-item" :class="{ valid: passwordChecks.special }">
              <el-icon><component :is="passwordChecks.special ? Check : Close" /></el-icon>
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
            <el-icon><Warning /></el-icon> {{ recoveryError }}
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
          <el-icon class="success-icon"><CircleCheck /></el-icon>
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
              <el-icon><ArrowLeft /></el-icon> Volver al inicio de sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { obtenerPreguntasPorEmail, verificarSoloRespuestas, verificarYCambiarPassword } from '@/api/preguntasSeguridad'
import { Message as MessageIcon, Warning, Check, Close, CircleCheck, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const recoveryStep = ref(1)
const loading = ref(false)
const recoveryError = ref('')

const stepDescriptions = {
  1: 'Ingresa tu correo electrónico',
  2: 'Responde tus preguntas de seguridad',
  3: 'Crea tu nueva contraseña',
  4: '¡Listo!'
}

const recoveryForm = reactive({
  email: '',
  usuario_id: null,
  pregunta_id_1: null,
  pregunta_id_2: null,
  pregunta_id_3: null,
  pregunta_1: '',
  pregunta_2: '',
  pregunta_3: '',
  respuesta_1: '',
  respuesta_2: '',
  respuesta_3: '',
  nueva_password: '',
  confirmar_password: ''
})

const passwordChecks = reactive({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false
})

const isPasswordValid = computed(() => {
  return passwordChecks.length && passwordChecks.uppercase && passwordChecks.lowercase && passwordChecks.number && passwordChecks.special
})

const passwordStrength = computed(() => {
  const count = Object.values(passwordChecks).filter(v => v).length
  if (count <= 2) return 'weak'
  if (count <= 4) return 'medium'
  return 'strong'
})

const passwordStrengthLabel = computed(() => {
  const labels = { weak: 'Débil', medium: 'Media', strong: 'Fuerte' }
  return labels[passwordStrength.value]
})

const passwordStrengthPercent = computed(() => {
  const count = Object.values(passwordChecks).filter(v => v).length
  return (count / 5) * 100
})

const checkPasswordStrength = () => {
  const password = recoveryForm.nueva_password || ''
  passwordChecks.length = password.length >= 12
  passwordChecks.uppercase = /[A-Z]/.test(password)
  passwordChecks.lowercase = /[a-z]/.test(password)
  passwordChecks.number = /[0-9]/.test(password)
  passwordChecks.special = /[!@#$%^&*(),.?":{}|<>]/.test(password)
}

const verifyEmail = async () => {
  if (!recoveryForm.email) {
    recoveryError.value = 'Ingresa tu correo electrónico'
    return
  }
  loading.value = true
  recoveryError.value = ''
  try {
    const response = await obtenerPreguntasPorEmail(recoveryForm.email)
    recoveryForm.usuario_id = response.usuario_id
    if (response.preguntas && response.preguntas.length >= 2) {
      recoveryForm.pregunta_id_1 = response.preguntas[0].id
      recoveryForm.pregunta_1 = response.preguntas[0].pregunta
      recoveryForm.pregunta_id_2 = response.preguntas[1].id
      recoveryForm.pregunta_2 = response.preguntas[1].pregunta
      if (response.preguntas[2]) {
        recoveryForm.pregunta_id_3 = response.preguntas[2].id
        recoveryForm.pregunta_3 = response.preguntas[2].pregunta
      }
    }
    recoveryStep.value = 2
  } catch (error) {
    recoveryError.value = error.response?.data?.error || 'No se encontró el usuario o no tiene preguntas de seguridad'
  } finally {
    loading.value = false
  }
}

const verifyAnswers = async () => {
  if (!recoveryForm.respuesta_1 || !recoveryForm.respuesta_2) {
    recoveryError.value = 'Debes responder todas las preguntas'
    return
  }
  if (recoveryForm.pregunta_3 && !recoveryForm.respuesta_3) {
    recoveryError.value = 'Debes responder todas las preguntas'
    return
  }
  loading.value = true
  recoveryError.value = ''
  try {
    const respuestas = {}
    respuestas[recoveryForm.pregunta_id_1] = recoveryForm.respuesta_1
    respuestas[recoveryForm.pregunta_id_2] = recoveryForm.respuesta_2
    if (recoveryForm.pregunta_id_3 && recoveryForm.respuesta_3) {
      respuestas[recoveryForm.pregunta_id_3] = recoveryForm.respuesta_3
    }

    await verificarSoloRespuestas({
      usuario_id: recoveryForm.usuario_id,
      respuestas: respuestas
    })
    recoveryStep.value = 3
  } catch (error) {
    recoveryError.value = error.response?.data?.error || 'Las respuestas no son correctas'
  } finally {
    loading.value = false
  }
}

const changePassword = async () => {
  if (!isPasswordValid.value) {
    recoveryError.value = 'La contraseña no cumple todos los requisitos'
    return
  }
  if (recoveryForm.nueva_password !== recoveryForm.confirmar_password) {
    recoveryError.value = 'Las contraseñas no coinciden'
    return
  }
  loading.value = true
  recoveryError.value = ''
  try {
    const respuestas = {}
    respuestas[recoveryForm.pregunta_id_1] = recoveryForm.respuesta_1
    respuestas[recoveryForm.pregunta_id_2] = recoveryForm.respuesta_2
    if (recoveryForm.pregunta_id_3 && recoveryForm.respuesta_3) {
      respuestas[recoveryForm.pregunta_id_3] = recoveryForm.respuesta_3
    }

    await verificarYCambiarPassword({
      usuario_id: recoveryForm.usuario_id,
      respuestas: respuestas,
      newPassword: recoveryForm.nueva_password
    })
    recoveryStep.value = 4
  } catch (error) {
    recoveryError.value = error.response?.data?.error || 'Las respuestas no son correctas'
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
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
  background: var(--color-bg-card);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 60px var(--color-shadow);
  border: 1px solid var(--color-border);
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
  color: var(--color-primary);
  margin: 0;
  font-weight: 700;
}

.logo-text p {
  font-size: 0.9rem;
  color: var(--color-text-main);
  margin: 0;
}

.welcome-section h2 {
  font-size: 1.5rem;
  color: var(--color-text-main);
  margin: 0 0 5px 0;
}

.welcome-section p {
  color: var(--color-text-muted);
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
  background: var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-border);
  transition: all 0.3s;
  position: relative;
}

.step-dot.active {
  background: var(--color-primary);
  color: white;
}

.step-dot.current {
  box-shadow: 0 0 0 4px rgba(30, 41, 59, 0.2);
}

.step-dot:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  width: 30px;
  height: 2px;
  background: var(--color-border);
  transform: translateY(-50%);
}

.step-dot.active:not(:last-child)::after {
  background: var(--color-primary);
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
  color: var(--color-text-main);
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
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  padding: 12px;
  height: auto;
}

.recovery-button:hover {
  background: var(--color-primary-hover) !important;
  border-color: var(--color-primary-hover) !important;
}

.recovery-button:disabled {
  background: var(--color-border) !important;
  border-color: var(--color-border) !important;
}

/* Password Checklist */
.password-checklist {
  margin-bottom: 15px;
  padding: 12px;
  background: var(--color-bg-card);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.checklist-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--color-border);
  padding: 3px 0;
  transition: color 0.2s;
}

.checklist-item.valid {
  color: #22c55e;
}

.strength-bar {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}

.strength-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 5px;
}

.strength-track {
  height: 5px;
  background: var(--color-border);
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
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

/* Footer */
.recovery-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.recovery-footer p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.back-link {
  color: var(--color-primary);
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
