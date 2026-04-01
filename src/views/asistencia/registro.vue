<template>
  <div class="asistencia-container">
    <!-- Header -->
    <div class="premium-header">
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
            :teleported="false"
            popper-class="header-date-picker-popper"
            class="header-date-picker"
            @change="loadData"
          />
        </div>
      </div>
    </div>

    <!-- Controls & Filters -->
    <el-card shadow="hover" class="premium-control-card">
      <div class="control-row">
        <div class="control-item category-select">
          <label class="premium-search-label">Categoría</label>
          <el-select
            v-model="categoria_id"
            placeholder="Seleccionar..."
            filterable
            @change="loadData"
            popper-class="modern-filter-popper"
            class="modern-filter-control"
            style="width: 100%"
          >
            <el-option
              v-for="cat in categoriasFiltradas"
              :key="cat.categoria_id"
              :label="cat.nombre_categoria"
              :value="cat.categoria_id"
            />
          </el-select>
        </div>

        <div class="control-item category-select">
          <label class="premium-search-label">Entrenador Resp.</label>
          <el-select
            v-model="entrenador_id"
            placeholder="Responsable"
            filterable
            clearable
            @change="handleEntrenadorChange"
            popper-class="modern-filter-popper"
            class="modern-filter-control"
            style="width: 100%"
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
          <label class="premium-search-label">Tipo de Evento</label>
          <el-select
            v-model="tipo_evento"
            placeholder="Tipo"
            @change="handleTipoEventoChange"
            popper-class="modern-filter-popper"
            class="modern-filter-control"
            style="width: 100%"
          >
            <el-option label="Entrenamiento" value="Entrenamiento" />
            <el-option label="Partido" value="Partido" />
            <el-option label="Evento Especial" value="Evento especial" />
          </el-select>
        </div>

        <div class="control-item search-box">
          <label class="premium-search-label">Buscar Atleta</label>
          <el-input
            v-model="searchQuery"
            placeholder="Nombre..."
            clearable
            class="modern-filter-input"
          />
        </div>



        <div class="control-item actions">
          <el-button
            type="primary"
            icon="el-icon-check"
            :loading="saving"
            :disabled="!categoria_id || listaAtletas.length === 0"
            @click="performSave"
            class="premium-save-btn"
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
import { useServerDataRefresh } from '@/composables/useServerDataRefresh'

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

const normalizeText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const categoriasFiltradas = computed(() => {
  if (!entrenador_id.value) return categorias.value

  const entrenadorActual = String(entrenador_id.value)
  const matches = categorias.value.filter(cat => String(cat.entrenador_id || '') === entrenadorActual)

  return matches.length > 0 ? matches : categorias.value
})

const filteredAtletas = computed(() => {
  if (!searchQuery.value) return listaAtletas.value
  const q = normalizeText(searchQuery.value)
  return listaAtletas.value.filter(a =>
    normalizeText(a.nombre).includes(q) ||
    normalizeText(a.apellido).includes(q) ||
    normalizeText(a.cedula).includes(q)
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
  } catch (error) {
    console.error(error)
    entrenadores.value = []
  }
}

const handleEntrenadorChange = async () => {
  if (!categoria_id.value) return

  const categoriaSigueDisponible = categoriasFiltradas.value.some(
    cat => String(cat.categoria_id) === String(categoria_id.value)
  )

  if (!categoriaSigueDisponible) {
    categoria_id.value = ''
    listaAtletas.value = []
    return
  }

  await loadData()
}

const handleTipoEventoChange = async () => {
  if (!categoria_id.value) return
  await loadData()
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

    const tipoEventoActual = normalizeText(tipo_evento.value)
    const asistenciasFiltradas = Array.isArray(asistencias)
      ? asistencias.filter(record => {
          const mismaFecha = String(record.fecha || '').includes(fecha.value)
          if (!mismaFecha) return false
          if (!record.tipo_evento) return true
          return normalizeText(record.tipo_evento) === tipoEventoActual
        })
      : []

    listaAtletas.value = atletasCategoria.map(atleta => {
      const record = asistenciasFiltradas.find(r => r.atleta_id === atleta.atleta_id)

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

useServerDataRefresh(async () => {
  await Promise.all([
    fetchCategorias(),
    fetchEntrenadores()
  ])

  if (categoria_id.value) {
    await loadData()
  }
}, {
  isBusy: () => loading.value || saving.value
})

onMounted(() => {
  fecha.value = getTodayDate()
  fetchCategorias()
  fetchEntrenadores()
})
</script>

<style scoped>
.asistencia-container {
  padding: 24px;
  min-height: 100vh;
  background-color: var(--color-bg-body);
}

.premium-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  padding: 24px 30px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 10px 25px -5px var(--color-shadow);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.premium-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 5px 0;
}

.subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

/* Date Picker - Modern, Rounded and Glass */
.header-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.header-date-picker {
  width: 270px;
}

.header-date-picker :deep(.el-date-editor.el-input),
.header-date-picker :deep(.el-input) {
  border-radius: 16px !important;
}

.header-date-picker :deep(.el-input__wrapper) {
  min-height: 52px;
  border-radius: 16px !important;
  border: 1px solid rgba(203, 213, 225, 0.46) !important;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.52), rgba(30, 64, 175, 0.34)) !important;
  backdrop-filter: blur(12px) saturate(145%);
  -webkit-backdrop-filter: blur(12px) saturate(145%);
  box-shadow:
    0 12px 26px rgba(2, 6, 23, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  padding: 0 14px !important;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.25s ease, border-color 0.2s ease, background 0.25s ease !important;
  cursor: pointer !important;
}

.header-date-picker :deep(.el-input__wrapper:hover) {
  transform: translateY(-1px);
  border-color: rgba(226, 232, 240, 0.72) !important;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.62), rgba(255, 59, 48, 0.42)) !important;
  box-shadow:
    0 16px 30px rgba(2, 6, 23, 0.46),
    inset 0 1px 0 rgba(255, 255, 255, 0.24) !important;
}

.header-date-picker :deep(.el-input__wrapper.is-focus),
.header-date-picker :deep(.el-input__wrapper:focus-within) {
  transform: translateY(-1px);
  border-color: rgba(248, 113, 113, 0.92) !important;
  box-shadow:
    0 0 0 3px rgba(239, 68, 68, 0.2),
    0 16px 32px rgba(2, 6, 23, 0.5) !important;
}

.header-date-picker :deep(.el-input__wrapper:active) {
  transform: translateY(0) scale(0.985);
}

.header-date-picker :deep(.el-input__inner) {
  color: #f1f5f9 !important;
  font-weight: 700 !important;
  font-size: 1.02rem !important;
  height: 52px !important;
  line-height: 52px !important;
  text-align: left !important;
  letter-spacing: 0.02em;
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
  text-decoration: none !important;
  outline: none !important;
  cursor: pointer !important;
}

.header-date-picker :deep(.el-input__inner:hover),
.header-date-picker :deep(.el-input__inner:focus),
.header-date-picker :deep(.el-input.is-focus .el-input__inner) {
  border: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
  text-decoration: none !important;
  outline: none !important;
}

.header-date-picker :deep(.el-input__wrapper::before),
.header-date-picker :deep(.el-input__wrapper::after),
.header-date-picker :deep(.el-input__inner::before),
.header-date-picker :deep(.el-input__inner::after) {
  display: none !important;
}

.header-date-picker :deep(.el-input__prefix),
.header-date-picker :deep(.el-input__prefix-inner),
.header-date-picker :deep(.el-input__prefix-inner i) {
  color: #dbeafe !important;
  font-size: 1.15rem !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  transition: transform 0.2s ease, color 0.2s ease;
}

.header-date-picker :deep(.el-input__suffix),
.header-date-picker :deep(.el-input__suffix-inner),
.header-date-picker :deep(.el-input__suffix-inner i) {
  color: #dbeafe !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.header-date-picker :deep(.el-input__prefix-inner),
.header-date-picker :deep(.el-input__suffix-inner) {
  background: transparent !important;
}

.header-date-picker :deep(.el-input__wrapper.is-focus .el-input__prefix-inner i),
.header-date-picker :deep(.el-input__wrapper:focus-within .el-input__prefix-inner i) {
  color: #fff1f2 !important;
  transform: scale(1.08);
}

:deep(.header-date-picker-popper.el-picker__popper) {
  border-radius: 18px !important;
  border: 1px solid rgba(148, 163, 184, 0.34) !important;
  background: linear-gradient(180deg, rgba(2, 6, 23, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%) !important;
  backdrop-filter: blur(14px) saturate(132%);
  -webkit-backdrop-filter: blur(14px) saturate(132%);
  box-shadow: 0 24px 48px rgba(2, 6, 23, 0.6) !important;
  overflow: hidden;
  animation: modernDatePanelIn 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: top center;
}

:deep(.header-date-picker-popper .el-popper__arrow),
:deep(.header-date-picker-popper .el-popper__arrow::before) {
  display: none !important;
}

:deep(.header-date-picker-popper .el-picker-panel) {
  background: transparent !important;
  color: #e2e8f0 !important;
  border: none !important;
  border-radius: 18px !important;
}

:deep(.header-date-picker-popper .el-date-picker__header) {
  margin: 12px 14px 8px;
}

:deep(.header-date-picker-popper .el-date-picker__header-label) {
  color: #e2e8f0 !important;
  font-weight: 700 !important;
}

:deep(.header-date-picker-popper .el-picker-panel__icon-btn) {
  color: #cbd5e1 !important;
  font-size: 15px !important;
  transition: transform 0.18s ease, color 0.18s ease;
}

:deep(.header-date-picker-popper .el-picker-panel__icon-btn:hover) {
  color: #fff1f2 !important;
  transform: scale(1.08);
}

:deep(.header-date-picker-popper .el-date-table th) {
  color: #bfdbfe !important;
  font-weight: 600 !important;
}

:deep(.header-date-picker-popper .el-date-table td .el-date-table-cell) {
  height: 36px;
  padding: 2px 0;
}

:deep(.header-date-picker-popper .el-date-table td .el-date-table-cell__text) {
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 999px;
  color: #e2e8f0;
  transition: transform 0.16s ease, background-color 0.16s ease, color 0.16s ease;
}

:deep(.header-date-picker-popper .el-date-table td.available:hover .el-date-table-cell__text) {
  background: rgba(148, 163, 184, 0.28);
  color: #fff;
  transform: scale(1.06);
}

:deep(.header-date-picker-popper .el-date-table td.today .el-date-table-cell__text) {
  box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.72) inset;
  color: #ffe4e6 !important;
}

:deep(.header-date-picker-popper .el-date-table td.current:not(.disabled) .el-date-table-cell__text) {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(220, 38, 38, 0.42);
}

:deep(.header-date-picker-popper .el-date-table td.prev-month .el-date-table-cell__text),
:deep(.header-date-picker-popper .el-date-table td.next-month .el-date-table-cell__text) {
  color: rgba(148, 163, 184, 0.6) !important;
}

@keyframes modernDatePanelIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.97);
    filter: blur(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.premium-save-btn {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: #fff !important;
  font-weight: 700 !important;
  padding: 12px 24px !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2) !important;
  width: 100%;
}

.premium-save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 59, 48, 0.3) !important;
}

.premium-control-card {
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 15px -3px var(--color-shadow);
  border-radius: 16px;
  background-color: var(--color-bg-card);
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

.premium-search-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  padding-left: 4px;
}

/* Modern Filter Controls */
.modern-filter-control :deep(.el-input__wrapper),
.modern-filter-input :deep(.el-input__wrapper) {
  min-height: 48px;
  border-radius: 14px !important;
  border: 1px solid rgba(203, 213, 225, 0.48) !important;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.5), rgba(30, 64, 175, 0.22)) !important;
  backdrop-filter: blur(10px) saturate(138%);
  -webkit-backdrop-filter: blur(10px) saturate(138%);
  box-shadow:
    0 10px 24px rgba(2, 6, 23, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.14) !important;
  padding: 0 14px !important;
  transition: transform 0.2s ease, box-shadow 0.22s ease, border-color 0.2s ease, background 0.22s ease !important;
}

.modern-filter-control :deep(.el-input__wrapper:hover),
.modern-filter-input :deep(.el-input__wrapper:hover) {
  transform: translateY(-1px);
  border-color: rgba(226, 232, 240, 0.75) !important;
  box-shadow:
    0 14px 28px rgba(2, 6, 23, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
}

.modern-filter-control :deep(.el-input__wrapper.is-focus),
.modern-filter-control :deep(.el-input__wrapper:focus-within),
.modern-filter-input :deep(.el-input__wrapper.is-focus),
.modern-filter-input :deep(.el-input__wrapper:focus-within) {
  transform: translateY(-1px);
  border-color: rgba(248, 113, 113, 0.9) !important;
  box-shadow:
    0 0 0 3px rgba(239, 68, 68, 0.16),
    0 16px 30px rgba(2, 6, 23, 0.24) !important;
}

.modern-filter-control :deep(.el-input__inner),
.modern-filter-input :deep(.el-input__inner) {
  height: 48px !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  color: #f1f5f9 !important;
  font-size: 0.95rem !important;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.modern-filter-control :deep(.el-input__inner::placeholder),
.modern-filter-input :deep(.el-input__inner::placeholder) {
  color: #cbd5e1 !important;
  opacity: 1 !important;
}

.modern-filter-control :deep(.el-select__caret),
.modern-filter-control :deep(.el-input__suffix-inner i) {
  color: #dbeafe !important;
  transition: transform 0.2s ease, color 0.2s ease;
}

.modern-filter-control :deep(.is-focus .el-select__caret) {
  color: #fff1f2 !important;
}

.modern-filter-input :deep(.el-input__inner:-webkit-autofill),
.modern-filter-input :deep(.el-input__inner:-webkit-autofill:hover),
.modern-filter-input :deep(.el-input__inner:-webkit-autofill:focus),
.modern-filter-input :deep(.el-input__inner:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
  -webkit-text-fill-color: #f1f5f9 !important;
  background-color: transparent !important;
  transition: background-color 9999s ease-in-out 0s, color 9999s ease-in-out 0s;
}

/* Search input: remove gray inner fill and keep clean style */
.modern-filter-input :deep(.el-input__wrapper) {
  background: var(--color-bg-card) !important;
  border-color: rgba(148, 163, 184, 0.45) !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.modern-filter-input :deep(.el-input__wrapper:hover) {
  background: var(--color-bg-card) !important;
  border-color: rgba(100, 116, 139, 0.62) !important;
  box-shadow: none !important;
}

.modern-filter-input :deep(.el-input__wrapper.is-focus),
.modern-filter-input :deep(.el-input__wrapper:focus-within) {
  background: var(--color-bg-card) !important;
  border-color: rgba(15, 23, 42, 0.78) !important;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.12) !important;
}

.modern-filter-input :deep(.el-input__inner) {
  color: var(--color-text-main) !important;
}

.modern-filter-input :deep(.el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
}

.modern-filter-input :deep(.el-input__inner:-webkit-autofill),
.modern-filter-input :deep(.el-input__inner:-webkit-autofill:hover),
.modern-filter-input :deep(.el-input__inner:-webkit-autofill:focus),
.modern-filter-input :deep(.el-input__inner:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 1000px var(--color-bg-card) inset !important;
  -webkit-text-fill-color: var(--color-text-main) !important;
}

:deep(.modern-filter-popper.el-select__popper) {
  border-radius: 16px !important;
  border: 1px solid rgba(148, 163, 184, 0.34) !important;
  background: linear-gradient(180deg, rgba(2, 6, 23, 0.92), rgba(15, 23, 42, 0.92)) !important;
  backdrop-filter: blur(12px) saturate(130%);
  -webkit-backdrop-filter: blur(12px) saturate(130%);
  box-shadow: 0 22px 44px rgba(2, 6, 23, 0.55) !important;
  overflow: hidden;
  animation: modernDatePanelIn 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}

:deep(.modern-filter-popper .el-popper__arrow),
:deep(.modern-filter-popper .el-popper__arrow::before) {
  display: none !important;
}

:deep(.modern-filter-popper .el-select-dropdown__item) {
  color: #e2e8f0 !important;
  height: 38px;
  line-height: 38px;
  border-radius: 10px;
  margin: 2px 8px;
  transition: background-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

:deep(.modern-filter-popper .el-select-dropdown__item.hover),
:deep(.modern-filter-popper .el-select-dropdown__item:hover) {
  background: rgba(148, 163, 184, 0.2) !important;
  color: #fff !important;
  transform: translateX(1px);
}

:deep(.modern-filter-popper .el-select-dropdown__item.selected) {
  color: #fff1f2 !important;
  font-weight: 700;
  background: rgba(239, 68, 68, 0.24) !important;
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
  background-color: rgba(239, 68, 68, 0.1) !important;
}

:deep(.row-justificado) {
  background-color: rgba(255, 59, 48, 0.1) !important;
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

