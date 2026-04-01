<template>
  <div class="plantel-container">
    <!-- Header -->
    <div class="premium-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-s-custom" /> Gestión del Plantel</h1>
          <p class="subtitle">Club Atlético Deportivo Acarigua</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Sidebar con lista de miembros -->
      <aside class="sidebar premium-sidebar">
        <el-card shadow="hover">
          <template #header>
            <div class="sidebar-header">
              <span class="sidebar-title">
                <el-icon><Collection /></el-icon>
                <span>Lista del Plantel</span>
              </span>
              <div class="sidebar-actions">
                <button class="mini-add-btn" title="Nuevo Miembro" @click="handleCreate">
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
            <div class="search-intro">
              <span class="search-intro-badge">Filtro por cédula</span>
              <p>Encuentra rápidamente a cualquier miembro del plantel usando solo su documento.</p>
            </div>
            <div class="search-field">
              <label class="search-label">Buscar por Cédula</label>
              <el-input
                v-model="searchCedula"
                placeholder="Escribe la cédula sin puntos"
                clearable
                maxlength="9"
                class="modern-search-input modern-sidebar-control"
                @input="v => searchCedula = v.replace(/[^0-9]/g, '')"
              />
              <p class="field-caption">Usa solo números para obtener coincidencias por cédula.</p>
            </div>
          </div>
          <div class="member-list">
            <div
              v-for="miembro in filteredPlantel"
              :key="miembro.plantel_id"
              class="premium-list-item"
              :class="{ active: currentMemberId === miembro.plantel_id }"
              @click="selectMember(miembro)"
            >
              <div class="item-photo">
                <i class="el-icon-user" />
              </div>
              <div class="item-info">
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
              <el-button type="danger" @click="handleDelete(currentMember)">
                <el-icon><Delete /></el-icon>
                <span>Eliminar</span>
              </el-button>
              <el-button type="primary" @click="handleEdit(currentMember)">
                <el-icon><Edit /></el-icon>
                <span>Editar</span>
              </el-button>
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
                    <span v-if="currentMember.fecha_nac" style="color: var(--color-text-muted); font-size: 0.9em">
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
      v-model="dialogVisible"
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
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :disabled-date="disableFutureDates"
                :editable="false"
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
                <template #prefix><i class="el-icon-phone" /></template>
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
      <template #footer><span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancelar</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? 'Actualizar' : 'Crear' }}
        </el-button>
      </span></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getPlantel, createPlantel, updatePlantel, deletePlantel } from '@/api/plantel'
import { getRoles } from '@/api/roles'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Collection, Plus, Setting, Delete, Edit } from '@element-plus/icons-vue'
import { useServerDataRefresh } from '@/composables/useServerDataRefresh'

const plantelForm = ref(null)

const loading = ref(false)
const submitting = ref(false)
const plantelList = ref([])
const searchCedula = ref('')
const filterRol = ref('')
const filterSort = ref('az')
let searchCedulaTimeout = null
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentMemberId = ref(null)
const currentMember = ref({})
const activeTab = ref('general')
const editingId = ref(null)

const formData = ref({
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
})

const isValidExistingDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim())
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (month < 1 || month > 12) return false

  const maxDay = new Date(year, month, 0).getDate()
  return day >= 1 && day <= maxDay
}

const getTodayLocalDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const disableFutureDates = (date) => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date.getTime() > today.getTime()
}

const validateExistingDate = (rule, value, callback) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    callback()
    return
  }

  if (!isValidExistingDate(normalized)) {
    callback(new Error('La fecha de nacimiento no existe. Usa una fecha valida'))
    return
  }

  if (normalized > getTodayLocalDate()) {
    callback(new Error('La fecha de nacimiento no puede ser futura'))
    return
  }

  callback()
}

const formRules = {
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
  ],
  fecha_nac: [
    { validator: validateExistingDate, trigger: ['change', 'blur'] }
  ]
}

const rolesOptions = ref([])

const filteredPlantel = computed(() => {
  if (!searchCedula.value) {
    return plantelList.value
  }
  return plantelList.value.filter(m => String(m.cedula || '').includes(searchCedula.value))
})

watch(searchCedula, () => {
  if (searchCedulaTimeout) clearTimeout(searchCedulaTimeout)
  searchCedulaTimeout = setTimeout(() => {
    fetchPlantel()
  }, 500)
})

const loadRoles = async () => {
  try {
    const response = await getRoles()
    rolesOptions.value = response.map(r => ({
      value: r.rol_id,
      label: r.nombre_rol
    }))
  } catch (error) {
    console.error('Error cargando roles:', error)
  }
}

const filterOnlyNumbers = () => {
  formData.value.telefono = formData.value.telefono.replace(/[^0-9]/g, '')
}

const fetchPlantel = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchCedula.value) {
      params.cedula = searchCedula.value
    }
    if (filterRol.value) {
      params.rol = filterRol.value
    }
    params.sort = filterSort.value
    const response = await getPlantel(params)
    plantelList.value = response.data || response || []

    if (currentMemberId.value) {
      const found = plantelList.value.find(p => p.plantel_id === currentMemberId.value)
      if (found) {
        currentMember.value = found
      } else {
        currentMemberId.value = null
      }
    }
  } catch (error) {
    console.error('Error cargando plantel:', error)
    ElMessage.error('Error al cargar el plantel')
  } finally {
    loading.value = false
  }
}

const selectMember = (member) => {
  currentMemberId.value = member.plantel_id
  currentMember.value = member
}

const getRolTagType = (rolName) => {
  if (!rolName) return ''
  const name = rolName.toUpperCase()
  if (name.includes('ENTRENADOR')) return 'success'
  if (name.includes('ASISTENTE')) return 'info'
  if (name.includes('MEDICO') || name.includes('MÉDICO')) return 'warning'
  if (name.includes('ADMINISTRATIVO') || name.includes('DIRECTIVO')) return 'danger'
  return ''
}

const calculateAge = (dateString) => {
  if (!dateString) return 0
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const resetForm = () => {
  formData.value = {
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
  if (plantelForm.value) {
    plantelForm.value.resetFields()
  }
}

const handleCreate = () => {
  isEdit.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editingId.value = row.plantel_id
  formData.value = {
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono || '',
    rol: row.rol_id,
    cedula: row.cedula ? String(row.cedula) : '',
    fecha_nac: row.fecha_nac ? row.fecha_nac.split('T')[0] : '',
    direccion: {
      pais: row.pais || 'Venezuela',
      estado: row.estado || '',
      municipio: row.municipio || '',
      parroquia: row.parroquia || '',
      descripcion_descriptiva: row.descripcion_descriptiva || ''
    }
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await plantelForm.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await updatePlantel(editingId.value, formData.value)
      ElMessage.success('Miembro actualizado exitosamente')
    } else {
      await createPlantel(formData.value)
      ElMessage.success('Miembro creado exitosamente')
    }

    dialogVisible.value = false
    await fetchPlantel()

    if (isEdit.value && currentMemberId.value === editingId.value) {
      const updated = plantelList.value.find(p => p.plantel_id === editingId.value)
      if (updated) currentMember.value = updated
    }
  } catch (error) {
    if (error !== false) {
      console.error('Error guardando miembro:', error)
      const backendError = error?.response?.data?.error
      ElMessage.error(backendError || 'Error al guardar el miembro')
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `¿Está seguro de eliminar a ${row.nombre} ${row.apellido}?`,
    'Confirmar eliminación',
    {
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deletePlantel(row.plantel_id)
      ElMessage.success('Miembro eliminado exitosamente')
      currentMemberId.value = null
      fetchPlantel()
    } catch (error) {
      console.error('Error eliminando miembro:', error)
      const errorMsg = error.response?.data?.error || 'Error al eliminar el miembro'
      ElMessage.error(errorMsg)
    }
  }).catch(() => {})
}

useServerDataRefresh(async () => {
  await Promise.all([
    loadRoles(),
    fetchPlantel()
  ])
}, {
  isBusy: () => loading.value || submitting.value || dialogVisible.value
})

onMounted(() => {
  loadRoles()
  fetchPlantel()
})
</script>

<style scoped>
.plantel-container {
  padding: 20px;
}

/* Local Overrides */
.header-content h1 {
  margin: 0;
}

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

.search-container {
  padding: 18px 16px 16px;
  background: linear-gradient(180deg, rgba(255, 59, 48, 0.08), transparent 90px), var(--color-bg-card);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.search-intro {
  margin-bottom: 14px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.search-intro-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

[data-theme='dark'] .search-intro-badge {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border-color: transparent;
}

.search-intro p {
  margin: 10px 0 0;
  color: var(--color-text-main);
  font-size: 0.82rem;
  line-height: 1.5;
}

.search-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  opacity: 0.95;
}

.search-field {
  margin-bottom: 0;
}

:deep(.modern-sidebar-control .el-input__wrapper) {
  min-height: 46px;
  border-radius: 15px;
  background: var(--color-bg-body);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  padding: 0 14px;
  transition: box-shadow 0.25s ease, background 0.25s ease;
}

:deep(.modern-sidebar-control .el-input__wrapper:hover) {
  box-shadow: inset 0 0 0 1px rgba(255, 90, 79, 0.26);
}

:deep(.modern-sidebar-control .el-input__wrapper.is-focus) {
  background: var(--color-bg-card);
  box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.14), inset 0 0 0 1px var(--color-primary);
}

:deep(.modern-sidebar-control .el-input__inner) {
  font-size: 0.93rem;
  font-weight: 600;
  color: var(--color-text-main);
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.field-caption {
  margin: 8px 2px 0;
  color: var(--color-text-muted);
  font-size: 0.77rem;
  line-height: 1.45;
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
  border-bottom: 2px solid var(--color-border);
}

.member-details-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: var(--color-primary);
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
  color: var(--color-text-main);
  font-weight: 800;
  letter-spacing: 0.01em;
}

.member-details-info :deep(.el-tag) {
  border: none !important;
  box-shadow: none !important;
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
  color: var(--color-text-muted);
  margin-bottom: 5px;
  font-weight: 600;
}

.form-item p {
  margin: 0;
  color: var(--color-text-main);
  font-size: 1rem;
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
  letter-spacing: 0.3px;
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

:deep(.el-button--primary) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

:deep(.el-button--primary:hover),
:deep(.el-button--primary:focus) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

:deep(.el-tabs__item.is-active) {
  color: var(--color-primary);
}

:deep(.el-tabs__active-bar) {
  background-color: var(--color-primary);
}

:deep(.el-tabs__item:hover) {
  color: var(--color-primary);
}

:deep(.el-tabs--border-card) {
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

:deep(.el-tabs--border-card > .el-tabs__header) {
  background: var(--color-bg-body);
  border-bottom: 1px solid var(--color-border);
}

:deep(.el-tabs--border-card > .el-tabs__header .el-tabs__nav-wrap::after) {
  background-color: var(--color-border);
}

:deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item) {
  color: var(--color-text-muted);
  border-right-color: var(--color-border);
}

:deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active) {
  background: var(--color-bg-card);
  color: var(--color-primary);
  border-right-color: var(--color-border);
  border-left-color: var(--color-border);
}

:deep(.el-tabs--border-card > .el-tabs__content) {
  background: var(--color-bg-card);
}

.member-actions :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.member-actions :deep(.el-button .el-icon) {
  font-size: 0.95rem;
  line-height: 1;
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

  .header-content :deep(> .el-button--primary) {
    width: 100%;
    padding: 12px 20px;
  }

  .sidebar .el-card {
    max-height: 300px;
  }

  .sidebar :deep(.el-card__header) {
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

  .content-area :deep(.el-card__body) {
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
  :deep(.el-dialog) {
    width: 95% !important;
    max-width: 95vw !important;
    margin: 5vh auto !important;
  }

  :deep(.el-dialog__body) {
    padding: 15px;
  }

  :deep(.el-row) {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  :deep(.el-col) {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  :deep(.el-col-12) {
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

  :deep(.el-tabs__item) {
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

  .search-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
    padding-left: 2px;
  }

  .search-field {
    padding: 4px;
  }
}
</style>
