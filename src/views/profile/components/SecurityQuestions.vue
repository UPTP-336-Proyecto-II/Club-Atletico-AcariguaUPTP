<template>
  <div class="security-questions-container">
    <div class="header-section">
      <h3>Configuración de Seguridad</h3>
      <p class="text-muted">Establece 3 preguntas de seguridad para recuperar tu contraseña en caso de olvido.</p>
    </div>

    <div v-if="loading" class="loading-container">
      <i class="el-icon-loading" /> Cargando datos...
    </div>

    <el-form
      v-else
      ref="form"
      :model="form"
      :rules="rules"
      label-position="top"
      class="questions-form"
    >
      <!-- Pregunta 1 -->
      <div class="question-block">
        <el-form-item label="Pregunta de Seguridad 1" prop="pregunta_1">
          <el-select v-model="form.pregunta_1" placeholder="Selecciona una pregunta" style="width: 100%">
            <el-option
              v-for="item in availableQuestions"
              :key="item.id"
              :label="item.pregunta"
              :value="item.id"
              :disabled="isQuestionSelected(item.id, 1)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Respuesta" prop="respuesta_1">
          <el-input
            v-model="form.respuesta_1"
            placeholder="Tu respuesta"
            show-password
          />
        </el-form-item>
      </div>

      <!-- Pregunta 2 -->
      <div class="question-block">
        <el-form-item label="Pregunta de Seguridad 2" prop="pregunta_2">
          <el-select v-model="form.pregunta_2" placeholder="Selecciona una pregunta" style="width: 100%">
            <el-option
              v-for="item in availableQuestions"
              :key="item.id"
              :label="item.pregunta"
              :value="item.id"
              :disabled="isQuestionSelected(item.id, 2)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Respuesta" prop="respuesta_2">
          <el-input
            v-model="form.respuesta_2"
            placeholder="Tu respuesta"
            show-password
          />
        </el-form-item>
      </div>

      <!-- Pregunta 3 -->
      <div class="question-block">
        <el-form-item label="Pregunta de Seguridad 3" prop="pregunta_3">
          <el-select v-model="form.pregunta_3" placeholder="Selecciona una pregunta" style="width: 100%">
            <el-option
              v-for="item in availableQuestions"
              :key="item.id"
              :label="item.pregunta"
              :value="item.id"
              :disabled="isQuestionSelected(item.id, 3)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Respuesta" prop="respuesta_3">
          <el-input
            v-model="form.respuesta_3"
            placeholder="Tu respuesta"
            show-password
          />
        </el-form-item>
      </div>

      <div class="form-actions">
        <el-button type="primary" :loading="saving" @click="saveQuestions">
          Guardar Configuración
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import { getPreguntasDisponibles, guardarPreguntas, obtenerPreguntasRespuestasUsuario } from '@/api/preguntasSeguridad'
import { mapGetters } from 'vuex'

export default {
  name: 'SecurityQuestions',
  data() {
    return {
      loading: false,
      saving: false,
      availableQuestions: [],
      form: {
        pregunta_1: '',
        respuesta_1: '',
        pregunta_2: '',
        respuesta_2: '',
        pregunta_3: '',
        respuesta_3: ''
      },
      rules: {
        pregunta_1: [{ required: true, message: 'Selecciona una pregunta', trigger: 'change' }],
        respuesta_1: [{ required: true, message: 'Ingresa una respuesta', trigger: 'blur' }],
        pregunta_2: [{ required: true, message: 'Selecciona una pregunta', trigger: 'change' }],
        respuesta_2: [{ required: true, message: 'Ingresa una respuesta', trigger: 'blur' }],
        pregunta_3: [{ required: true, message: 'Selecciona una pregunta', trigger: 'change' }],
        respuesta_3: [{ required: true, message: 'Ingresa una respuesta', trigger: 'blur' }]
      }
    }
  },
  computed: {
    ...mapGetters(['userId']) // Asumiendo que existe este getter, si no usaremos otra forma
  },
  created() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // Cargar preguntas disponibles
        const responseQuestions = await getPreguntasDisponibles()
        this.availableQuestions = Array.isArray(responseQuestions) ? responseQuestions : []

        // Cargar configuración actual del usuario
        // Nota: Necesitamos el ID del usuario. Si no está en getters, podemos pasarlo como prop o sacarlo del store.
        const userId = this.$store.getters.id || this.$store.state.user.id
        if (userId) {
          const response = await obtenerPreguntasRespuestasUsuario(userId)
          const userConfig = response.data || response || []
          if (userConfig && userConfig.length > 0) {
            // Mapear preguntas existentes usando el pregunta_id
            userConfig.forEach((item, index) => {
              if (index < 3) {
                const i = index + 1
                this.form[`pregunta_${i}`] = item.pregunta_id
                // Las respuestas se dejan en blanco por seguridad
              }
            })
          }
        }
      } catch (error) {
        console.error('Error cargando datos de seguridad:', error)
        this.$message.error('Error al cargar la información')
      } finally {
        this.loading = false
      }
    },

    isQuestionSelected(question, currentFieldNum) {
      // Retorna true si la pregunta está seleccionada en OTRO campo
      for (let i = 1; i <= 3; i++) {
        if (i !== currentFieldNum && this.form[`pregunta_${i}`] === question) {
          return true
        }
      }
      return false
    },

    saveQuestions() {
      this.$refs.form.validate(async(valid) => {
        if (!valid) return

        this.saving = true
        try {
          const payload = {
            preguntas: [
              { pregunta_id: this.form.pregunta_1, respuesta: this.form.respuesta_1 },
              { pregunta_id: this.form.pregunta_2, respuesta: this.form.respuesta_2 },
              { pregunta_id: this.form.pregunta_3, respuesta: this.form.respuesta_3 }
            ]
          }

          await guardarPreguntas(payload)
          this.$message.success('Preguntas de seguridad actualizadas correctamente')

          // Limpiar respuestas por seguridad después de guardar? O dejarlas?
          // this.form.respuesta_1 = ''
          // this.form.respuesta_2 = ''
          // this.form.respuesta_3 = ''
        } catch (error) {
          console.error('Error guardando preguntas:', error)
          this.$message.error('Error al guardar los cambios')
        } finally {
          this.saving = false
        }
      })
    }
  }
}
</script>

<style scoped>
.security-questions-container {
  padding: 20px 0;
}

.header-section {
  margin-bottom: 25px;
}

.header-section h3 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 1.3rem;
  font-weight: 700;
}

.header-section .text-muted {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Question blocks with enhanced styling */
.question-block {
  background: linear-gradient(135deg, var(--color-bg-card), var(--color-bg-body));
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 2px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.question-block:hover {
  border-color: var(--color-primary);
  box-shadow: 0 6px 20px rgba(30, 41, 59, 0.12);
  transform: translateY(-2px);
}

/* Form item labels */
.question-block :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 0.95rem;
  padding-bottom: 8px;
}

/* Enhanced select inputs */
.question-block :deep(.el-select .el-input__inner),
.question-block :deep(.el-input__inner) {
  background: var(--color-bg-card) !important;
  border: 2px solid #64748b !important;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-main);
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  height: auto;
  min-height: 44px;
}

.question-block :deep(.el-select .el-input__inner:hover),
.question-block :deep(.el-input__inner:hover) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.1);
}

.question-block :deep(.el-select .el-input__inner:focus),
.question-block :deep(.el-input__inner:focus),
.question-block :deep(.el-input.is-focus .el-input__inner) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px rgba(229, 29, 34, 0.15);
}

/* Placeholder styling */
.question-block :deep(.el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
  font-weight: 500;
}

/* Select dropdown arrow */
.question-block :deep(.el-select .el-input .el-select__caret) {
  color: var(--color-text-muted);
  font-size: 16px;
}

/* Password input icon */
.question-block :deep(.el-input__suffix) {
  color: var(--color-text-muted);
}

/* Form actions button */
.form-actions {
  margin-top: 30px;
  text-align: right;
}

.form-actions :deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover)) !important;
  border: none !important;
  padding: 14px 32px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(30, 41, 59, 0.3);
  transition: all 0.3s ease;
}

.form-actions :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(229, 29, 34, 0.4);
}

/* Loading state */
.loading-container {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
  font-size: 1rem;
}

.loading-container i {
  font-size: 1.5rem;
  margin-right: 8px;
  color: var(--color-primary);
}
</style>
