<template>
  <div class="usuarios-container">
    <!-- Header -->
    <div class="premium-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-user" /> Gestión de Usuarios</h1>
          <p class="subtitle">Club Atlético Deportivo Acarigua</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sidebar con lista de usuarios -->
      <aside class="sidebar">
        <el-card shadow="hover">
          <template #header>
            <div class="sidebar-header">
              <span class="sidebar-title">
                <el-icon><Collection /></el-icon>
                <span>Lista de Usuarios</span>
              </span>
              <div class="sidebar-actions">
                <button class="mini-add-btn" title="Agregar Usuario" @click="openUsuarioModal(false)">
                  <el-icon><Plus /></el-icon>
                </button>
                <el-popover
                  placement="bottom-end"
                  width="260"
                  trigger="click"
                >
                  <div class="filter-popover">
                    <h4>Filtros Avanzados</h4>
                    <div class="filter-item">
                      <label>Estatus</label>
                      <el-select v-model="filterEstatus" placeholder="Todos" clearable size="small" style="width: 100%">
                        <el-option label="Activos" value="ACTIVO" />
                        <el-option label="Inactivos" value="INACTIVO" />
                        <el-option label="Todos" value="TODOS" />
                      </el-select>
                    </div>
                    <div class="filter-item">
                      <label>Rol</label>
                      <el-select v-model="filterRol" placeholder="Todos los roles" clearable size="small" style="width: 100%">
                        <el-option
                          v-for="rol in roles"
                          :key="rol.rol_id"
                          :label="rol.nombre_rol"
                          :value="rol.rol_id"
                        />
                      </el-select>
                    </div>
                    <div class="filter-item">
                      <label>Ordenar por</label>
                      <el-select v-model="filterSort" placeholder="Seleccionar" size="small" style="width: 100%">
                        <el-option label="Más Recientes" value="reciente" />
                        <el-option label="Más Antiguos" value="antiguo" />
                        <el-option label="Alfabético A-Z" value="az" />
                        <el-option label="Alfabético Z-A" value="za" />
                      </el-select>
                    </div>
                  </div>
                  <template #reference>
                    <button class="filter-toggle-btn" title="Filtros avanzados">
                      <el-icon><Setting /></el-icon>
                    </button>
                  </template>
                </el-popover>
              </div>
            </div>
          </template>
          <div class="search-container">
            <label class="premium-search-label">Buscar Usuario</label>
            <el-input
              v-model="searchQuery"
              placeholder="Email o miembro..."
              size="small"
              clearable
              class="modern-search-input"
            />
          </div>
          <div class="user-list">
            <div
              v-for="usuario in filteredUsuarios"
              :key="getUsuarioIdentifier(usuario)"
              class="user-item"
              :class="{ active: currentUsuarioId === getUsuarioIdentifier(usuario) }"
              @click="selectUsuario(getUsuarioIdentifier(usuario))"
            >
              <div class="user-avatar">
                <i class="el-icon-user-solid" />
              </div>
              <div class="user-info">
                <h3>{{ usuario.email }}</h3>
                <p v-if="usuario.plantel_nombre" class="linked-member">
                  <i class="el-icon-link" /> {{ usuario.plantel_nombre }} {{ usuario.plantel_apellido }}
                </p>
                <p>{{ usuario.nombre_rol || 'Sin rol' }}</p>
                <el-tag :type="usuario.estatus === 'ACTIVO' ? 'success' : 'info'" size="mini">
                  {{ usuario.estatus }}
                </el-tag>
              </div>
            </div>
            <div v-if="filteredUsuarios.length === 0" class="empty-state">
              <p>No hay usuarios registrados</p>
            </div>
          </div>
        </el-card>
      </aside>

      <!-- Área de contenido -->
      <main class="content-area">
        <el-card v-if="!currentUsuarioId" shadow="hover">
          <div class="empty-state">
            <i class="el-icon-user-solid" style="font-size: 4rem; color: #ddd;" />
            <h3>No hay usuario seleccionado</h3>
            <p>Selecciona un usuario de la lista o agrega uno nuevo.</p>
          </div>
        </el-card>

        <el-card v-else shadow="hover">
          <!-- Encabezado del usuario -->
          <div class="user-details-header">
            <div class="user-details-avatar">
              <i class="el-icon-user-solid" />
            </div>
            <div class="user-details-info">
              <h2>{{ currentUsuario.email }}</h2>
              <p>Rol: {{ currentUsuario.nombre_rol || 'Sin rol asignado' }}</p>
              <el-tag :type="currentUsuario.estatus === 'ACTIVO' ? 'success' : 'info'" size="medium">
                {{ currentUsuario.estatus }}
              </el-tag>
            </div>
            <div class="user-actions">
              <el-button
                type="danger"
                class="action-btn action-btn-danger"
                @click="toggleEstatus"
              >
                <el-icon class="btn-icon">
                  <component :is="currentUsuario.estatus === 'ACTIVO' || currentUsuario.estatus === 'Activo' ? CircleClose : RefreshRight" />
                </el-icon>
                <span>{{ currentUsuario.estatus === 'ACTIVO' || currentUsuario.estatus === 'Activo' ? 'Desactivar' : 'Activar' }}</span>
              </el-button>
              <el-button type="danger" class="action-btn action-btn-danger" @click="handleEdit">
                <el-icon class="btn-icon"><Edit /></el-icon>
                <span>Editar</span>
              </el-button>
              <el-button type="danger" class="action-btn action-btn-danger" @click="handleDeleteUsuario">
                <el-icon class="btn-icon"><Delete /></el-icon>
                <span>Eliminar</span>
              </el-button>
            </div>
          </div>

          <!-- Información del usuario -->
          <div class="form-grid">
            <div class="form-item">
              <label>Email</label>
              <p>{{ currentUsuario.email }}</p>
            </div>
            <div class="form-item">
              <label>Rol</label>
              <el-tag type="primary">{{ currentUsuario.nombre_rol || 'Sin rol' }}</el-tag>
            </div>
            <div class="form-item">
              <label>Vinculado a</label>
              <p v-if="currentUsuario.plantel_nombre">
                <i class="el-icon-link" /> {{ currentUsuario.plantel_nombre }} {{ currentUsuario.plantel_apellido }}
              </p>
              <p v-else style="color: #909399; font-style: italic;">No vinculado</p>
            </div>
            <div class="form-item">
              <label>Descripción del Rol</label>
              <p>{{ currentUsuario.rol_descripcion || 'Sin descripción' }}</p>
            </div>
            <div class="form-item">
              <label>Estatus</label>
              <el-tag :type="currentUsuario.estatus === 'ACTIVO' ? 'success' : 'info'">
                {{ currentUsuario.estatus }}
              </el-tag>
            </div>
            <div class="form-item">
              <label>Último Acceso</label>
              <p>{{ formatDate(currentUsuario.ultimo_acceso) }}</p>
            </div>
            <div class="form-item">
              <label>Fecha de Creación</label>
              <p>{{ formatDate(currentUsuario.created_at) }}</p>
            </div>
          </div>
        </el-card>
      </main>
    </div>

    <!-- Modal Usuario -->
    <el-dialog
      :title="isEditing ? 'Editar Usuario' : 'Agregar Nuevo Usuario'"
      v-model="showUsuarioModal"
      width="700px"
      :close-on-click-modal="false"
      custom-class="usuario-modal"
    >
      <el-form ref="usuarioFormRef" :model="usuarioForm" :rules="usuarioRules" label-position="top">
        <el-form-item label="Email" prop="email">
          <el-input
            v-model="usuarioForm.email"
            placeholder="correo@ejemplo.com"
            @blur="checkEmailTypo"
          />
          <div v-if="emailSuggestion" class="email-suggestion">
            <i class="el-icon-info" />
            ¿Quisiste decir <strong @click="applyEmailSuggestion">{{ emailSuggestion }}</strong>?
          </div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Contraseña" prop="password">
              <el-input
                v-model="usuarioForm.password"
                type="password"
                :placeholder="isEditing ? 'Dejar en blanco para no cambiar' : 'Crea una contraseña segura'"
                show-password
                @input="checkPasswordStrength"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Confirmar Contraseña" prop="confirmPassword">
              <el-input
                v-model="usuarioForm.confirmPassword"
                type="password"
                placeholder="Repite la contraseña"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <!-- Password Requirements Checklist -->
            <div v-if="!isEditing || usuarioForm.password" class="password-checklist">
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
          </el-col>
        </el-row>
        <el-form-item label="Rol" prop="rol">
          <el-select v-model="usuarioForm.rol" placeholder="Seleccionar rol" style="width: 100%">
            <el-option
              v-for="rol in roles"
              :key="rol.rol_id"
              :label="rol.nombre_rol"
              :value="rol.rol_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Vincular con Miembro del Plantel (Opcional)">
          <el-select
            v-model="usuarioForm.plantel_id"
            placeholder="Seleccionar miembro del plantel"
            style="width: 100%"
            filterable
            clearable
          >
            <el-option
              v-for="miembro in plantelList"
              :key="miembro.plantel_id"
              :label="`${miembro.nombre} ${miembro.apellido} (${miembro.nombre_rol})`"
              :value="miembro.plantel_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="isEditing" label="Estatus">
          <el-select v-model="usuarioForm.estatus" placeholder="Seleccionar estatus" style="width: 100%">
            <el-option label="Activo" value="Activo" />
            <el-option label="Inactivo" value="Inactivo" />
          </el-select>
        </el-form-item>

        <!-- Sección de Preguntas de Seguridad -->
        <div class="security-questions-section">
          <el-divider content-position="left"><i class="el-icon-lock" /> Preguntas de Seguridad</el-divider>

          <el-form-item label="Pregunta 1" prop="pregunta_1">
            <el-select
              v-model="usuarioForm.pregunta_1"
              placeholder="Selecciona una pregunta"
              style="width: 100%"
              popper-class="security-question-popper"
            >
              <el-option
                v-for="pregunta in preguntasDisponibles"
                :key="pregunta.id"
                :label="pregunta.pregunta"
                :value="pregunta.id"
                :disabled="pregunta.id === usuarioForm.pregunta_2"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="Respuesta 1" prop="respuesta_1">
            <el-input v-model="usuarioForm.respuesta_1" placeholder="Tu respuesta" />
          </el-form-item>

          <el-form-item label="Pregunta 2" prop="pregunta_2">
            <el-select
              v-model="usuarioForm.pregunta_2"
              placeholder="Selecciona una pregunta"
              style="width: 100%"
              popper-class="security-question-popper"
            >
              <el-option
                v-for="pregunta in preguntasDisponibles"
                :key="pregunta.id"
                :label="pregunta.pregunta"
                :value="pregunta.id"
                :disabled="pregunta.id === usuarioForm.pregunta_1"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="Respuesta 2" prop="respuesta_2">
            <el-input v-model="usuarioForm.respuesta_2" placeholder="Tu respuesta" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="showUsuarioModal = false">Cancelar</el-button>
          <el-button type="primary" :loading="loading" @click="saveUsuario">
            {{ isEditing ? 'Actualizar' : 'Guardar' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getUsuarios, getUsuarioById, createUsuario, updateUsuario, deleteUsuario } from '@/api/usuarios'
import { getRoles } from '@/api/roles'
import { getPlantel } from '@/api/plantel'
import { getPreguntasDisponibles, guardarPreguntas, obtenerPreguntasRespuestasUsuario } from '@/api/preguntasSeguridad'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Collection, Plus, Setting, CircleClose, RefreshRight, Edit, Delete } from '@element-plus/icons-vue'
import { useServerDataRefresh } from '@/composables/useServerDataRefresh'

const usuarioFormRef = ref(null)

const usuarios = ref([])
const roles = ref([])
const plantelList = ref([])
const currentUsuarioId = ref(null)
const currentUsuario = ref({})
const loading = ref(false)
const searchQuery = ref('')
const filterEstatus = ref('Activo')
const filterRol = ref('')
const filterSort = ref('reciente')
const showUsuarioModal = ref(false)
const isEditing = ref(false)
const emailSuggestion = ref('')

const passwordChecks = ref({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false
})

const preguntasDisponibles = ref([])

const usuarioForm = ref({
  email: '',
  password: '',
  confirmPassword: '',
  rol: null,
  estatus: 'Activo',
  plantel_id: null,
  pregunta_1: '',
  respuesta_1: '',
  pregunta_2: '',
  respuesta_2: ''
})

const isPasswordValid = computed(() => {
  const checks = passwordChecks.value
  return checks.length && checks.uppercase && checks.lowercase && checks.number && checks.special
})

const validatePassword = (rule, value, callback) => {
  if (!isEditing.value && !value) {
    callback(new Error('La contraseña es requerida'))
  } else if (value && !isPasswordValid.value) {
    callback(new Error('La contraseña no cumple todos los requisitos'))
  } else {
    // Si la contraseña cambia, revalidar la confirmación
    if (usuarioFormRef.value) {
      usuarioFormRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (usuarioForm.value.password && !value) {
    callback(new Error('Debe confirmar su contraseña'))
  } else if (value !== usuarioForm.value.password) {
    callback(new Error('Las contraseñas no coinciden'))
  } else {
    callback()
  }
}

const usuarioRules = {
  email: [
    { required: true, message: 'El email es requerido', trigger: 'blur' },
    { type: 'email', message: 'Ingrese un email válido', trigger: 'blur' }
  ],
  password: [{ required: !isEditing.value, trigger: 'blur', validator: validatePassword }],
  confirmPassword: [{ required: !isEditing.value, trigger: 'blur', validator: validateConfirmPassword }],
  rol: [{ required: true, message: 'El rol es requerido', trigger: 'change' }],
  pregunta_1: [{ required: true, message: 'Selecciona una pregunta', trigger: 'change' }],
  respuesta_1: [{ required: true, message: 'Ingresa tu respuesta', trigger: 'blur' }],
  pregunta_2: [{ required: true, message: 'Selecciona una pregunta', trigger: 'change' }],
  respuesta_2: [{ required: true, message: 'Ingresa tu respuesta', trigger: 'blur' }]
}

const filteredUsuarios = computed(() => {
  let filtered = usuarios.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(u => u.email.toLowerCase().includes(query))
  }
  return filtered
})

const getUsuarioIdentifier = (usuario) => {
  if (!usuario) return null
  return usuario.usuario_id ?? usuario.email
}

const passwordStrength = computed(() => {
  const count = Object.values(passwordChecks.value).filter(v => v).length
  if (count <= 2) return 'weak'
  if (count <= 4) return 'medium'
  return 'strong'
})

const passwordStrengthLabel = computed(() => {
  const labels = { weak: 'Débil', medium: 'Media', strong: 'Fuerte' }
  return labels[passwordStrength.value]
})

const passwordStrengthPercent = computed(() => {
  const count = Object.values(passwordChecks.value).filter(v => v).length
  return (count / 5) * 100
})

watch([filterEstatus, filterRol, filterSort], () => {
  loadUsuarios()
})

const checkPasswordStrength = () => {
  const password = usuarioForm.value.password || ''
  passwordChecks.value = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
}

const checkEmailTypo = () => {
  const email = usuarioForm.value.email || ''
  const domain = email.split('@')[1]?.toLowerCase()

  const typoMap = {
    'gmal.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'hotmal.com': 'hotmail.com',
    'hotamil.com': 'hotmail.com',
    'outloo.com': 'outlook.com',
    'outlok.com': 'outlook.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com'
  }

  if (domain && typoMap[domain]) {
    emailSuggestion.value = email.split('@')[0] + '@' + typoMap[domain]
  } else {
    emailSuggestion.value = ''
  }
}

const applyEmailSuggestion = () => {
  if (emailSuggestion.value) {
    usuarioForm.value.email = emailSuggestion.value
    emailSuggestion.value = ''
  }
}

const loadUsuarios = async () => {
  try {
    const params = {}
    if (filterEstatus.value) {
      params.estatus = filterEstatus.value
    }
    if (filterRol.value) {
      params.rol = filterRol.value
    }
    params.sort = filterSort.value

    const response = await getUsuarios(params)
    usuarios.value = Array.isArray(response) ? response : []

    if (currentUsuarioId.value) {
      const exists = usuarios.value.find(u => getUsuarioIdentifier(u) === currentUsuarioId.value)
      if (!exists) {
        currentUsuarioId.value = null
        currentUsuario.value = {}
      }
    }
  } catch (error) {
    console.error('Error cargando usuarios:', error)
    ElMessage.error('Error al cargar usuarios')
  }
}

const loadRoles = async () => {
  try {
    const response = await getRoles()
    roles.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error cargando roles:', error)
  }
}

const loadPlantel = async () => {
  try {
    const response = await getPlantel()
    plantelList.value = response.data || response || []
  } catch (error) {
    console.error('Error cargando plantel:', error)
  }
}

const loadPreguntasDisponibles = async () => {
  try {
    const response = await getPreguntasDisponibles()
    const data = response.data || response
    const normalized = Array.isArray(data)
      ? data
        .map((item) => ({
          id: item.id ?? item.preguntas_id ?? item.pregunta_id ?? null,
          pregunta: item.pregunta ?? item.preguntas ?? item.texto ?? ''
        }))
        .filter((item) => item.id !== null && String(item.pregunta).trim() !== '')
      : []

    preguntasDisponibles.value = normalized
  } catch (error) {
    console.error('Error cargando preguntas:', error)
  }
}

const loadData = async () => {
  await Promise.all([
    loadUsuarios(),
    loadRoles(),
    loadPlantel(),
    loadPreguntasDisponibles()
  ])
}

const selectUsuario = async (id) => {
  currentUsuarioId.value = id
  try {
    const response = await getUsuarioById(id)
    currentUsuario.value = response
  } catch (error) {
    console.error('Error cargando usuario:', error)
    ElMessage.error('Error al cargar datos del usuario')
  }
}

const resetForm = () => {
  usuarioForm.value = {
    email: '',
    password: '',
    confirmPassword: '',
    rol: null,
    estatus: 'Activo',
    plantel_id: null,
    pregunta_1: '',
    respuesta_1: '',
    pregunta_2: '',
    respuesta_2: ''
  }
  passwordChecks.value = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  }
  emailSuggestion.value = ''
  if (usuarioFormRef.value) {
    usuarioFormRef.value.resetFields()
  }
}

const openUsuarioModal = async (isEditMode) => {
  isEditing.value = isEditMode
  if (!isEditMode) {
    resetForm()
  } else {
    if (!currentUsuarioId.value) return

    usuarioForm.value = {
      email: currentUsuario.value.email,
      password: '',
      confirmPassword: '',
      rol: currentUsuario.value.rol,
      estatus: currentUsuario.value.estatus,
      plantel_id: currentUsuario.value.plantel_id || null,
      pregunta_1: '',
      respuesta_1: '',
      pregunta_2: '',
      respuesta_2: ''
    }

    try {
      const res = await obtenerPreguntasRespuestasUsuario(currentUsuarioId.value)
      if (res && res.tiene_preguntas) {
        usuarioForm.value.pregunta_1 = res.pregunta_1
        usuarioForm.value.respuesta_1 = res.respuesta_1
        usuarioForm.value.pregunta_2 = res.pregunta_2
        usuarioForm.value.respuesta_2 = res.respuesta_2
      }
    } catch (error) {
      console.error('Error al cargar preguntas:', error)
    }
  }

  showUsuarioModal.value = true
  await Promise.all([
    loadRoles(),
    loadPlantel()
  ])
}

const handleEdit = () => {
  openUsuarioModal(true)
}

const saveUsuario = () => {
  usuarioFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      if (isEditing.value) {
        const dataToUpdate = {
          email: usuarioForm.value.email,
          rol: usuarioForm.value.rol,
          estatus: usuarioForm.value.estatus,
          plantel_id: usuarioForm.value.plantel_id
        }
        if (usuarioForm.value.password) {
          dataToUpdate.password = usuarioForm.value.password
        }
        await updateUsuario(currentUsuarioId.value, dataToUpdate)

        if (usuarioForm.value.pregunta_1 && usuarioForm.value.respuesta_1 &&
            usuarioForm.value.pregunta_2 && usuarioForm.value.respuesta_2) {
          await guardarPreguntas({
            preguntas: [
              { pregunta_id: usuarioForm.value.pregunta_1, respuesta: usuarioForm.value.respuesta_1 },
              { pregunta_id: usuarioForm.value.pregunta_2, respuesta: usuarioForm.value.respuesta_2 }
            ]
          })
        }

        ElMessage.success('Usuario actualizado exitosamente')
      } else {
        const createResponse = await createUsuario({
          email: usuarioForm.value.email,
          password: usuarioForm.value.password,
          rol: usuarioForm.value.rol,
          plantel_id: usuarioForm.value.plantel_id
        })

        const nuevoUsuarioId = createResponse.usuario_id
        if (nuevoUsuarioId) {
          await guardarPreguntas({
            preguntas: [
              { pregunta_id: usuarioForm.value.pregunta_1, respuesta: usuarioForm.value.respuesta_1 },
              { pregunta_id: usuarioForm.value.pregunta_2, respuesta: usuarioForm.value.respuesta_2 }
            ]
          })
        }

        ElMessage.success('Usuario creado exitosamente')
      }

      showUsuarioModal.value = false
      await loadUsuarios()
      if (isEditing.value) {
        await selectUsuario(currentUsuarioId.value)
      }
    } catch (error) {
      console.error('Error guardando usuario:', error)
      ElMessage.error(error.response?.data?.error || 'Error al guardar usuario')
    } finally {
      loading.value = false
    }
  })
}

const toggleEstatus = async () => {
  const newEstatus = currentUsuario.value.estatus === 'Activo' || currentUsuario.value.estatus === 'ACTIVO' ? 'Inactivo' : 'Activo'
  const action = newEstatus === 'Activo' ? 'activar' : 'desactivar'

  try {
    await ElMessageBox.confirm(`¿Está seguro de ${action} este usuario?`, 'Confirmar', {
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      type: 'warning'
    })

    await updateUsuario(currentUsuarioId.value, { estatus: newEstatus })
    ElMessage.success(`Usuario ${newEstatus === 'Activo' ? 'activado' : 'desactivado'} exitosamente`)
    await loadUsuarios()

    if (currentUsuarioId.value) {
      await selectUsuario(currentUsuarioId.value)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error cambiando estatus:', error)
      ElMessage.error('Error al cambiar estatus')
    }
  }
}

const handleDeleteUsuario = async () => {
  if (!currentUsuario.value) return

  try {
    await ElMessageBox.confirm(
      `¿Está seguro de eliminar permanentemente al usuario "${currentUsuario.value.email}"? Esta acción no se puede deshacer.`,
      'Confirmar Eliminación',
      {
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        type: 'warning'
      }
    )

    await deleteUsuario(currentUsuarioId.value)
    ElMessage.success('Usuario eliminado exitosamente')
    currentUsuarioId.value = null
    currentUsuario.value = {}
    await loadUsuarios()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error eliminando usuario:', error)
      ElMessage.error(error.response?.data?.error || 'Error al eliminar usuario')
    }
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Nunca'
  const date = new Date(dateString)
  return date.toLocaleString('es-ES')
}

useServerDataRefresh(async () => {
  await loadData()
  if (currentUsuarioId.value) {
    await selectUsuario(currentUsuarioId.value)
  }
}, {
  isBusy: () => loading.value || showUsuarioModal.value
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.usuarios-container {
  padding: 20px;
}

/* Local UI Adjustments */
.header-content h1 {
  margin: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 5px 0;
}

.subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

/* Header Button - Modern Executive Style */
.header-content :deep(> .el-button--primary) {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 12px 24px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-content :deep(> .el-button--primary:hover) {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.header-content :deep(> .el-button--primary:active) {
  transform: translateY(0);
}

.main-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 15px;
}

aside.sidebar {
  padding: 0;
  background: transparent;
  margin-bottom: 0;
}

.sidebar .el-card {
  height: calc(100vh - 200px);
  overflow: hidden;
}

.sidebar :deep(.el-card__body) {
  padding: 0;
}

.user-list {
  max-height: calc(100vh - 340px);
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  padding: 15px;
  background: linear-gradient(135deg, var(--color-bg-card), var(--color-bg-body));
  border-bottom: 2px solid var(--color-border);
}

.search-container :deep(.el-input__inner) {
  background: var(--color-bg-card) !important;
  border: 2px solid #64748b !important;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-main);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.search-container :deep(.el-input__inner:hover) {
  border-color: var(--color-primary) !important;
}

.search-container :deep(.el-input__inner:focus) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.12);
}

.search-container :deep(.el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
  font-weight: 500;
}

.search-container :deep(.el-input__prefix) {
  display: none;
}

.filter-popover {
  padding: 5px;
}

.filter-popover h4 {
  margin: 0 0 18px 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-item {
  margin-bottom: 18px;
}

.filter-item label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.filter-item :deep(.el-select .el-input__inner) {
  background: var(--color-bg-card) !important;
  border: 2px solid #64748b !important;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-main);
  transition: all 0.3s ease;
}

.filter-item :deep(.el-select .el-input__inner:hover) {
  border-color: var(--color-primary) !important;
}

.filter-item :deep(.el-select .el-input.is-focus .el-input__inner) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.12);
}

.filter-btn {
  font-size: 1.3rem;
  color: var(--color-text-muted);
  padding: 5px;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  color: var(--color-primary);
  transform: rotate(90deg);
}

.user-list {
  max-height: calc(100vh - 340px);
  overflow-y: auto;
  padding: 8px 0;
}

.user-item {
  padding: 16px;
  margin: 8px 12px;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-bg-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.user-item:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.12);
  transform: translateX(4px);
}

.user-item.active {
  background: var(--color-bg-hover);
  border: 2px solid var(--color-primary);
  box-shadow: 0 4px 16px rgba(30, 41, 59, 0.2);
}

.user-avatar {
  width: 48px;
  width: 40px;
  height: 40px;
  background-color: var(--color-bg-body);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: var(--color-text-muted);
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-info h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-info p {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin: 3px 0;
  font-weight: 500;
}

.user-details-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--color-border);
}

.user-details-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  flex-shrink: 0;
}

.user-details-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-details-info h2 {
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  color: var(--color-text-main);
  word-break: break-all;
}

.user-details-info p {
  color: var(--color-text-muted);
  margin: 4px 0;
  font-size: 0.95rem;
}

.user-actions {
  display: flex;
  gap: 10px;
}

.user-actions :deep(.action-btn-danger) {
  background-color: #ef4444 !important;
  border-color: #ef4444 !important;
  color: #fff !important;
  min-width: 122px;
  font-weight: 700;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.user-actions :deep(.action-btn-danger:hover),
.user-actions :deep(.action-btn-danger:focus) {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
}

.btn-icon {
  font-size: 1rem;
  line-height: 1;
}

:deep(.security-question-popper) {
  background-color: var(--color-bg-card) !important;
  border: 1px solid var(--color-border) !important;
}

:deep(.security-question-popper .el-select-dropdown__item) {
  color: var(--color-text-main) !important;
  background-color: transparent !important;
}

:deep(.security-question-popper .el-select-dropdown__item.hover),
:deep(.security-question-popper .el-select-dropdown__item:hover) {
  background-color: var(--color-bg-hover) !important;
  color: var(--color-text-main) !important;
}

:deep(.security-question-popper .el-select-dropdown__item.selected) {
  color: var(--color-primary) !important;
  font-weight: 700;
}

:deep(.security-question-popper .el-select-dropdown__empty) {
  color: var(--color-text-muted) !important;
}

[data-theme='dark'] :deep(.security-question-popper),
html.dark :deep(.security-question-popper) {
  background-color: #0f1b34 !important;
  border-color: #30415f !important;
}

[data-theme='dark'] :deep(.security-question-popper .el-select-dropdown__item),
html.dark :deep(.security-question-popper .el-select-dropdown__item) {
  color: #e2e8f0 !important;
}

[data-theme='dark'] :deep(.security-question-popper .el-select-dropdown__item.hover),
[data-theme='dark'] :deep(.security-question-popper .el-select-dropdown__item:hover),
html.dark :deep(.security-question-popper .el-select-dropdown__item.hover),
html.dark :deep(.security-question-popper .el-select-dropdown__item:hover) {
  background-color: #1e2f4d !important;
  color: #f8fafc !important;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
  padding: 20px 0;
}

.form-item label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.form-item p {
  margin: 0;
  font-weight: 500;
  color: var(--color-text-main);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-border);
}

:deep(.el-button--primary) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

:deep(.el-button--primary:hover),
:deep(.el-button--primary:focus) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  /* Lista de usuarios más grande y cómoda */
  .sidebar :deep(.el-card) {
    min-height: 70vh;
  }

  .user-list {
    max-height: calc(100vh - 200px);
    min-height: 50vh;
    padding: 5px 0;
  }

  .user-item {
    padding: 18px 16px;
    margin: 10px 8px;
    gap: 16px;
    border-radius: 14px;
  }

  .user-avatar {
    width: 56px;
    height: 56px;
    min-width: 56px;
    min-height: 56px;
    border-radius: 14px;
    font-size: 26px;
  }

  .user-info h3 {
    font-size: 1.05rem;
    margin-bottom: 8px;
    white-space: normal;
    overflow: visible;
    line-height: 1.3;
  }

  .user-info p {
    font-size: 0.9rem;
    margin: 5px 0;
  }

  .user-info .el-tag {
    margin-top: 6px;
    font-size: 0.8rem;
    padding: 4px 10px;
  }

  .linked-member {
    font-size: 0.85rem !important;
  }
}

/* Sidebar más amplio */
.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-add-btn {
  background: var(--color-bg-hover);
  color: var(--color-primary);
  border: 1px solid rgba(255, 255, 255, 0.28);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 10px rgba(0,0,0,0.15);
  }
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
  margin: -18px -20px;
  border-radius: 12px 12px 0 0;
}

.sidebar-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.filter-toggle-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  font-size: 1.1rem;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.filter-toggle-btn:hover {
  background: rgba(255,255,255,0.3);
}
</style>
