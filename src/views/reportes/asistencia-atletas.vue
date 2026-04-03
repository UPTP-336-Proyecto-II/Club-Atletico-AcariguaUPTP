<template>
  <div class="report-container asistencia-report">
    <!-- Header -->
    <div class="premium-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-date" /> Reporte de Asistencia</h1>
          <p class="subtitle">Análisis detallado por atleta y categoría</p>
        </div>
        <div class="no-print">
          <el-button plain class="header-action-btn" :icon="Printer" @click="handlePrint">
            Imprimir Reporte
          </el-button>
        </div>
      </div>
    </div>

    <!-- Filters / Control Panel -->
    <el-card shadow="hover" class="premium-control-card no-print">
      <div class="control-content">
        <div class="filter-section">

          <div class="filter-item">
            <span class="premium-search-label">Categoría</span>
            <el-select
              v-model="filters.categoria_id"
              placeholder="Seleccionar..."
              clearable
              filterable
              class="modern-search-input modern-filter-control"
              popper-class="report-filter-popper"
              @change="handleFilterChange"
              style="width: 100%"
            >
              <el-option
                v-for="cat in categorias"
                :key="cat.categoria_id"
                :label="cat.nombre_categoria"
                :value="cat.categoria_id"
              />
            </el-select>
          </div>

          <div class="filter-item date-range-item">
            <span class="premium-search-label">Rango de Fechas</span>
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="a"
              start-placeholder="Inicio"
              end-placeholder="Fin"
              value-format="yyyy-MM-dd"
              class="filter-date-picker modern-filter-control"
              popper-class="report-filter-popper"
              @change="handleFilterChange"
            />
          </div>

          <div class="filter-item search-item">
            <span class="premium-search-label">Buscar Atleta</span>
            <el-input
              v-model="filters.search"
              placeholder="Nombre o apellido..."
              clearable
              class="modern-search-input modern-filter-control"
            />
          </div>

        </div>
      </div>
    </el-card>

    <!-- Main Content -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <i class="el-icon-loading" /> Cargando datos...
      </div>

      <div v-else>
        <!-- TABLA DESKTOP (oculta en móvil) -->
        <el-table
          :data="filteredAthletesStats"
          style="width: 100%"
          class="custom-table desktop-table"
          :header-cell-style="{
            background: 'linear-gradient(135deg, var(--color-bg-card), var(--color-bg-body))',
            color: 'var(--color-text-main)',
            fontWeight: '700',
            borderBottom: '3px solid var(--color-primary)',
            textTransform: 'uppercase',
            padding: '16px 12px'
          }"
        >
          <el-table-column label="Atleta" min-width="280">
            <template #default="scope">
              <div class="athlete-cell">
                <div class="athlete-photo-wrapper">
                  <img v-if="scope.row.foto" :src="getFotoUrl(scope.row.foto)" class="avatar-img" @error="handleImgError">
                  <div v-else class="avatar-placeholder"><i class="el-icon-user" /></div>
                </div>
                <div class="athlete-info">
                  <span class="name">{{ scope.row.nombre }} {{ scope.row.apellido }}</span>
                  <span class="sub-text">{{ scope.row.telefono || 'Sin teléfono' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- New Explicit Category Column -->
          <el-table-column label="Categoría" min-width="120" align="center">
            <template #default="scope">
              <el-tag size="medium" effect="plain" type="info" class="category-tag">
                {{ scope.row.categoria_nombre }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Estadísticas" min-width="320" align="center">
            <template #default="scope">
              <div class="stats-mini-grid">
                <div class="stat-box present" title="Asistencias">
                  <i class="el-icon-check" /> {{ scope.row.stats.presente }}
                </div>
                <div class="stat-box absent" title="Inasistencias">
                  <i class="el-icon-close" /> {{ scope.row.stats.ausente }}
                </div>
                <div class="stat-box justified" title="Justificadas">
                  <i class="el-icon-warning-outline" /> {{ scope.row.stats.justificado }}
                </div>
                <div class="stat-box total" title="Total Eventos">
                  <span class="label">Total:</span> {{ scope.row.stats.total }}
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="% Asistencia" width="180" align="center">
            <template #default="scope">
              <div class="progress-col">
                <el-progress
                  :percentage="scope.row.stats.percentage"
                  :color="getProgressColor(scope.row.stats.percentage)"
                  :format="p => p + '%'"
                  :stroke-width="16"
                  text-inside
                />
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Acciones" width="140" align="center" class-name="no-print">
            <template #default="scope">
              <el-tooltip content="Ver detalle" placement="top">
                <el-button
                  size="small"
                  type="primary"
                  circle
                  title="Ver detalle"
                  aria-label="Ver detalle"
                  @click="viewDetail(scope.row)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Imprimir individual" placement="top">
                <el-button
                  size="small"
                  type="danger"
                  circle
                  title="Imprimir individual"
                  aria-label="Imprimir individual"
                  @click="printIndividual(scope.row)"
                >
                  <el-icon><Printer /></el-icon>
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>

        <!-- VISTA TARJETAS MÓVIL (oculta en desktop) -->
        <div class="mobile-cards-view">
          <div
            v-for="atleta in filteredAthletesStats"
            :key="atleta.atleta_id"
            class="athlete-card"
          >
            <!-- Header de la tarjeta -->
            <div class="card-header-section">
              <div class="athlete-photo-wrapper">
                <img v-if="atleta.foto" :src="getFotoUrl(atleta.foto)" class="avatar-img" @error="handleImgError">
                <div v-else class="avatar-placeholder"><i class="el-icon-user" /></div>
              </div>
              <div class="athlete-info">
                <span class="name">{{ atleta.nombre }} {{ atleta.apellido }}</span>
                <el-tag size="small" effect="plain" type="info">{{ atleta.categoria_nombre }}</el-tag>
              </div>
            </div>

            <!-- Estadísticas -->
            <div class="card-stats-section">
              <div class="stats-row">
                <div class="stat-item present">
                  <i class="el-icon-check" />
                  <span class="stat-value">{{ atleta.stats.presente }}</span>
                  <span class="stat-label">Asist.</span>
                </div>
                <div class="stat-item absent">
                  <i class="el-icon-close" />
                  <span class="stat-value">{{ atleta.stats.ausente }}</span>
                  <span class="stat-label">Faltas</span>
                </div>
                <div class="stat-item justified">
                  <i class="el-icon-warning-outline" />
                  <span class="stat-value">{{ atleta.stats.justificado }}</span>
                  <span class="stat-label">Just.</span>
                </div>
                <div class="stat-item total">
                  <span class="stat-value">{{ atleta.stats.total }}</span>
                  <span class="stat-label">Total</span>
                </div>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="card-progress-section">
              <span class="progress-label">% Asistencia:</span>
              <el-progress
                :percentage="atleta.stats.percentage"
                :color="getProgressColor(atleta.stats.percentage)"
                :stroke-width="12"
              />
            </div>

            <!-- Acciones -->
            <div class="card-actions-section no-print">
              <el-button size="small" type="primary" :icon="View" @click="viewDetail(atleta)">
                Ver Detalle
              </el-button>
              <el-button size="small" type="danger" :icon="Printer" @click="printIndividual(atleta)">
                Imprimir
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="filteredAthletesStats.length === 0" class="empty-state">
          <p>No se encontraron datos coincidente con los filtros.</p>
        </div>

        <div v-if="filteredAthletesStats.length > 0" class="table-footer">
          <span>Total: <strong>{{ filteredAthletesStats.length }}</strong> atletas</span>
        </div>

      </div>
    </div>

    <!-- Detailed Modal -->
    <el-dialog
      v-model="showDetailModal"
      width="700px"
      append-to-body
      custom-class="detail-modal"
    >
      <template #title>
        <div class="modal-header-custom">
          <span class="modal-title">Historial de Asistencia</span>
          <span v-if="selectedAthlete" class="modal-subtitle">
            - {{ selectedAthlete.nombre }} {{ selectedAthlete.apellido }}
          </span>
        </div>
      </template>

      <div v-if="selectedAthlete" class="modal-content">

        <div class="modal-summary">
          <div class="summary-item">
            <span class="label">Total Eventos</span>
            <span class="value">{{ selectedAthlete.stats.total }}</span>
          </div>
          <div class="summary-item success">
            <span class="label">Asistencias</span>
            <span class="value">{{ selectedAthlete.stats.presente }}</span>
          </div>
          <div class="summary-item danger">
            <span class="label">Faltas</span>
            <span class="value">{{ selectedAthlete.stats.ausente }}</span>
          </div>
        </div>

        <el-table
          :data="selectedAthleteHistory"
          height="400"
          border
          stripe
          style="width: 100%"
          class="detail-table"
        >
          <el-table-column prop="fecha" label="Fecha" width="120">
            <template #default="scope">
              {{ formatDate(scope.row.fecha) }}
            </template>
          </el-table-column>
          <el-table-column prop="tipo_evento" label="Evento" width="140" />
          <el-table-column prop="estatus" label="Estado" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.estatus)">
                {{ getStatusLabel(scope.row.estatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="observaciones" label="Observaciones" show-overflow-tooltip />
        </el-table>

      </div>

      <template #footer><div class="dialog-footer no-print">
        <el-button @click="showDetailModal = false">Cerrar</el-button>
        <el-button type="primary" :icon="Printer" @click="printModal">Imprimir</el-button>
      </div></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCategorias } from '@/api/categorias'
import { getAtletas } from '@/api/atletas'
import { getAsistencias } from '@/api/asistencias'
import { ElMessage } from 'element-plus'
import { View, Printer } from '@element-plus/icons-vue'
import { useServerDataRefresh } from '@/composables/useServerDataRefresh'

const loading = ref(false)
const categorias = ref([])
const atletas = ref([])
const asistencias = ref([])
const filters = ref({
  categoria_id: '',
  dateRange: [],
  search: ''
})
const showDetailModal = ref(false)
const selectedAthlete = ref(null)
const backendUrl = ref('http://localhost:3000')

const selectedCategoryName = computed(() => {
  if (!filters.value.categoria_id) return 'Todas las Categorías'
  const cat = categorias.value.find(c => c.categoria_id === filters.value.categoria_id)
  return cat ? cat.nombre_categoria : ''
})

const filteredAthletesStats = computed(() => {
  let filtered = atletas.value

  if (filters.value.categoria_id) {
    filtered = filtered.filter(a => a.categoria_id === filters.value.categoria_id)
  }

  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    filtered = filtered.filter(a =>
      a.nombre.toLowerCase().includes(q) ||
      a.apellido.toLowerCase().includes(q)
    )
  }

  return filtered.map(atleta => {
    const records = asistencias.value.filter(r => {
      if (r.atleta_id !== atleta.atleta_id) return false

      if (filters.value.dateRange && filters.value.dateRange.length === 2) {
        const date = new Date(r.fecha)
        const start = new Date(filters.value.dateRange[0])
        const end = new Date(filters.value.dateRange[1])
        date.setHours(0, 0, 0, 0)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        return date >= start && date <= end
      }
      return true
    })

    const total = records.length
    const presente = records.filter(r => r.estatus === 'presente').length
    const ausente = records.filter(r => r.estatus === 'ausente').length
    const justificado = records.filter(r => r.estatus === 'justificativo').length

    const percentage = total > 0 ? Math.round((presente / total) * 100) : 0

    const cat = categorias.value.find(c => c.categoria_id === atleta.categoria_id)

    return {
      ...atleta,
      categoria_nombre: cat ? cat.nombre_categoria : 'Sin asignar',
      records,
      stats: {
        total,
        presente,
        ausente,
        justificado,
        percentage
      }
    }
  })
})

const selectedAthleteHistory = computed(() => {
  if (!selectedAthlete.value) return []
  return [...selectedAthlete.value.records].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
})

const fetchCategorias = async () => {
  categorias.value = await getCategorias()
}

const fetchAtletas = async () => {
  atletas.value = await getAtletas()
}

const fetchAsistencias = async () => {
  asistencias.value = await getAsistencias()
}

const initialLoad = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchCategorias(),
      fetchAtletas(),
      fetchAsistencias()
    ])
  } catch (error) {
    console.error('Error loading report data:', error)
    ElMessage.error('Error cargando datos del reporte')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
}

const viewDetail = (row) => {
  selectedAthlete.value = row
  showDetailModal.value = true
}

const printIndividual = async (row) => {
  if (!row) return
  try {
    const { PdfReportService } = await import('@/utils/pdfReportService')

    const dataStats = filteredAthletesStats.value || []
    const records = dataStats.find(r => r.atleta_id === row.atleta_id)?.records || []
    const sorted = [...records].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    PdfReportService.generateIndividualAttendanceReport(
      `${row.nombre} ${row.apellido}`,
      sorted
    )
  } catch (e) {
    console.error(e)
    ElMessage.error('Error generando PDF')
  }
}

const printModal = async () => {
  if (!selectedAthlete.value) return
  printIndividual(selectedAthlete.value)
}

const handlePrint = async () => {
  try {
    const { PdfReportService } = await import('@/utils/pdfReportService')

    const dataForPdf = filteredAthletesStats.value.map(row => ({
      athlete_name: `${row.nombre} ${row.apellido}`,
      present_count: row.stats.presente,
      absent_count: row.stats.ausente,
      justified_count: row.stats.justificado,
      percentage: row.stats.percentage
    }))

    PdfReportService.generateAttendanceReport(
      dataForPdf,
      selectedCategoryName.value,
      filters.value.dateRange
    )
  } catch (e) {
    console.error(e)
    ElMessage.error('Error generando PDF')
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const getStatusType = (estatus) => {
  const map = {
    'presente': 'success',
    'ausente': 'danger',
    'justificativo': 'warning'
  }
  return map[estatus] || 'info'
}

const getStatusLabel = (estatus) => {
  const map = {
    'presente': 'Presente',
    'ausente': 'Ausente',
    'justificativo': 'Justificado'
  }
  return map[estatus] || estatus
}

const getProgressColor = (per) => {
  if (per >= 80) return '#67C23A'
  if (per >= 50) return '#E6A23C'
  return '#F56C6C'
}

const getFotoUrl = (filename) => {
  if (!filename) return ''
  if (filename.startsWith('/uploads')) {
    return `${backendUrl.value}${filename}`
  }
  return `${backendUrl.value}/uploads/atletas/${filename}`
}

const handleImgError = (e) => {
  e.target.style.display = 'none'
  if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'
}

useServerDataRefresh(initialLoad, {
  isBusy: () => loading.value || showDetailModal.value
})

onMounted(() => {
  initialLoad()
})
</script>

<style scoped>
.report-container {
  padding: 20px;
  --filter-shell-bg: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  --filter-shell-border: rgba(148, 163, 184, 0.34);
  --filter-shell-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  --filter-control-bg: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  --filter-control-border: rgba(148, 163, 184, 0.42);
  --filter-control-border-hover: rgba(255, 59, 48, 0.45);
  --filter-control-focus: rgba(255, 59, 48, 0.28);
  --filter-control-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  --filter-placeholder: #94a3b8;
}

/* Local UI Adjustments */
.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header-content h1 {
  margin: 0;
}

.header-content .no-print {
  margin-left: auto;
  flex-shrink: 0;
}

/* Action Button in Header */
.header-action-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  padding: 10px 20px;
  min-height: 42px;
  line-height: 1;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  white-space: nowrap;
}

.header-action-btn :deep(span),
.header-action-btn :deep(i),
.header-action-btn :deep([class*='el-icon']) {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.header-action-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.control-content {
  display: flex;
  flex-direction: column;
}

.filter-section {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(340px, 1.35fr) minmax(240px, 1fr);
  gap: 16px;
  align-items: flex-end;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid var(--filter-shell-border);
  background: var(--filter-shell-bg);
  box-shadow: var(--filter-shell-shadow);
  backdrop-filter: blur(8px);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-width: 0;
}

.filter-item .premium-search-label {
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-text-muted);
}

.filter-date-picker {
  width: 100%;
}

.filter-item :deep(.el-input__wrapper),
.filter-item :deep(.el-range-editor.el-input__wrapper) {
  min-height: 44px;
  border-radius: 14px;
  background: var(--filter-control-bg) !important;
  box-shadow: 0 0 0 1px var(--filter-control-border), var(--filter-control-shadow) !important;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.filter-item :deep(.el-input__wrapper:hover),
.filter-item :deep(.el-range-editor.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--filter-control-border-hover), 0 10px 22px rgba(15, 23, 42, 0.14) !important;
}

.filter-item :deep(.el-input.is-focus .el-input__wrapper),
.filter-item :deep(.el-range-editor.is-active) {
  box-shadow: 0 0 0 2px var(--filter-control-focus), 0 12px 24px rgba(15, 23, 42, 0.16) !important;
  transform: translateY(-1px);
}

.filter-item :deep(.el-input__inner),
.filter-item :deep(.el-range-input),
.filter-item :deep(.el-range-separator),
.filter-item :deep(.el-input__icon),
.filter-item :deep(.el-date-editor .el-range__icon) {
  color: var(--color-text-main);
  font-weight: 500;
}

.filter-item :deep(.el-input__inner),
.filter-item :deep(.el-range-input) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.filter-item :deep(.el-input__inner::placeholder),
.filter-item :deep(.el-range-input::placeholder) {
  color: var(--filter-placeholder);
}

:deep(.report-filter-popper) {
  background: var(--color-bg-card) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 14px !important;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.2) !important;
  overflow: hidden;
}

:deep(.report-filter-popper .el-picker-panel),
:deep(.report-filter-popper .el-date-range-picker),
:deep(.report-filter-popper .el-select-dropdown__wrap) {
  background: var(--color-bg-card) !important;
  color: var(--color-text-main) !important;
}

:deep(.report-filter-popper .el-select-dropdown__item) {
  min-height: 38px;
  line-height: 38px;
  border-radius: 8px;
  margin: 2px 6px;
}

:deep(.report-filter-popper .el-select-dropdown__item.selected) {
  background: rgba(255, 59, 48, 0.14);
  color: var(--color-primary);
  font-weight: 700;
}

:deep(.report-filter-popper .el-date-table td.today .el-date-table-cell__text) {
  color: var(--color-primary);
}

:deep(.report-filter-popper .el-date-table td.in-range .el-date-table-cell) {
  background: rgba(255, 59, 48, 0.12);
}

/* Main Table Container */
.table-container {
  background: var(--color-bg-card);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid var(--color-border);
}

.custom-table {
  border-radius: 12px;
  overflow: hidden;
}

/* Table Body Styles */
:deep(.el-table__body tr td) {
  padding: 16px 12px !important;
  border-bottom: 2px solid var(--color-border) !important;
}

:deep(.el-table__body tr:hover > td) {
  background: var(--color-bg-hover) !important;
  border-bottom-color: var(--color-primary) !important;
}

/* Athlete Cell */
.athlete-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.athlete-photo-wrapper {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid var(--color-primary);
  box-shadow: 0 3px 8px rgba(30, 41, 59, 0.2);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  box-shadow: 0 3px 8px rgba(30, 41, 59, 0.3);
}

.athlete-info {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 700;
  color: var(--color-text-main);
  font-size: 0.95rem;
}

.sub-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.category-tag {
  font-weight: 600;
  border-radius: 6px;
}

/* Stats Mini Grid */
.stats-mini-grid {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.stat-box {
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.stat-box.present { background: #f0f9eb; color: #67C23A; }
.stat-box.absent { background: #fef0f0; color: #F56C6C; }
.stat-box.justified { background: #fdf6ec; color: #E6A23C; }
.stat-box.total { background: #f4f4f5; color: #909399; }
.stat-box i { margin-right: 4px; }

/* Table Footer */
.table-footer {
  margin-top: 20px;
  text-align: right;
  color: var(--color-text-main);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--color-bg-card), var(--color-bg-body));
  border-radius: 10px;
  border: 2px solid var(--color-border);
}

/* Modal Headers */
.modal-header-custom {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 10px;
}
.modal-title { font-size: 1.2rem; font-weight: bold; color: var(--color-primary); }
.modal-subtitle { color: var(--color-text-muted); font-size: 1.1rem; }

.modal-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.summary-item {
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
}
.summary-item.success { background: rgba(34, 197, 94, 0.15); }
.summary-item.danger { background: rgba(239, 68, 68, 0.14); }

.summary-item .label { font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 5px; }
.summary-item .value { font-size: 1.5rem; font-weight: bold; color: var(--color-text-main); }

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  color: var(--color-text-muted);
}

.detail-table :deep(.el-table__empty-text) {
  color: var(--color-text-muted) !important;
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

.athlete-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
}

.card-header-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-bg-body);
}

.card-header-section .athlete-photo-wrapper {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.card-header-section .athlete-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.card-header-section .name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-main);
}

.card-stats-section {
  margin-bottom: 12px;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 8px;
  text-align: center;
}

.stat-item i {
  font-size: 14px;
  margin-bottom: 2px;
}

.stat-item .stat-value {
  font-weight: 700;
  font-size: 1.1rem;
}

.stat-item .stat-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  opacity: 0.8;
}

.stat-item.present {
  background: #f0f9eb;
  color: #67C23A;
}

.stat-item.absent {
  background: #fef0f0;
  color: #F56C6C;
}

.stat-item.justified {
  background: #fdf6ec;
  color: #E6A23C;
}

.stat-item.total {
  background: #f4f4f5;
  color: #606266;
}

.card-progress-section {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-main);
  white-space: nowrap;
}

.card-progress-section :deep(.el-progress) {
  flex: 1;
}

.card-actions-section {
  display: flex;
  gap: 10px;
}

.card-actions-section .el-button {
  flex: 1;
}

/* ============================================
   RESPONSIVE STYLES
   ============================================ */

/* Tablets y laptops pequeños */
@media (max-width: 1200px) {
  .filter-section {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: 15px;
  }

  .search-item {
    grid-column: 1 / -1;
  }

  /* Reducir anchuras de columnas */
  :deep(.el-table-column) {
    min-width: auto !important;
  }
}

/* Tablets */
@media (max-width: 992px) {
  .report-container {
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

  .header-content h1 {
    font-size: 1.4rem;
    justify-content: center;
  }

  .subtitle {
    margin-left: 0;
    text-align: center;
  }

  .filter-section {
    grid-template-columns: 1fr;
    align-items: stretch;
    padding: 10px;
  }

  .filter-item {
    width: 100%;
    min-width: auto;
  }

  .table-container {
    padding: 15px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Stats más compactos */
  .stats-mini-grid {
    flex-wrap: wrap;
    gap: 6px;
  }

  .stat-box {
    padding: 4px 8px;
    font-size: 0.75rem;
  }

  /* Modal responsive */
  :deep(.detail-modal) {
    width: 95% !important;
    max-width: 95vw !important;
  }

  .modal-summary {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
}

/* Móviles */
@media (max-width: 768px) {
  /* SWITCH: Mostrar tarjetas, ocultar tabla en móvil */
  .desktop-table {
    display: none !important;
  }

  .mobile-cards-view {
    display: block !important;
  }

  .report-container {
    padding: 10px;
  }

  .page-header {
    padding: 15px;
    margin-bottom: 12px;
    border-radius: 8px;
  }

  .header-content h1 {
    font-size: 1.2rem;
    flex-wrap: wrap;
  }

  .header-content h1 i {
    margin-bottom: 5px;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .header-action-btn {
    width: 100%;
    margin-top: 10px;
  }

  .control-panel {
    border-radius: 10px;
  }

  .control-panel :deep(.el-card__body) {
    padding: 12px;
  }

  .filter-label {
    font-size: 0.75rem;
  }

  .date-range-item :deep(.el-date-editor) {
    width: 100% !important;
  }

  .date-range-item :deep(.el-range-input) {
    font-size: 0.8rem;
  }

  /* CONTENEDOR DE TABLA CON SCROLL HORIZONTAL VISIBLE */
  .table-container {
    padding: 10px;
    border-radius: 10px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100%;
  }

  /* Forzar tabla a mostrar todas las columnas con scroll */
  :deep(.el-table) {
    width: 100%;
    overflow: visible;
  }

  :deep(.el-table__header-wrapper),
  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
  }

  /* Ancho mínimo de la tabla para forzar scroll */
  :deep(.el-table__header),
  :deep(.el-table__body) {
    min-width: 800px;
  }

  /* Celdas más compactas */
  :deep(.el-table__body tr td) {
    padding: 10px 8px !important;
  }

  /* Atleta cell más compacto */
  .athlete-cell {
    gap: 10px;
    min-width: 160px;
  }

  .athlete-photo-wrapper {
    width: 38px;
    height: 38px;
  }

  .name {
    font-size: 0.85rem;
  }

  .sub-text {
    font-size: 0.7rem;
  }

  /* Stats en columna */
  .stats-mini-grid {
    flex-direction: column;
    gap: 4px;
    min-width: 100px;
  }

  .stat-box {
    padding: 3px 6px;
    font-size: 0.7rem;
    justify-content: center;
  }

  /* Progress bar más pequeño */
  .progress-col :deep(.el-progress) {
    min-width: 80px;
  }

  .progress-col :deep(.el-progress-bar__outer) {
    height: 12px !important;
  }

  /* Acciones */
  :deep(.el-button--small.is-circle) {
    width: 32px;
    height: 32px;
    padding: 6px;
  }

  .table-footer {
    padding: 10px 12px;
    font-size: 0.85rem;
  }

  /* Modal responsive */
  .modal-summary {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .summary-item {
    padding: 10px;
  }

  .summary-item .value {
    font-size: 1.2rem;
  }

  .modal-header-custom {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .modal-title {
    font-size: 1rem;
  }

  .modal-subtitle {
    font-size: 0.9rem;
  }

  :deep(.detail-modal .el-dialog__body) {
    padding: 15px;
  }
}

/* Móviles pequeños */
@media (max-width: 480px) {
  .report-container {
    padding: 8px;
  }

  .page-header {
    padding: 12px;
  }

  .header-content h1 {
    font-size: 1rem;
  }

  .subtitle {
    font-size: 0.7rem;
  }

  .control-panel :deep(.el-card__body) {
    padding: 10px;
  }

  .filter-section {
    padding: 8px;
    border-radius: 14px;
    gap: 10px;
  }

  .filter-item :deep(.el-input__wrapper),
  .filter-item :deep(.el-range-editor.el-input__wrapper) {
    min-height: 40px;
    border-radius: 12px;
  }

  .table-container {
    padding: 8px;
  }

  .athlete-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    min-width: 120px;
  }

  .athlete-photo-wrapper {
    width: 32px;
    height: 32px;
  }

  .avatar-placeholder {
    font-size: 14px;
  }

  .name {
    font-size: 0.75rem;
  }

  .sub-text {
    display: none;
  }

  .category-tag {
    font-size: 10px;
    padding: 0 6px;
  }

  .stats-mini-grid {
    min-width: 80px;
  }

  .stat-box {
    font-size: 0.65rem;
    padding: 2px 5px;
  }

  .stat-box i {
    font-size: 10px;
    margin-right: 2px;
  }

  .progress-col :deep(.el-progress) {
    min-width: 60px;
  }

  /* Ocultar columna acciones en móvil muy pequeño */
  :deep(.el-table .no-print) {
    display: none;
  }

  .empty-state, .loading-state {
    padding: 30px 15px;
  }
}

/* Móviles muy pequeños */
@media (max-width: 320px) {
  .report-container {
    padding: 5px;
  }

  .page-header {
    padding: 10px;
  }

  .header-content h1 {
    font-size: 0.9rem;
  }

  .table-container {
    padding: 5px;
  }

  .athlete-photo-wrapper {
    display: none;
  }

  .athlete-cell {
    min-width: 100px;
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  .report-container {
    padding: 0;
    background: var(--color-bg-card);
  }

  .table-container {
    box-shadow: none;
    border: none;
  }
}
</style>

<style lang="scss">
[data-theme='dark'] .asistencia-report,
html.dark .asistencia-report {
  --filter-shell-bg: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.94));
  --filter-shell-border: rgba(71, 85, 105, 0.78);
  --filter-shell-shadow: 0 16px 34px rgba(2, 6, 23, 0.62);
  --filter-control-bg: linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%);
  --filter-control-border: rgba(100, 116, 139, 0.84);
  --filter-control-border-hover: rgba(96, 165, 250, 0.72);
  --filter-control-focus: rgba(96, 165, 250, 0.34);
  --filter-control-shadow: 0 10px 24px rgba(2, 6, 23, 0.64);
  --filter-placeholder: #94a3b8;
}

[data-theme='dark'] .asistencia-report .premium-control-card,
[data-theme='dark'] .asistencia-report .premium-control-card .el-card__body,
html.dark .asistencia-report .premium-control-card,
html.dark .asistencia-report .premium-control-card .el-card__body {
  background: #0b1220 !important;
  border-color: rgba(51, 65, 85, 0.85) !important;
}

[data-theme='dark'] .asistencia-report .filter-section,
html.dark .asistencia-report .filter-section {
  background: var(--filter-shell-bg) !important;
  border-color: var(--filter-shell-border) !important;
  box-shadow: var(--filter-shell-shadow) !important;
}

[data-theme='dark'] .asistencia-report .filter-item .premium-search-label,
html.dark .asistencia-report .filter-item .premium-search-label {
  color: #a8b7cc !important;
}

[data-theme='dark'] .asistencia-report .filter-item .el-input__wrapper,
[data-theme='dark'] .asistencia-report .filter-item .el-range-editor.el-input__wrapper,
html.dark .asistencia-report .filter-item .el-input__wrapper,
html.dark .asistencia-report .filter-item .el-range-editor.el-input__wrapper {
  background: var(--filter-control-bg) !important;
  box-shadow: 0 0 0 1px var(--filter-control-border), var(--filter-control-shadow) !important;
}

[data-theme='dark'] .asistencia-report .filter-item .el-input.is-focus .el-input__wrapper,
[data-theme='dark'] .asistencia-report .filter-item .el-range-editor.is-active,
html.dark .asistencia-report .filter-item .el-input.is-focus .el-input__wrapper,
html.dark .asistencia-report .filter-item .el-range-editor.is-active {
  box-shadow: 0 0 0 2px var(--filter-control-focus), 0 12px 24px rgba(2, 6, 23, 0.68) !important;
}

[data-theme='dark'] .asistencia-report .filter-item .el-input__inner,
[data-theme='dark'] .asistencia-report .filter-item .el-range-input,
[data-theme='dark'] .asistencia-report .filter-item .el-range-separator,
[data-theme='dark'] .asistencia-report .filter-item .el-input__icon,
[data-theme='dark'] .asistencia-report .filter-item .el-date-editor .el-range__icon,
html.dark .asistencia-report .filter-item .el-input__inner,
html.dark .asistencia-report .filter-item .el-range-input,
html.dark .asistencia-report .filter-item .el-range-separator,
html.dark .asistencia-report .filter-item .el-input__icon,
html.dark .asistencia-report .filter-item .el-date-editor .el-range__icon {
  color: #e2e8f0 !important;
  -webkit-text-fill-color: #e2e8f0 !important;
}

[data-theme='dark'] .asistencia-report .filter-item .el-input__inner::placeholder,
[data-theme='dark'] .asistencia-report .filter-item .el-range-input::placeholder,
html.dark .asistencia-report .filter-item .el-input__inner::placeholder,
html.dark .asistencia-report .filter-item .el-range-input::placeholder {
  color: #94a3b8 !important;
  -webkit-text-fill-color: #94a3b8 !important;
}
</style>
