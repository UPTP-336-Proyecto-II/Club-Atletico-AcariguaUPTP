<template>
  <div class="plantel-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-s-custom" /> Gestión del Plantel</h1>
          <p class="subtitle">Club Atlético Deportivo Acarigua</p>
        </div>
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
          Nuevo Miembro
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sidebar con lista de miembros -->
      <aside class="sidebar">
        <el-card shadow="hover">
          <div slot="header" class="sidebar-header">
            <span><i class="el-icon-user" /> Lista del Plantel</span>
            <el-popover
              placement="bottom-end"
              width="250"
              trigger="click"
            >
              <div class="filter-popover">
                <h4>Filtros Avanzados</h4>
                <div class="filter-item">
                  <label>Rol</label>
                  <el-select
                    v-model="filterRol"
                    placeholder="Filtrar por Rol"
                    clearable
                    size="small"
                    style="width: 100%"
                    @change="fetchPlantel"
                  >
                    <el-option
                      v-for="rol in rolesOptions"
                      :key="rol.value"
                      :label="rol.label"
                      :value="rol.value"
                    />
                  </el-select>
                </div>
                <div class="filter-item">
                  <label>Ordenar por</label>
                  <el-select v-model="filterSort" placeholder="Seleccionar" size="small" style="width: 100%" @change="fetchPlantel">
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
              placeholder="Buscar por nombre..."
              size="small"
              clearable
            />
          </div>
          <div class="member-list">
            <div
              v-for="miembro in filteredPlantel"
              :key="miembro.plantel_id"
              class="member-item"
              :class="{ active: currentMemberId === miembro.plantel_id }"
              @click="selectMember(miembro)"
            >
              <div class="member-photo">
                <i class="el-icon-user" />
              </div>
              <div class="member-info">
                <h3>{{ miembro.nombre }} {{ miembro.apellido }}</h3>
                <p>{{ miembro.nombre_rol }}</p>
                <p><i class="el-icon-phone-outline" /> {{ miembro.telefono || 'Sin teléfono' }}</p>
              </div>
            </div>
            <div v-if="filteredPlantel.length === 0" class="empty-state-list">
              <p>No se encontraron miembros</p>
            </div>
          </div>
        </el-card>
      </aside>

      <!-- Área de contenido -->
      <main class="content-area">
        <el-card v-if="!currentMemberId" shadow="hover">
          <div class="empty-state">
            <i class="el-icon-s-custom" style="font-size: 4rem; color: #ddd;" />
            <h3>No hay miembro seleccionado</h3>
            <p>Selecciona un miembro de la lista o agrega uno nuevo.</p>
          </div>
        </el-card>

        <el-card v-else shadow="hover">
          <!-- Encabezado del miembro -->
          <div class="member-details-header">
            <div class="member-details-photo">
              <i class="el-icon-user" />
            </div>
            <div class="member-details-info">
              <h2>{{ currentMember.nombre }} {{ currentMember.apellido }}</h2>
              <el-tag :type="getRolTagType(currentMember.nombre_rol)">{{ currentMember.nombre_rol }}</el-tag>
              <p style="margin-top: 10px"><i class="el-icon-phone" /> {{ currentMember.telefono || 'No especificado' }}</p>
            </div>
            <div class="member-actions">
              <el-button type="danger" icon="el-icon-delete" @click="handleDelete(currentMember)">Eliminar</el-button>
              <el-button type="primary" icon="el-icon-edit" @click="handleEdit(currentMember)">Editar</el-button>
            </div>
          </div>

          <!-- Tabs -->
          <el-tabs v-model="activeTab" type="border-card" style="margin-top: 20px;">
            <!-- Tab 1: Datos Personales (Por ahora la única) -->
            <el-tab-pane label="Datos Generales" name="general">
              <div class="form-grid">
                <div class="form-item">
                  <label>Nombre</label>
                  <p>{{ currentMember.nombre }}</p>
                </div>
                <div class="form-item">
                  <label>Apellido</label>
                  <p>{{ currentMember.apellido }}</p>
                </div>
                <div class="form-item">
                  <label>Rol</label>
                  <p>{{ currentMember.nombre_rol }}</p>
                </div>
                <div class="form-item">
                  <label>Cédula</label>
                  <p>{{ currentMember.cedula || 'No especificada' }}</p>
                </div>
                <div class="form-item">
                  <label>Fecha de Nacimiento</label>
                  <p>
                    {{ currentMember.fecha_nac ? new Date(currentMember.fecha_nac).toLocaleDateString() : 'No especificada' }}
                    <span v-if="currentMember.fecha_nac" style="color: #64748b; font-size: 0.9em">
                      ({{ calculateAge(currentMember.fecha_nac) }} años)
                    </span>
                  </p>
                </div>
                <div class="form-item">
                  <label>Dirección</label>
                  <p>{{ currentMember.dirreccion || 'No especificada' }}</p>
                </div>
                <div class="form-item">
                  <label>Teléfono</label>
                  <p>{{ currentMember.telefono || 'No especificado' }}</p>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </main>
    </div>

    <!-- Dialog Crear/Editar -->
    <el-dialog
      :title="isEdit ? 'Editar Miembro' : 'Nuevo Miembro'"
      :visible.sync="dialogVisible"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="plantelForm"
        :model="formData"
        :rules="formRules"
        label-width="90px"
        label-position="top"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Nombre" prop="nombre">
              <el-input
                v-model="formData.nombre"
                placeholder="Ingrese nombre"
                @input="v => formData.nombre = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Apellido" prop="apellido">
              <el-input
                v-model="formData.apellido"
                placeholder="Ingrese apellido"
                @input="v => formData.apellido = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Cédula" prop="cedula">
              <el-input
                v-model="formData.cedula"
                placeholder="Ingrese cédula"
                maxlength="9"
                @input="v => formData.cedula = v.replace(/[^0-9]/g, '')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Fecha de Nacimiento" prop="fecha_nac">
              <el-date-picker
                v-model="formData.fecha_nac"
                type="date"
                placeholder="Seleccione fecha"
                style="width: 100%"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="País">
              <el-select v-model="formData.direccion.pais" placeholder="Seleccionar" style="width: 100%">
                <el-option label="Venezuela" value="Venezuela" />
                <el-option label="Colombia" value="Colombia" />
                <el-option label="Otro" value="Otro" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Estado">
              <el-input v-model="formData.direccion.estado" placeholder="Estado" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Municipio">
              <el-input v-model="formData.direccion.municipio" placeholder="Municipio" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Parroquia">
              <el-input v-model="formData.direccion.parroquia" placeholder="Parroquia" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="Descripción de la Dirección">
              <el-input v-model="formData.direccion.descripcion_descriptiva" placeholder="Calle, casa, edificio, referencias..." type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Teléfono" prop="telefono">
              <el-input
                v-model="formData.telefono"
                placeholder="04121234567"
                maxlength="11"
                @input="filterOnlyNumbers"
              >
                <i slot="prefix" class="el-icon-phone" />
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Rol" prop="rol">
              <el-select v-model="formData.rol" placeholder="Seleccione rol" style="width: 100%">
                <el-option
                  v-for="rol in rolesOptions"
                  :key="rol.value"
                  :label="rol.label"
                  :value="rol.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancelar</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? 'Actualizar' : 'Crear' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getPlantel, createPlantel, updatePlantel, deletePlantel } from '@/api/plantel'
import { getRoles } from '@/api/roles'

export default {
  name: 'PlantelIndex',
  data() {
    return {
      loading: false,
      submitting: false,
      plantelList: [],
      searchCedula: '',
      filterSinCedula: false,
      filterRol: '',
      filterSort: 'az',
      searchQuery: '',
      searchCedulaTimeout: null,
      dialogVisible: false,
      isEdit: false,
      currentMemberId: null,
      currentMember: {},
      activeTab: 'general',
      editingId: null,
      formData: {
        nombre: '',
        apellido: '',
        telefono: '',
        rol: '',
        cedula: '',
        fecha_nac: '',
        direccion: {
          pais: 'Venezuela',
          estado: '',
          municipio: '',
          parroquia: '',
          descripcion_descriptiva: ''
        }
      },
      formRules: {
        nombre: [
          { required: true, message: 'El nombre es obligatorio', trigger: 'blur' }
        ],
        apellido: [
          { required: true, message: 'El apellido es obligatorio', trigger: 'blur' }
        ],
        cedula: [
          { required: true, message: 'La cédula es obligatoria', trigger: 'blur' },
          { min: 7, message: 'Mínimo 7 dígitos', trigger: 'blur' }
        ],
        telefono: [
          { required: true, message: 'El teléfono es obligatorio', trigger: 'blur' },
          { pattern: /^[0-9]*$/, message: 'Solo se permiten números', trigger: 'blur' }
        ],
        rol: [
          { required: true, message: 'Seleccione un rol', trigger: 'change' }
        ]
      },
      rolesOptions: []
    }
  },
  computed: {
    filteredPlantel() {
      let filtered = this.plantelList
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(m =>
          m.nombre.toLowerCase().includes(query) ||
          m.apellido.toLowerCase().includes(query)
        )
      }
      return filtered
    }
  },
  watch: {
    searchCedula() {
      if (this.searchCedulaTimeout) clearTimeout(this.searchCedulaTimeout)
      this.searchCedulaTimeout = setTimeout(() => {
        this.fetchPlantel()
      }, 500)
    }
  },
  created() {
    this.loadRoles()
    this.fetchPlantel()
  },
  methods: {
    async loadRoles() {
      try {
        const response = await getRoles()
        this.rolesOptions = response.map(r => ({
          value: r.rol_id,
          label: r.nombre_rol
        }))
      } catch (error) {
        console.error('Error cargando roles:', error)
      }
    },
    filterOnlyNumbers() {
      // Remover cualquier carácter que no sea número
      this.formData.telefono = this.formData.telefono.replace(/[^0-9]/g, '')
    },
    async fetchPlantel() {
      this.loading = true
      try {
        const params = {}
        if (this.searchCedula) {
          params.cedula = this.searchCedula
        }
        if (this.filterSinCedula) {
          params.sin_cedula = 'true'
        }
        if (this.filterRol) {
          params.rol = this.filterRol
        }
        params.sort = this.filterSort
        const response = await getPlantel(params)
        this.plantelList = response.data || response || []

        // Si hay un miembro seleccionado, actualizar sus datos
        if (this.currentMemberId) {
          const found = this.plantelList.find(p => p.plantel_id === this.currentMemberId)
          if (found) {
            this.currentMember = found
          } else {
            this.currentMemberId = null
          }
        }
      } catch (error) {
        console.error('Error cargando plantel:', error)
        this.$message.error('Error al cargar el plantel')
      } finally {
        this.loading = false
      }
    },
    selectMember(member) {
      this.currentMemberId = member.plantel_id
      this.currentMember = member
    },
    getRolTagType(rolName) {
      if (!rolName) return ''
      const name = rolName.toUpperCase()
      if (name.includes('ENTRENADOR')) return 'success'
      if (name.includes('ASISTENTE')) return 'info'
      if (name.includes('MEDICO') || name.includes('MÉDICO')) return 'warning'
      if (name.includes('ADMINISTRATIVO') || name.includes('DIRECTIVO')) return 'danger'
      return ''
    },
    calculateAge(dateString) {
      if (!dateString) return 0
      const today = new Date()
      const birthDate = new Date(dateString)
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    },
    handleCreate() {
      this.isEdit = false
      this.editingId = null
      this.resetForm()
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.isEdit = true
      this.editingId = row.plantel_id
      this.formData = {
        nombre: row.nombre,
        apellido: row.apellido,
        telefono: row.telefono || '',
        rol: row.rol_id, // Usar ID para el select
        cedula: row.cedula ? String(row.cedula) : '',
        fecha_nac: row.fecha_nac ? row.fecha_nac.split('T')[0] : '', // Formato YYYY-MM-DD
        direccion: {
          pais: row.pais || 'Venezuela',
          estado: row.estado || '',
          municipio: row.municipio || '',
          parroquia: row.parroquia || '',
          descripcion_descriptiva: row.descripcion_descriptiva || ''
        }
      }
      this.dialogVisible = true
    },
    async handleSubmit() {
      try {
        await this.$refs.plantelForm.validate()
        this.submitting = true

        if (this.isEdit) {
          await updatePlantel(this.editingId, this.formData)
          this.$message.success('Miembro actualizado exitosamente')
        } else {
          await createPlantel(this.formData)
          this.$message.success('Miembro creado exitosamente')
        }

        this.dialogVisible = false
        await this.fetchPlantel()

        // Si estábamos editando, actualizar el miembro actual
        if (this.isEdit && this.currentMemberId === this.editingId) {
          const updated = this.plantelList.find(p => p.plantel_id === this.editingId)
          if (updated) this.currentMember = updated
        }
      } catch (error) {
        if (error !== false) {
          console.error('Error guardando miembro:', error)
          this.$message.error('Error al guardar el miembro')
        }
      } finally {
        this.submitting = false
      }
    },
    handleDelete(row) {
      this.$confirm(
        `¿Está seguro de eliminar a ${row.nombre} ${row.apellido}?`,
        'Confirmar eliminación',
        {
          confirmButtonText: 'Eliminar',
          cancelButtonText: 'Cancelar',
          type: 'warning'
        }
      ).then(async() => {
        try {
          await deletePlantel(row.plantel_id)
          this.$message.success('Miembro eliminado exitosamente')
          this.currentMemberId = null
          this.fetchPlantel()
        } catch (error) {
          console.error('Error eliminando miembro:', error)
          const errorMsg = error.response?.data?.error || 'Error al eliminar el miembro'
          this.$message.error(errorMsg)
        }
      }).catch(() => {})
    },
    resetForm() {
      this.formData = {
        nombre: '',
        apellido: '',
        telefono: '',
        rol: '',
        cedula: '',
        fecha_nac: '',
        direccion: {
          pais: 'Venezuela',
          estado: '',
          municipio: '',
          parroquia: '',
          descripcion_descriptiva: ''
        }
      }
      if (this.$refs.plantelForm) {
        this.$refs.plantelForm.resetFields()
      }
    }
  }
}
</script>

<style scoped>
.plantel-container {
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

/* Sidebar Styles */
.sidebar .el-card {
  height: calc(100vh - 200px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar ::v-deep .el-card__body {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  padding: 10px 14px 10px 36px;
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
  color: #64748b;
}

.member-list {
  overflow-y: auto;
  flex: 1;
  padding: 8px 0;
}

.member-item {
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

.member-item:hover {
  border-color: #E51D22;
  background: linear-gradient(135deg, #fff5f5, #fff);
  box-shadow: 0 4px 12px rgba(229, 29, 34, 0.12);
  transform: translateX(4px);
}

.member-item.active {
  background: linear-gradient(135deg, #fee2e2, #fff);
  border: 2px solid #E51D22;
  box-shadow: 0 4px 16px rgba(229, 29, 34, 0.2);
}

.member-photo {
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
  overflow: hidden;
  box-shadow: 0 3px 8px rgba(229, 29, 34, 0.3);
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-info h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #1e293b;
}

.member-info p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 3px 0;
  font-weight: 500;
}

.empty-state-list {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 0.9rem;
}

/* Content Area Styles */
.content-area {
  min-height: 500px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state h3 {
  margin-top: 20px;
  color: #303133;
}

/* Member Details Styles */
.member-details-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.member-details-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #E51D22;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.member-details-info {
  flex: 1;
}

.member-details-info h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.member-actions {
  display: flex;
  gap: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 10px;
}

.form-item label {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 5px;
  font-weight: 600;
}

.form-item p {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
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
  letter-spacing: 0.3px;
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

::v-deep .el-button--primary {
  background-color: #E51D22;
  border-color: #E51D22;
}

::v-deep .el-button--primary:hover,
::v-deep .el-button--primary:focus {
  background-color: #c41a1d;
  border-color: #c41a1d;
}

::v-deep .el-tabs__item.is-active {
  color: #E51D22;
}

::v-deep .el-tabs__active-bar {
  background-color: #E51D22;
}

::v-deep .el-tabs__item:hover {
  color: #E51D22;
}

/* ============================================
   RESPONSIVE STYLES
   ============================================ */

/* Tablets y laptops pequeños */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 280px 1fr;
    gap: 12px;
  }
}

/* Tablets */
@media (max-width: 992px) {
  .plantel-container {
    padding: 15px;
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .sidebar .el-card {
    height: auto;
    max-height: 350px;
  }

  .member-list {
    max-height: 200px;
  }

  .page-header {
    padding: 18px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .member-details-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .member-details-photo {
    margin: 0 auto;
  }

  .member-details-info {
    text-align: center;
  }

  .member-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
}

/* Móviles */
@media (max-width: 768px) {
  .plantel-container {
    padding: 10px;
  }

  .page-header {
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 8px;
  }

  .page-header h1 {
    font-size: 1.3rem;
  }

  .subtitle {
    font-size: 0.85rem;
  }

  .header-content ::v-deep > .el-button--primary {
    width: 100%;
    padding: 12px 20px;
  }

  .sidebar .el-card {
    max-height: 300px;
  }

  .sidebar ::v-deep .el-card__header {
    padding: 12px 15px;
  }

  .search-container {
    padding: 10px;
  }

  .member-list {
    max-height: 180px;
    padding: 5px 0;
  }

  .member-item {
    padding: 12px;
    margin: 6px 8px;
    gap: 10px;
  }

  .member-photo {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    font-size: 18px;
  }

  .member-info h3 {
    font-size: 0.85rem;
  }

  .member-info p {
    font-size: 0.75rem;
  }

  .content-area ::v-deep .el-card__body {
    padding: 15px;
  }

  .member-details-photo {
    width: 80px;
    height: 80px;
    font-size: 32px;
  }

  .member-details-info h2 {
    font-size: 1.2rem;
  }

  .member-actions {
    width: 100%;
    gap: 8px;
  }

  .member-actions .el-button {
    flex: 1;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 15px;
    padding: 5px;
  }

  /* Modal responsive */
  ::v-deep .el-dialog {
    width: 95% !important;
    max-width: 95vw !important;
    margin: 5vh auto !important;
  }

  ::v-deep .el-dialog__body {
    padding: 15px;
  }

  ::v-deep .el-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  ::v-deep .el-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  ::v-deep .el-col-12 {
    width: 100%;
    margin-bottom: 10px;
  }

  .empty-state {
    padding: 40px 15px;
  }

  .empty-state i {
    font-size: 3rem;
  }
}

/* Móviles pequeños */
@media (max-width: 480px) {
  .plantel-container {
    padding: 8px;
  }

  .page-header {
    padding: 12px;
  }

  .page-header h1 {
    font-size: 1.1rem;
  }

  .subtitle {
    font-size: 0.75rem;
  }

  .sidebar .el-card {
    max-height: 250px;
  }

  .member-list {
    max-height: 150px;
  }

  .member-item {
    padding: 10px;
    margin: 5px 6px;
  }

  .member-photo {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    font-size: 16px;
  }

  .member-info h3 {
    font-size: 0.8rem;
  }

  .member-details-photo {
    width: 70px;
    height: 70px;
    font-size: 28px;
  }

  .member-details-info h2 {
    font-size: 1.1rem;
  }

  .form-item label {
    font-size: 0.75rem;
  }

  .form-item p {
    font-size: 0.9rem;
  }

  ::v-deep .el-tabs__item {
    font-size: 12px;
    padding: 0 12px;
  }
}

/* Móviles muy pequeños */
@media (max-width: 320px) {
  .plantel-container {
    padding: 5px;
  }

  .page-header {
    padding: 10px;
  }

  .page-header h1 {
    font-size: 0.95rem;
  }

  .member-photo {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    font-size: 14px;
  }

  .member-details-photo {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
}
</style>
