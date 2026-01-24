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
                <h4>Filtro por Estatus</h4>
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
              placeholder="Buscar por email..."
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
                :type="currentUsuario.estatus === 'ACTIVO' ? 'warning' : 'success'"
                :icon="currentUsuario.estatus === 'ACTIVO' ? 'el-icon-close' : 'el-icon-check'"
                @click="toggleEstatus"
              >
                {{ currentUsuario.estatus === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
              </el-button>
              <el-button type="primary" icon="el-icon-edit" @click="handleEdit">Editar</el-button>
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
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="usuarioForm" :model="usuarioForm" :rules="usuarioRules" label-position="top">
        <el-form-item label="Email" prop="email">
          <el-input v-model="usuarioForm.email" placeholder="correo@ejemplo.com" />
        </el-form-item>
        <el-form-item label="Contraseña" prop="password">
          <el-input
            v-model="usuarioForm.password"
            type="password"
            :placeholder="isEditing ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'"
            show-password
          />
        </el-form-item>
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
        <el-form-item v-if="isEditing" label="Estatus">
          <el-select v-model="usuarioForm.estatus" placeholder="Seleccionar estatus" style="width: 100%">
            <el-option label="ACTIVO" value="ACTIVO" />
            <el-option label="INACTIVO" value="INACTIVO" />
          </el-select>
        </el-form-item>
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
import { getUsuarios, getUsuarioById, createUsuario, updateUsuario } from '@/api/usuarios'
import { getRoles } from '@/api/roles'

export default {
  name: 'UsuariosSistema',
  data() {
    const validatePassword = (rule, value, callback) => {
      if (!this.isEditing && !value) {
        callback(new Error('La contraseña es requerida'))
      } else if (value && value.length < 6) {
        callback(new Error('Mínimo 6 caracteres'))
      } else {
        callback()
      }
    }
    return {
      usuarios: [],
      roles: [],
      currentUsuarioId: null,
      currentUsuario: {},
      loading: false,
      searchQuery: '',
      filterEstatus: 'ACTIVO',
      filterRol: '',
      filterSort: 'reciente',
      showUsuarioModal: false,
      isEditing: false,
      usuarioForm: {
        email: '',
        password: '',
        rol: null,
        estatus: 'ACTIVO'
      },
      usuarioRules: {
        email: [
          { required: true, message: 'El email es requerido', trigger: 'blur' },
          { type: 'email', message: 'Ingrese un email válido', trigger: 'blur' }
        ],
        password: [{ required: true, trigger: 'blur', validator: validatePassword }],
        rol: [{ required: true, message: 'El rol es requerido', trigger: 'change' }]
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
    async loadData() {
      await Promise.all([
        this.loadUsuarios(),
        this.loadRoles()
      ])
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
      if (isEdit && this.currentUsuario) {
        this.usuarioForm = {
          email: this.currentUsuario.email,
          password: '',
          rol: this.currentUsuario.rol,
          estatus: this.currentUsuario.estatus
        }
      } else {
        this.resetForm()
      }

      this.showUsuarioModal = true
      // Refrescar roles para asegurar que aparezcan los recién creados
      await this.loadRoles()
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
              estatus: this.usuarioForm.estatus
            }
            if (this.usuarioForm.password) {
              dataToUpdate.password = this.usuarioForm.password
            }
            await updateUsuario(this.currentUsuarioId, dataToUpdate)
            this.$message.success('Usuario actualizado exitosamente')
          } else {
            await createUsuario(this.usuarioForm)
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
      const newEstatus = this.currentUsuario.estatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
      const action = newEstatus === 'ACTIVO' ? 'activar' : 'desactivar'

      try {
        await this.$confirm(`¿Está seguro de ${action} este usuario?`, 'Confirmar', {
          confirmButtonText: 'Sí',
          cancelButtonText: 'No',
          type: 'warning'
        })

        await updateUsuario(this.currentUsuarioId, { estatus: newEstatus })
        this.$message.success(`Usuario ${newEstatus === 'ACTIVO' ? 'activado' : 'desactivado'} exitosamente`)
        await this.loadUsuarios()
        await this.selectUsuario(this.currentUsuarioId)
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error cambiando estatus:', error)
          this.$message.error('Error al cambiar estatus')
        }
      }
    },
    resetForm() {
      this.usuarioForm = {
        email: '',
        password: '',
        rol: null,
        estatus: 'ACTIVO'
      }
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
  padding: 10px 15px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.filter-popover h4 {
  margin: 0 0 15px 0;
  font-size: 0.9rem;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.filter-item {
  margin-bottom: 15px;
}

.filter-btn {
  font-size: 1.2rem;
  color: #64748b;
  padding: 0;
}

.filter-btn:hover {
  color: #E51D22;
}

.user-item {
  padding: 15px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-item:hover {
  background-color: #f5f7fa;
}

.user-item.active {
  background-color: #fee;
  border-left: 4px solid #E51D22;
}

.user-avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: #E51D22;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-info h3 {
  font-size: 0.85rem;
  margin: 0 0 4px 0;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-info p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 2px 0;
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
</style>
