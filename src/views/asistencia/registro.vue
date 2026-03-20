<template>
  <div class="asistencia-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-date" /> Control de Asistencia</h1>
          <p class="subtitle">Registro diario por categoría</p>
        </div>
        <div class="header-actions">
          <el-date-picker
            v-model="fecha"
            type="date"
            placeholder="Seleccionar Fecha"
            value-format="yyyy-MM-dd"
            :clearable="false"
            class="header-date-picker"
            @change="loadData"
          />
        </div>
      </div>
    </div>

    <!-- Controls & Filters -->
    <el-card shadow="hover" class="control-card">
      <div class="control-row">
        <div class="control-item category-select">
          <label>Categoría</label>
          <el-select
            v-model="categoria_id"
            placeholder="Seleccionar Categoría"
            filterable
            @change="loadData"
          >
            <el-option
              v-for="cat in categorias"
              :key="cat.categoria_id"
              :label="cat.nombre_categoria"
              :value="cat.categoria_id"
            />
          </el-select>
        </div>

        <div class="control-item category-select">
          <label>Entrenador Resp.</label>
          <el-select
            v-model="entrenador_id"
            placeholder="Responsable"
            filterable
          >
            <el-option
              v-for="entr in entrenadores"
              :key="entr.plantel_id"
              :label="entr.nombre + ' ' + entr.apellido"
              :value="entr.plantel_id"
            />
          </el-select>
        </div>

        <div class="control-item event-select">
          <label>Tipo de Evento</label>
          <el-select v-model="tipo_evento" placeholder="Tipo">
            <el-option label="Entrenamiento" value="Entrenamiento" />
            <el-option label="Partido" value="Partido" />
            <el-option label="Evento Especial" value="Evento especial" />
          </el-select>
        </div>

        <div class="control-item search-box">
          <label>Buscar Atleta</label>
          <el-input
            v-model="searchQuery"
            placeholder="Nombre..."
            clearable
          />
        </div>

        <div class="control-item actions">
          <el-button
            type="primary"
            icon="el-icon-check"
            :loading="saving"
            :disabled="!categoria_id || listaAtletas.length === 0"
            @click="performSave"
          >
            Guardar Asistencia
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Main Table -->
    <el-card shadow="hover" class="main-card">
      <div v-if="loading" class="loading-state">
        <i class="el-icon-loading" /> Cargando atletas...
      </div>

      <div v-else-if="!categoria_id" class="empty-state">
        <i class="el-icon-s-order" />
        <p>Seleccione una categoría para comenzar el registro</p>
      </div>

      <div v-else>
        <!-- Bulk Actions -->
        <div class="bulk-actions">
          <el-button-group>
            <el-button size="mini" type="success" plain @click="setAllStatus('presente')">Todos Presentes</el-button>
            <el-button size="mini" type="danger" plain @click="setAllStatus('ausente')">Todos Ausentes</el-button>
          </el-button-group>
          <span class="summary-text">
            Total: {{ filteredAtletas.length }} |
            Presentes: {{ countPresentes }}
          </span>
        </div>

        <!-- TABLA DESKTOP (oculta en móvil) -->
        <el-table
          :data="filteredAtletas"
          style="width: 100%"
          class="desktop-table"
          border
          row-key="atleta_id"
          :row-class-name="tableRowClassName"
          empty-text="No hay atletas registrados en esta categoría"
        >
          <el-table-column label="Atleta" min-width="250">
            <template #default="scope">
              <div class="athlete-cell">
                <div class="athlete-photo">
                  <div v-if="scope.row.foto" class="avatar-img-wrapper">
                    <img :src="getFotoUrl(scope.row.foto)" class="avatar-img">
                  </div>
                  <i v-else class="el-icon-user" />
                </div>
                <div class="athlete-info">
                  <span class="name">{{ scope.row.nombre }} {{ scope.row.apellido }}</span>
                  <span v-if="scope.row.cedula" class="cedula">#{{ scope.row.cedula }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Asistencia" min-width="320" align="center">
            <template #default="scope">
              <el-radio-group v-model="scope.row.status" size="small" class="status-group" @change="scope.row.isSaved = false">
                <el-radio-button label="presente">
                  <i class="el-icon-check" /> Presente
                </el-radio-button>
                <el-radio-button label="ausente">
                  <i class="el-icon-close" /> Ausente
                </el-radio-button>
                <el-radio-button label="justificativo">
                  <i class="el-icon-warning-outline" /> Justif.
                </el-radio-button>
              </el-radio-group>
            </template>
          </el-table-column>

          <el-table-column label="Observaciones" min-width="200">
            <template #default="scope">
              <el-input
                v-model="scope.row.observaciones"
                size="small"
                placeholder="Nota opcional..."
                @input="scope.row.isSaved = false"
              />
            </template>
          </el-table-column>

          <el-table-column label="Estado" width="100" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.isSaved" type="success" size="mini" effect="dark"><i class="el-icon-check" /> Guardado</el-tag>
              <el-tag v-else type="info" size="mini" effect="plain">Pendiente</el-tag>
            </template>
          </el-table-column>
        </el-table>

        <!-- VISTA TARJETAS MÓVIL (oculta en desktop) -->
        <div class="mobile-cards-view">
          <div
            v-for="atleta in filteredAtletas"
            :key="atleta.atleta_id"
            class="attendance-card"
            :class="{ 'saved': atleta.isSaved, 'presente': atleta.status === 'presente', 'ausente': atleta.status === 'ausente', 'justificativo': atleta.status === 'justificativo' }"
          >
            <!-- Header: Atleta info + Estado -->
            <div class="card-header-section">
              <div class="athlete-photo">
                <div v-if="atleta.foto" class="avatar-img-wrapper">
                  <img :src="getFotoUrl(atleta.foto)" class="avatar-img">
                </div>
                <i v-else class="el-icon-user" />
              </div>
              <div class="athlete-info">
                <span class="name">{{ atleta.nombre }} {{ atleta.apellido }}</span>
                <span v-if="atleta.cedula" class="cedula">#{{ atleta.cedula }}</span>
              </div>
              <el-tag v-if="atleta.isSaved" type="success" size="mini" effect="dark" class="status-tag">
                <i class="el-icon-check" /> Guardado
              </el-tag>
              <el-tag v-else type="info" size="mini" effect="plain" class="status-tag">Pendiente</el-tag>
            </div>

            <!-- Asistencia Radio Buttons -->
            <div class="card-attendance-section">
              <span class="section-label">Asistencia:</span>
              <el-radio-group v-model="atleta.status" size="small" class="status-group-mobile" @change="atleta.isSaved = false">
                <el-radio-button label="presente">
                  <i class="el-icon-check" /> Presente
                </el-radio-button>
                <el-radio-button label="ausente">
                  <i class="el-icon-close" /> Ausente
                </el-radio-button>
                <el-radio-button label="justificativo">
                  <i class="el-icon-warning-outline" /> Justif.
                </el-radio-button>
              </el-radio-group>
            </div>

            <!-- Observaciones -->
            <div class="card-observations-section">
              <span class="section-label">Observaciones:</span>
              <el-input
                v-model="atleta.observaciones"
                size="small"
                placeholder="Nota opcional..."
                @input="atleta.isSaved = false"
              />
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCategorias } from '@/api/categorias'
import { getAtletas } from '@/api/atletas'
import { getAsistencias, createAsistencia, updateAsistencia } from '@/api/asistencias'
import { getPlantel } from '@/api/plantel'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const saving = ref(false)
const categorias = ref([])
const entrenadores = ref([])
const categoria_id = ref('')
const entrenador_id = ref('')
const fecha = ref('')
const tipo_evento = ref('Entrenamiento')
const listaAtletas = ref([])
const searchQuery = ref('')
const backendUrl = 'http://localhost:3000'

const filteredAtletas = computed(() => {
  if (!searchQuery.value) return listaAtletas.value
  const q = searchQuery.value.toLowerCase()
  return listaAtletas.value.filter(a =>
    a.nombre.toLowerCase().includes(q) ||
    a.apellido.toLowerCase().includes(q)
  )
})

const countPresentes = computed(() => {
  return listaAtletas.value.filter(a => a.status === 'presente').length
})

const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fetchCategorias = async () => {
  try {
    categorias.value = await getCategorias()
  } catch (error) {
    ElMessage.error('Error cargando categorías')
  }
}

const fetchEntrenadores = async () => {
  try {
    let list = await getPlantel({ rol: 'ENTRENADOR' })
    if (!Array.isArray(list) || list.length === 0) {
      list = await getPlantel()
    }
    entrenadores.value = Array.isArray(list) ? list : []
    if (entrenadores.value.length > 0 && !entrenador_id.value) {
      entrenador_id.value = entrenadores.value[0].plantel_id
    }
  } catch (error) {
    console.error(error)
    entrenadores.value = []
  }
}

const loadData = async () => {
  if (!categoria_id.value) return

  loading.value = true
  listaAtletas.value = []

  try {
    const atletasCategoria = await getAtletas({ categoria_id: categoria_id.value })

    const asistencias = await getAsistencias({
      categoria_id: categoria_id.value,
      fecha: fecha.value
    })

    listaAtletas.value = atletasCategoria.map(atleta => {
      const record = asistencias.find(r =>
        r.atleta_id === atleta.atleta_id &&
         r.fecha.includes(fecha.value)
      )

      return {
        ...atleta,
        status: record ? record.estatus : 'presente',
        observaciones: record ? record.observaciones : '',
        asistencia_id: record ? record.asistencia_id : null,
        isSaved: !!record
      }
    })

    listaAtletas.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
  } catch (error) {
    console.error(error)
    ElMessage.error('Error cargando datos')
  } finally {
    loading.value = false
  }
}

const setAllStatus = (status) => {
  listaAtletas.value.forEach(a => {
    a.status = status
    a.isSaved = false
  })
}

const performSave = async () => {
  if (entrenadores.value.length > 0 && !entrenador_id.value) {
    ElMessage.warning('Seleccione un entrenador responsable')
    return
  }

  saving.value = true
  let errors = 0

  for (const atleta of listaAtletas.value) {
    if (atleta.isSaved) continue

    const payload = {
      atleta_id: atleta.atleta_id,
      categoria_id: categoria_id.value,
      fecha: fecha.value,
      tipo_evento: tipo_evento.value,
      estatus: atleta.status,
      observaciones: atleta.observaciones,
      entrenador_id: entrenador_id.value || null
    }

    try {
      if (atleta.asistencia_id) {
        await updateAsistencia(atleta.asistencia_id, payload)
      } else {
        const res = await createAsistencia(payload)
        if (res && res.id) {
          atleta.asistencia_id = res.id
        }
      }
      atleta.isSaved = true
    } catch (e) {
      console.error('Error saving athlete ' + atleta.atleta_id, e)
      errors++
    }
  }

  saving.value = false
  if (errors > 0) {
    ElMessage.warning(`Guardado con ${errors} errores.`)
  } else {
    ElMessage.success('Asistencia actualizada correctamente')
  }
}

const getFotoUrl = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('/uploads')) {
    return `${backendUrl}${filename}`
  }
  return `${backendUrl}/uploads/atletas/${filename}`
}

const tableRowClassName = ({ row }) => {
  if (row.status === 'ausente') return 'row-ausente'
  if (row.status === 'justificativo') return 'row-justificado'
  return ''
}

onMounted(() => {
  fecha.value = getTodayDate()
  fetchCategorias()
  fetchEntrenadores()
})
</script>

<style scoped>
.asistencia-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.page-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  font-size: 1.5rem;
  margin: 0 0 5px 0;
  font-weight: 600;
}

.subtitle {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.9;
}

/* Header Date Picker - Modern Executive Style */
.header-actions {
  display: flex;
  align-items: center;
}

.header-date-picker :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 12px 20px 12px 45px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-date-picker :deep(.el-input__inner:hover) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.header-date-picker :deep(.el-input__inner:focus) {
  background: rgba(255, 255, 255, 0.3);
  border-color: #fff;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
}

.header-date-picker :deep(.el-input__prefix) {
  left: 15px;
  color: #fff;
  font-size: 1.1rem;
}

.header-date-picker :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

/* Controls */
.control-card {
  margin-bottom: 20px;
  border: none;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border-radius: 16px;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}

.control-item {
  flex: 1;
  min-width: 200px;
}

.control-item.actions {
  flex: 0 0 auto;
  min-width: auto;
}

.control-item label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text-main);
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Modern Input & Select Styles */
.control-item :deep(.el-input__inner),
.control-item :deep(.el-select .el-input__inner) {
  background: var(--color-bg-card) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 10px;
  padding: 12px 16px;
  height: 44px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.control-item :deep(.el-input__inner:hover),
.control-item :deep(.el-select .el-input__inner:hover) {
  border-color: #cbd5e1 !important;
  background: var(--color-bg-card) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.control-item :deep(.el-input__inner:focus),
.control-item :deep(.el-select .el-input.is-focus .el-input__inner),
.control-item :deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-primary) !important;
  background: var(--color-bg-card) !important;
  box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.12) !important;
  outline: none !important;
}

.control-item :deep(.el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
  font-weight: 500;
  font-style: normal;
  opacity: 1 !important;
}

.control-item :deep(.el-input__prefix) {
  left: 12px;
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.control-item :deep(.el-select .el-input__suffix) {
  right: 12px;
}

.control-item :deep(.el-select .el-input__icon) {
  color: var(--color-border);
  font-size: 0.9rem;
}

/* Specific Modern Search Box Style */
.search-box :deep(.el-input__inner) {
  border: none !important;
  background: var(--color-bg-body) !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05) !important;
  padding-left: 20px;
}

.search-box :deep(.el-input__inner:focus),
.search-box :deep(.el-input__wrapper.is-focus) {
  background: var(--color-bg-card) !important;
  box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.12) !important;
  outline: none !important;
}

/* Primary Button Style */
.control-item.actions :deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  height: 48px;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.3);
  transition: all 0.3s ease;
}

.control-item.actions :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(229, 29, 34, 0.4);
}

/* Main Table */
.main-card {
  border: none;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.bulk-actions {
  padding: 0 0 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 15px;
}

.summary-text {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

/* Athlete Cell */
.athlete-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.athlete-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-bg-body);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--color-border);
  color: var(--color-border);
}

.avatar-img-wrapper {
  width: 100%;
  height: 100%;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.athlete-info {
  display: flex;
  flex-direction: column;
}

.athlete-info .name {
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 0.95rem;
}

.athlete-info .cedula {
  font-size: 0.8rem;
  color: var(--color-border);
}

/* Status Radio */
.status-group :deep(.el-radio-button__inner) {
  padding: 8px 15px;
  font-size: 13px;
}

.status-group :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: -1px 0 0 0 var(--color-primary);
}

/* Custom Overrides */
:deep(.el-button--primary) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

:deep(.el-button--primary:hover) {
  background-color: #cf1a1e;
  border-color: #cf1a1e;
}

:deep(.row-ausente) {
  background-color: #fef2f2 !important;
}

:deep(.row-justificado) {
  background-color: var(--color-bg-card)beb !important;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--color-border);
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

/* Responsive - Tablets */
@media (max-width: 992px) {
  .asistencia-container {
    padding: 15px;
  }

  .page-header {
    padding: 18px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .control-row {
    flex-direction: column;
    gap: 15px;
  }

  .control-item {
    width: 100%;
    min-width: 0;
  }

  .bulk-actions {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}

/* Responsive - Móviles */
@media (max-width: 768px) {
  .asistencia-container {
    padding: 10px;
  }

  .page-header {
    padding: 15px;
    margin-bottom: 12px;
    border-radius: 8px;
  }

  .header-content h1 {
    font-size: 1.2rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .control-card {
    border-radius: 10px;
  }

  .control-card :deep(.el-card__body) {
    padding: 12px;
  }

  .control-item label {
    font-size: 0.75rem;
    margin-bottom: 5px;
  }

  .control-item :deep(.el-input__inner),
  .control-item :deep(.el-select .el-input__inner) {
    height: 44px;
    padding: 10px 12px;
    font-size: 0.9rem;
  }

  .control-item.actions :deep(.el-button--primary) {
    width: 100%;
    height: 44px;
    padding: 10px 16px;
  }

  /* Tabla scrollable en móvil */
  .main-card :deep(.el-table) {
    overflow-x: auto;
  }

  .main-card :deep(.el-table__body-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Radio buttons más compactos */
  .status-group :deep(.el-radio-button__inner) {
    padding: 6px 10px;
    font-size: 11px;
  }

  .status-group :deep(.el-radio-button__inner i) {
    margin-right: 2px;
  }

  .athlete-cell {
    min-width: 180px;
  }

  .athlete-photo {
    width: 35px;
    height: 35px;
  }

  .athlete-info .name {
    font-size: 0.85rem;
  }

  .empty-state {
    padding: 40px 20px;
  }

  .empty-state i {
    font-size: 3rem;
  }
}

/* Responsive - Móviles pequeños */
@media (max-width: 480px) {
  .asistencia-container {
    padding: 8px;
  }

  .page-header {
    padding: 12px;
  }

  .header-content h1 {
    font-size: 1rem;
  }

  .header-date-picker :deep(.el-input__inner) {
    padding: 10px 12px 10px 35px;
    font-size: 0.85rem;
  }

  .summary-text {
    font-size: 0.8rem;
  }

  .bulk-actions :deep(.el-button) {
    padding: 8px 12px;
    font-size: 0.75rem;
  }

  .status-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
  }

  .status-group :deep(.el-radio-button) {
    width: 100%;
  }

  .status-group :deep(.el-radio-button__inner) {
    width: 100%;
    border-radius: 6px !important;
    border: 1px solid #dcdfe6 !important;
  }
}

/* ============================================
   MOBILE CARDS VIEW STYLES
   ============================================ */

/* Por defecto: tarjetas ocultas, tabla visible */
.mobile-cards-view {
  display: none;
}

.desktop-table {
  display: block;
}

.attendance-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-border);
  transition: all 0.3s ease;
}

.attendance-card.saved {
  border-left-color: #22c55e;
  background: linear-gradient(135deg, #f0fdf4, #fff);
}

.attendance-card.presente {
  border-left-color: #22c55e;
}

.attendance-card.ausente {
  border-left-color: #ef4444;
}

.attendance-card.justificativo {
  border-left-color: #f59e0b;
}

.attendance-card .card-header-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-bg-body);
}

.attendance-card .athlete-photo {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.attendance-card .athlete-info {
  flex: 1;
  min-width: 0;
}

.attendance-card .athlete-info .name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-main);
  display: block;
}

.attendance-card .athlete-info .cedula {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.attendance-card .status-tag {
  flex-shrink: 0;
}

.card-attendance-section {
  margin-bottom: 12px;
}

.card-attendance-section .section-label,
.card-observations-section .section-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 8px;
}

.status-group-mobile {
  display: flex;
  width: 100%;
  gap: 6px;
}

.status-group-mobile :deep(.el-radio-button) {
  flex: 1;
}

.status-group-mobile :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 10px 8px;
  font-size: 0.85rem;
  border-radius: 8px !important;
  border: 1px solid var(--color-border) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.status-group-mobile :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  box-shadow: none;
}

.card-observations-section :deep(.el-input__inner) {
  border-radius: 8px;
  padding: 10px 12px;
}

/* RESPONSIVE: Switch tarjetas/tabla */
@media (max-width: 768px) {
  .desktop-table {
    display: none !important;
  }

  .mobile-cards-view {
    display: block !important;
  }
}
</style>

