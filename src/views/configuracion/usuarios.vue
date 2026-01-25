<template>
  <div class="usuarios-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-user" /> Gestión de Usuarios</h1>
          <p class="subtitle">Club Atlético Deportivo Acarigua</p>
        </div>
        <el-button type="primary" icon="el-icon-plus" @click="openUsuarioModal(false)">
          Agregar Usuario
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sidebar con lista de usuarios -->
      <aside class="sidebar">
        <el-card shadow="hover">
          <div slot="header" class="sidebar-header">
            <span><i class="el-icon-user" /> Lista de Usuarios</span>
            <el-popover
              placement="bottom-end"
              width="200"
              trigger="click"
            >
              <div class="filter-popover">
                <h4>Filtros Avanzados</h4>
                <div class="filter-item">
                  <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#606266">Estatus</label>
                  <el-select v-model="filterEstatus" placeholder="Todos" clearable size="small" style="width: 100%">
                    <el-option label="Activos" value="ACTIVO" />
                    <el-option label="Inactivos" value="INACTIVO" />
                    <el-option label="Todos" value="TODOS" />
                  </el-select>
                </div>
                <div class="filter-item">
                  <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#606266">Rol</label>
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
                  <label style="display:block;margin-bottom:5px;font-size:0.85rem;color:#606266">Ordenar por</label>
                  <el-select v-model="filterSort" placeholder="Seleccionar" size="small" style="width: 100%">
                    <el-option label="Más Recientes" value="reciente" />
                    <el-option label="Más Antiguos" value="antiguo" />
                    <el-option label="Alfabético A-Z" value="az" />
                    <el-option label="Alfabético Z-A" value="za" />
                  </el-select>
                </div>
              </div>
              <el-button slot="reference" type="text" icon="el-icon-s-operation" class="filter-btn" />
            </el-popover>
          </div>
          <div class="search-container">
            <el-input
              v-model="searchQuery"
              placeholder="Buscar..."
              prefix-icon="el-icon-search"
              size="small"
              clearable
            />
          </div>
          <div class="user-list">
            <div
              v-for="usuario in filteredUsuarios"
              :key="usuario.usuario_id"
              class="user-item"
              :class="{ active: currentUsuarioId === usuario.usuario_id }"
              @click="selectUsuario(usuario.usuario_id)"
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
                :type="currentUsuario.estatus === 'ACTIVO' || currentUsuario.estatus === 'Activo' ? 'warning' : 'success'"
                :icon="currentUsuario.estatus === 'ACTIVO' || currentUsuario.estatus === 'Activo' ? 'el-icon-close' : 'el-icon-check'"
                @click="toggleEstatus"
              >
                {{ currentUsuario.estatus === 'ACTIVO' || currentUsuario.estatus === 'Activo' ? 'Desactivar' : 'Activar' }}
              </el-button>
              <el-button type="primary" icon="el-icon-edit" @click="handleEdit">Editar</el-button>
              <el-button type="danger" icon="el-icon-delete" @click="handleDeleteUsuario">Eliminar</el-button>
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
      :visible.sync="showUsuarioModal"
      width="700px"
      :close-on-click-modal="false"
      custom-class="usuario-modal"
    >
      <el-form ref="usuarioForm" :model="usuarioForm" :rules="usuarioRules" label-position="top">
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
            <el-select v-model="usuarioForm.pregunta_1" placeholder="Selecciona una pregunta" style="width: 100%">
              <el-option
                v-for="pregunta in preguntasDisponibles"
                :key="pregunta"
                :label="pregunta"
                :value="pregunta"
                :disabled="pregunta === usuarioForm.pregunta_2"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="Respuesta 1" prop="respuesta_1">
            <el-input v-model="usuarioForm.respuesta_1" placeholder="Tu respuesta" />
          </el-form-item>

          <el-form-item label="Pregunta 2" prop="pregunta_2">
            <el-select v-model="usuarioForm.pregunta_2" placeholder="Selecciona una pregunta" style="width: 100%">
              <el-option
                v-for="pregunta in preguntasDisponibles"
                :key="pregunta"
                :label="pregunta"
                :value="pregunta"
                :disabled="pregunta === usuarioForm.pregunta_1"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="Respuesta 2" prop="respuesta_2">
            <el-input v-model="usuarioForm.respuesta_2" placeholder="Tu respuesta" />
          </el-form-item>
        </div>
      </el-form>
      <span slot="footer">
        <el-button @click="showUsuarioModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="loading" @click="saveUsuario">
          {{ isEditing ? 'Actualizar' : 'Guardar' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getUsuarios, getUsuarioById, createUsuario, updateUsuario, deleteUsuario } from '@/api/usuarios'

import { getRoles } from '@/api/roles'
import { getPlantel } from '@/api/plantel'
import { getPreguntasDisponibles, guardarPreguntas, obtenerPreguntasRespuestasUsuario } from '@/api/preguntasSeguridad'

export default {
  name: 'UsuariosSistema',
  data() {
    const validatePassword = (rule, value, callback) => {
      if (!this.isEditing && !value) {
        callback(new Error('La contraseña es requerida'))
      } else if (value && !this.isPasswordValid) {
        callback(new Error('La contraseña no cumple todos los requisitos'))
      } else {
        callback()
      }
    }
    return {
      usuarios: [],
      roles: [],
      plantelList: [],
      currentUsuarioId: null,
      currentUsuario: {},
      loading: false,
      searchQuery: '',
      filterEstatus: 'Activo',
      filterRol: '',
      filterSort: 'reciente',
      showUsuarioModal: false,
      isEditing: false,
      emailSuggestion: '',
      passwordChecks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      },
      preguntasDisponibles: [],
      usuarioForm: {
        email: '',
        password: '',
        rol: null,
        estatus: 'Activo',
        plantel_id: null,
        pregunta_1: '',
        respuesta_1: '',
        pregunta_2: '',
        respuesta_2: ''
      },
      usuarioRules: {
        email: [
          { required: true, message: 'El email es requerido', trigger: 'blur' },
          { type: 'email', message: 'Ingrese un email válido', trigger: 'blur' }
        ],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }],
        rol: [{ required: true, message: 'El rol es requerido', trigger: 'change' }],
        pregunta_1: [{ required: true, message: 'Selecciona una pregunta', trigger: 'change' }],
        respuesta_1: [{ required: true, message: 'Ingresa tu respuesta', trigger: 'blur' }],
        pregunta_2: [{ required: true, message: 'Selecciona una pregunta', trigger: 'change' }],
        respuesta_2: [{ required: true, message: 'Ingresa tu respuesta', trigger: 'blur' }]
      }
    }
  },
  computed: {
    filteredUsuarios() {
      let filtered = this.usuarios
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(u => u.email.toLowerCase().includes(query))
      }
      return filtered
    },
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
  watch: {
    filterEstatus() {
      this.loadUsuarios()
    },
    filterRol() {
      this.loadUsuarios()
    },
    filterSort() {
      this.loadUsuarios()
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    checkPasswordStrength() {
      const password = this.usuarioForm.password || ''
      this.passwordChecks = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      }
    },
    checkEmailTypo() {
      const email = this.usuarioForm.email || ''
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
        this.emailSuggestion = email.split('@')[0] + '@' + typoMap[domain]
      } else {
        this.emailSuggestion = ''
      }
    },
    applyEmailSuggestion() {
      if (this.emailSuggestion) {
        this.usuarioForm.email = this.emailSuggestion
        this.emailSuggestion = ''
      }
    },
    async loadData() {
      await Promise.all([
        this.loadUsuarios(),
        this.loadRoles(),
        this.loadPlantel(),
        this.loadPreguntasDisponibles()
      ])
    },
    async loadPlantel() {
      try {
        const response = await getPlantel()
        this.plantelList = response.data || response || []
      } catch (error) {
        console.error('Error cargando plantel:', error)
      }
    },
    async loadPreguntasDisponibles() {
      try {
        const response = await getPreguntasDisponibles()
        // publicService devuelve la respuesta cruda de axios, así que accedemos a .data
        const data = response.data || response
        this.preguntasDisponibles = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Error cargando preguntas:', error)
      }
    },
    async loadUsuarios() {
      try {
        const params = {}
        if (this.filterEstatus) {
          params.estatus = this.filterEstatus
        }
        if (this.filterRol) {
          params.rol = this.filterRol
        }
        params.sort = this.filterSort

        const response = await getUsuarios(params)
        this.usuarios = Array.isArray(response) ? response : []

        // Validar si el usuario seleccionado sigue en la lista
        if (this.currentUsuarioId) {
          const exists = this.usuarios.find(u => u.usuario_id === this.currentUsuarioId)
          if (!exists) {
            this.currentUsuarioId = null
            this.currentUsuario = {}
          }
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error)
        this.$message.error('Error al cargar usuarios')
      }
    },
    async loadRoles() {
      try {
        const response = await getRoles()
        this.roles = Array.isArray(response) ? response : []
      } catch (error) {
        console.error('Error cargando roles:', error)
      }
    },
    async selectUsuario(id) {
      this.currentUsuarioId = id
      try {
        const response = await getUsuarioById(id)
        this.currentUsuario = response
      } catch (error) {
        console.error('Error cargando usuario:', error)
        this.$message.error('Error al cargar datos del usuario')
      }
    },
    async openUsuarioModal(isEdit) {
      this.isEditing = isEdit
      if (!isEdit) {
        this.resetForm()
      } else {
        if (!this.currentUsuarioId) return

        // Cargar datos básicos del usuario
        this.usuarioForm = {
          email: this.currentUsuario.email,
          password: '',
          rol: this.currentUsuario.rol,
          estatus: this.currentUsuario.estatus,
          plantel_id: this.currentUsuario.plantel_id || null,
          // Inicializar preguntas vacías, se cargarán desde la API
          pregunta_1: '',
          respuesta_1: '',
          pregunta_2: '',
          respuesta_2: ''
        }

        // Cargar preguntas de seguridad del usuario
        try {
          const res = await obtenerPreguntasRespuestasUsuario(this.currentUsuarioId)
          if (res && res.tiene_preguntas) {
            this.usuarioForm.pregunta_1 = res.pregunta_1
            this.usuarioForm.respuesta_1 = res.respuesta_1
            this.usuarioForm.pregunta_2 = res.pregunta_2
            this.usuarioForm.respuesta_2 = res.respuesta_2
          }
        } catch (error) {
          console.error('Error al cargar preguntas:', error)
        }
      }

      this.showUsuarioModal = true
      // Refrescar roles y plantel para asegurar datos frescos
      await Promise.all([
        this.loadRoles(),
        this.loadPlantel()
      ])
    },
    handleEdit() {
      this.openUsuarioModal(true)
    },
    async saveUsuario() {
      this.$refs.usuarioForm.validate(async(valid) => {
        if (!valid) return

        this.loading = true
        try {
          if (this.isEditing) {
            const dataToUpdate = {
              email: this.usuarioForm.email,
              rol: this.usuarioForm.rol,
              estatus: this.usuarioForm.estatus,
              plantel_id: this.usuarioForm.plantel_id
            }
            if (this.usuarioForm.password) {
              dataToUpdate.password = this.usuarioForm.password
            }
            await updateUsuario(this.currentUsuarioId, dataToUpdate)

            // Actualizar preguntas de seguridad si se llenaron
            if (this.usuarioForm.pregunta_1 && this.usuarioForm.respuesta_1 &&
                this.usuarioForm.pregunta_2 && this.usuarioForm.respuesta_2) {
              await guardarPreguntas({
                usuario_id: this.currentUsuarioId,
                pregunta_1: this.usuarioForm.pregunta_1,
                respuesta_1: this.usuarioForm.respuesta_1,
                pregunta_2: this.usuarioForm.pregunta_2,
                respuesta_2: this.usuarioForm.respuesta_2
              })
            }

            this.$message.success('Usuario actualizado exitosamente')
          } else {
            // Crear usuario
            const createResponse = await createUsuario({
              email: this.usuarioForm.email,
              password: this.usuarioForm.password,
              rol: this.usuarioForm.rol,
              plantel_id: this.usuarioForm.plantel_id
            })

            // Guardar preguntas de seguridad
            const nuevoUsuarioId = createResponse.usuario_id
            if (nuevoUsuarioId) {
              await guardarPreguntas({
                usuario_id: nuevoUsuarioId,
                pregunta_1: this.usuarioForm.pregunta_1,
                respuesta_1: this.usuarioForm.respuesta_1,
                pregunta_2: this.usuarioForm.pregunta_2,
                respuesta_2: this.usuarioForm.respuesta_2
              })
            }

            this.$message.success('Usuario creado exitosamente')
          }

          this.showUsuarioModal = false
          await this.loadUsuarios()
          if (this.isEditing) {
            await this.selectUsuario(this.currentUsuarioId)
          }
        } catch (error) {
          console.error('Error guardando usuario:', error)
          this.$message.error(error.response?.data?.error || 'Error al guardar usuario')
        } finally {
          this.loading = false
        }
      })
    },
    async toggleEstatus() {
      const newEstatus = this.currentUsuario.estatus === 'Activo' ? 'Inactivo' : 'Activo'
      const action = newEstatus === 'Activo' ? 'activar' : 'desactivar'

      try {
        await this.$confirm(`¿Está seguro de ${action} este usuario?`, 'Confirmar', {
          confirmButtonText: 'Sí',
          cancelButtonText: 'No',
          type: 'warning'
        })

        await updateUsuario(this.currentUsuarioId, { estatus: newEstatus })
        this.$message.success(`Usuario ${newEstatus === 'Activo' ? 'activado' : 'desactivado'} exitosamente`)
        await this.loadUsuarios()

        // Solo intentar seleccionar si el usuario sigue visible en la lista
        if (this.currentUsuarioId) {
          await this.selectUsuario(this.currentUsuarioId)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error cambiando estatus:', error)
          this.$message.error('Error al cambiar estatus')
        }
      }
    },
    async handleDeleteUsuario() {
      if (!this.currentUsuario) return

      try {
        await this.$confirm(
          `¿Está seguro de eliminar permanentemente al usuario "${this.currentUsuario.email}"? Esta acción no se puede deshacer.`,
          'Confirmar Eliminación',
          {
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            type: 'warning'
          }
        )

        await deleteUsuario(this.currentUsuarioId)
        this.$message.success('Usuario eliminado exitosamente')
        this.currentUsuarioId = null
        this.currentUsuario = {}
        await this.loadUsuarios()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error eliminando usuario:', error)
          this.$message.error(error.response?.data?.error || 'Error al eliminar usuario')
        }
      }
    },
    resetForm() {
      this.usuarioForm = {
        email: '',
        password: '',
        rol: null,
        estatus: 'Activo',
        plantel_id: null,
        pregunta_1: '',
        respuesta_1: '',
        pregunta_2: '',
        respuesta_2: ''
      }
      this.passwordChecks = {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      }
      this.emailSuggestion = ''
    },
    formatDate(dateString) {
      if (!dateString) return 'Nunca'
      const date = new Date(dateString)
      return date.toLocaleString('es-ES')
    }
  }
}
</script>

<style scoped>
.usuarios-container {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #E51D22, #c41a1d);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(229, 29, 34, 0.2);
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
.header-content ::v-deep > .el-button--primary {
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

.header-content ::v-deep > .el-button--primary:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.header-content ::v-deep > .el-button--primary:active {
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

.sidebar ::v-deep .el-card__body {
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
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 2px solid #e2e8f0;
}

.search-container ::v-deep .el-input__inner {
  background: #fff !important;
  border: 2px solid #64748b !important;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.search-container ::v-deep .el-input__inner:hover {
  border-color: #E51D22 !important;
}

.search-container ::v-deep .el-input__inner:focus {
  border-color: #E51D22 !important;
  box-shadow: 0 0 0 3px rgba(229, 29, 34, 0.12);
}

.search-container ::v-deep .el-input__inner::placeholder {
  color: #64748b !important;
  font-weight: 500;
}

.search-container ::v-deep .el-input__prefix {
  display: none;
}

.filter-popover {
  padding: 5px;
}

.filter-popover h4 {
  margin: 0 0 18px 0;
  font-size: 1rem;
  font-weight: 700;
  color: #E51D22;
  border-bottom: 2px solid #E51D22;
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
  color: #1e293b;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.filter-item ::v-deep .el-select .el-input__inner {
  background: #fff !important;
  border: 2px solid #64748b !important;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  transition: all 0.3s ease;
}

.filter-item ::v-deep .el-select .el-input__inner:hover {
  border-color: #E51D22 !important;
}

.filter-item ::v-deep .el-select .el-input.is-focus .el-input__inner {
  border-color: #E51D22 !important;
  box-shadow: 0 0 0 3px rgba(229, 29, 34, 0.12);
}

.filter-btn {
  font-size: 1.3rem;
  color: #64748b;
  padding: 5px;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  color: #E51D22;
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
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.user-item:hover {
  border-color: #E51D22;
  background: linear-gradient(135deg, #fff5f5, #fff);
  box-shadow: 0 4px 12px rgba(229, 29, 34, 0.12);
  transform: translateX(4px);
}

.user-item.active {
  background: linear-gradient(135deg, #fee2e2, #fff);
  border: 2px solid #E51D22;
  box-shadow: 0 4px 16px rgba(229, 29, 34, 0.2);
}

.user-avatar {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #E51D22, #c41a1d);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 3px 8px rgba(229, 29, 34, 0.3);
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
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-info p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 3px 0;
  font-weight: 500;
}

.user-details-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.user-details-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #E51D22;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  flex-shrink: 0;
}

.user-details-info {
  flex: 1;
}

.user-details-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-details-info h2 {
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  color: #2c3e50;
  word-break: break-all;
}

.user-details-info p {
  color: #64748b;
  margin: 4px 0;
  font-size: 0.95rem;
}

.user-actions {
  display: flex;
  gap: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
  padding: 20px 0;
}

.form-item label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.form-item p {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

::v-deep .el-button--primary {
  background-color: #E51D22;
  border-color: #E51D22;
}

::v-deep .el-button--primary:hover,
::v-deep .el-button--primary:focus {
  background-color: #c41a1d;
  border-color: #c41a1d;
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
  .user-details-header {
    flex-direction: column;
    text-align: center;
  }

  .user-actions {
    flex-direction: column;
    width: 100%;
  }
}

/* Password Checklist Styles */
.password-checklist {
  margin-top: 10px;
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
  font-size: 0.85rem;
  color: #94a3b8;
  padding: 4px 0;
  transition: color 0.2s;
}

.checklist-item i {
  font-size: 0.9rem;
}

.checklist-item.valid {
  color: #22c55e;
}

.checklist-item.valid i {
  color: #22c55e;
}

/* Strength Bar */
.strength-bar {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.strength-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 6px;
}

.strength-track {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s, background 0.3s;
}

.strength-fill.strength-weak {
  background: #ef4444;
}

.strength-fill.strength-medium {
  background: #f59e0b;
}

.strength-fill.strength-strong {
  background: #22c55e;
}

.strength-weak {
  color: #ef4444;
  font-weight: 600;
}

.strength-medium {
  color: #f59e0b;
  font-weight: 600;
}

.strength-strong {
  color: #22c55e;
  font-weight: 600;
}

/* Email Suggestion */
.email-suggestion {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.email-suggestion strong {
  color: #1d4ed8;
  cursor: pointer;
  text-decoration: underline;
}

.email-suggestion strong:hover {
  color: #1e40af;
}

/* Security Questions Section */
.security-questions-section {
  margin-top: 10px;
}

.security-questions-section .el-divider {
  margin: 15px 0;
}

.security-questions-section .el-divider__text {
  color: #E51D22;
  font-weight: 600;
}

.security-hint {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 15px 0;
  background: #f8fafc;
  padding: 10px;
  border-radius: 6px;
  border-left: 3px solid #E51D22;
}
</style>
