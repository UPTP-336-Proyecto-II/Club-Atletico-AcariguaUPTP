<template>
  <div class="report-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-date" /> Reporte de Asistencia</h1>
          <p class="subtitle">Análisis detallado por atleta y categoría</p>
        </div>
        <div class="no-print">
          <el-button icon="el-icon-printer" plain class="header-action-btn" @click="handlePrint">
            Imprimir Reporte
          </el-button>
        </div>
      </div>
    </div>

    <!-- Filters / Control Panel -->
    <el-card shadow="hover" class="control-panel no-print">
      <div class="control-content">
        <div class="filter-section">

          <div class="filter-item">
            <span class="filter-label">Categoría</span>
            <el-select
              v-model="filters.categoria_id"
              placeholder="Seleccionar Categoría"
              clearable
              filterable
              class="filter-input-select"
              @change="handleFilterChange"
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
            <span class="filter-label">Rango de Fechas</span>
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="a"
              start-placeholder="Inicio"
              end-placeholder="Fin"
              value-format="yyyy-MM-dd"
              class="filter-date-picker"
              @change="handleFilterChange"
            />
          </div>

          <div class="filter-item search-item">
            <span class="filter-label">Buscar Atleta</span>
            <el-input
              v-model="filters.search"
              placeholder="Nombre o apellido..."
              prefix-icon="el-icon-search"
              clearable
              class="filter-input-search"
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
        <el-table
          :data="filteredAthletesStats"
          style="width: 100%"
          class="custom-table"
          :header-cell-style="{
            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
            color: '#1e293b',
            fontWeight: '700',
            borderBottom: '3px solid #E51D22',
            textTransform: 'uppercase',
            padding: '16px 12px'
          }"
        >
          <el-table-column label="Atleta" min-width="280">
            <template slot-scope="scope">
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
            <template slot-scope="scope">
              <el-tag size="medium" effect="plain" type="info" class="category-tag">
                {{ scope.row.categoria_nombre }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Estadísticas" min-width="320" align="center">
            <template slot-scope="scope">
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
            <template slot-scope="scope">
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
            <template slot-scope="scope">
              <el-button
                size="small"
                type="primary"
                circle
                icon="el-icon-view"
                title="Ver Detalle"
                @click="viewDetail(scope.row)"
              />
              <el-button
                size="small"
                type="danger"
                circle
                icon="el-icon-printer"
                title="Imprimir Individual"
                @click="printIndividual(scope.row)"
              />
            </template>
          </el-table-column>
        </el-table>

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
      :visible.sync="showDetailModal"
      width="700px"
      append-to-body
      custom-class="detail-modal"
    >
      <div slot="title" class="modal-header-custom">
        <span class="modal-title">Historial de Asistencia</span>
        <span v-if="selectedAthlete" class="modal-subtitle">
          - {{ selectedAthlete.nombre }} {{ selectedAthlete.apellido }}
        </span>
      </div>

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
            <template slot-scope="scope">
              {{ formatDate(scope.row.fecha) }}
            </template>
          </el-table-column>
          <el-table-column prop="tipo_evento" label="Evento" width="140" />
          <el-table-column prop="estatus" label="Estado" align="center">
            <template slot-scope="scope">
              <el-tag :type="getStatusType(scope.row.estatus)">
                {{ getStatusLabel(scope.row.estatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="observaciones" label="Observaciones" show-overflow-tooltip />
        </el-table>

      </div>

      <div slot="footer" class="dialog-footer no-print">
        <el-button @click="showDetailModal = false">Cerrar</el-button>
        <el-button type="primary" icon="el-icon-printer" @click="printModal">Imprimir</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getCategorias } from '@/api/categorias'
import { getAtletas } from '@/api/atletas'
import { getAsistencias } from '@/api/asistencias'

export default {
  name: 'AsistenciaReporte',
  data() {
    return {
      loading: false,
      categorias: [],
      atletas: [],
      asistencias: [],
      filters: {
        categoria_id: '',
        dateRange: [],
        search: ''
      },
      showDetailModal: false,
      selectedAthlete: null,
      backendUrl: 'http://localhost:3000'
    }
  },
  computed: {
    selectedCategoryName() {
      if (!this.filters.categoria_id) return 'Todas las Categorías'
      const cat = this.categorias.find(c => c.categoria_id === this.filters.categoria_id)
      return cat ? cat.nombre_categoria : ''
    },
    // Main aggregation logic
    filteredAthletesStats() {
      let filtered = this.atletas

      // 1. Filter by Category
      if (this.filters.categoria_id) {
        filtered = filtered.filter(a => a.categoria_id === this.filters.categoria_id)
      }

      // 2. Filter by Search Text
      if (this.filters.search) {
        const q = this.filters.search.toLowerCase()
        filtered = filtered.filter(a =>
          a.nombre.toLowerCase().includes(q) ||
          a.apellido.toLowerCase().includes(q)
        )
      }

      // 3. Map aggregates
      return filtered.map(atleta => {
        // Get attendance records for this athlete within date range
        const records = this.asistencias.filter(r => {
          if (r.atleta_id !== atleta.atleta_id) return false

          if (this.filters.dateRange && this.filters.dateRange.length === 2) {
            const date = new Date(r.fecha)
            const start = new Date(this.filters.dateRange[0])
            const end = new Date(this.filters.dateRange[1])
            // Normalize dates to ignore time
            date.setHours(0, 0, 0, 0)
            start.setHours(0, 0, 0, 0)
            end.setHours(0, 0, 0, 0)
            return date >= start && date <= end
          }
          return true
        })

        const total = records.length
        const presente = records.filter(r => r.estatus === 'PRESENTE').length
        const ausente = records.filter(r => r.estatus === 'AUSENTE').length
        const justificado = records.filter(r => r.estatus === 'JUSTIFICADO').length

        const percentage = total > 0 ? Math.round((presente / total) * 100) : 0

        // Find Category Name
        const cat = this.categorias.find(c => c.categoria_id === atleta.categoria_id)

        return {
          ...atleta,
          categoria_nombre: cat ? cat.nombre_categoria : 'Sin asignar',
          records, // Store for detailed view
          stats: {
            total,
            presente,
            ausente,
            justificado,
            percentage
          }
        }
      })
    },
    selectedAthleteHistory() {
      if (!this.selectedAthlete) return []
      // Sort by date desc
      return [...this.selectedAthlete.records].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    }
  },
  created() {
    this.initialLoad()
  },
  methods: {
    async initialLoad() {
      this.loading = true
      try {
        await Promise.all([
          this.fetchCategorias(),
          this.fetchAtletas(),
          this.fetchAsistencias()
        ])
      } catch (error) {
        console.error('Error loading report data:', error)
        this.$message.error('Error cargando datos del reporte')
      } finally {
        this.loading = false
      }
    },
    async fetchCategorias() {
      this.categorias = await getCategorias()
    },
    async fetchAtletas() {
      this.atletas = await getAtletas()
    },
    async fetchAsistencias() {
      this.asistencias = await getAsistencias()
    },
    handleFilterChange() {
    },
    viewDetail(row) {
      this.selectedAthlete = row
      this.showDetailModal = true
    },
    async printIndividual(row) {
      if (!row) return
      try {
        const { PdfReportService } = await import('@/utils/pdfReportService')

        // Find history with safety check
        const dataStats = this.filteredAthletesStats || []
        const records = dataStats.find(r => r.atleta_id === row.atleta_id)?.records || []
        const sorted = [...records].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

        PdfReportService.generateIndividualAttendanceReport(
          `${row.nombre} ${row.apellido}`,
          sorted
        )
      } catch (e) {
        console.error(e)
        this.$message.error('Error generando PDF')
      }
    },
    async printModal() {
      if (!this.selectedAthlete) return
      this.printIndividual(this.selectedAthlete)
    },
    async handlePrint() {
      try {
        const { PdfReportService } = await import('@/utils/pdfReportService')

        const dataForPdf = this.filteredAthletesStats.map(row => ({
          athlete_name: `${row.nombre} ${row.apellido}`,
          present_count: row.stats.presente,
          absent_count: row.stats.ausente,
          justified_count: row.stats.justificado,
          percentage: row.stats.percentage
        }))

        PdfReportService.generateAttendanceReport(
          dataForPdf,
          this.selectedCategoryName,
          this.filters.dateRange
        )
      } catch (e) {
        console.error(e)
        this.$message.error('Error generando PDF')
      }
    },
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    },
    getStatusType(estatus) {
      const map = {
        'PRESENTE': 'success',
        'AUSENTE': 'danger',
        'JUSTIFICADO': 'warning'
      }
      return map[estatus] || 'info'
    },
    getStatusLabel(estatus) {
      const map = {
        'PRESENTE': 'Presente',
        'AUSENTE': 'Ausente',
        'JUSTIFICADO': 'Justificado'
      }
      return map[estatus] || estatus
    },
    getProgressColor(per) {
      if (per >= 80) return '#67C23A' // Success
      if (per >= 50) return '#E6A23C' // Warning
      return '#F56C6C' // Danger
    },
    getFotoUrl(filename) {
      if (!filename) return ''
      if (filename.startsWith('/uploads')) {
        return `${this.backendUrl}${filename}`
      }
      return `${this.backendUrl}/uploads/atletas/${filename}`
    },
    handleImgError(e) {
      e.target.style.display = 'none'
      if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'
    }
  }
}
</script>

<style scoped>
.report-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

/* Page Header - Red Gradient */
.page-header {
  background: linear-gradient(135deg, #E51D22 0%, #a3161a 100%);
  color: white;
  padding: 25px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(229, 29, 34, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.subtitle {
  margin: 5px 0 0 32px;
  opacity: 0.9;
  font-size: 0.95rem;
}

/* Action Button in Header */
.header-action-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}
.header-action-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

/* Control Panel */
.control-panel {
  margin-bottom: 20px;
  border-left: 5px solid #E51D22;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.control-content {
  display: flex;
  flex-direction: column;
}

.filter-section {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.filter-label {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Inputs styling */
.filter-input-select,
.filter-date-picker,
.filter-input-search {
  width: 100%;
}

::v-deep .el-input__inner,
::v-deep .el-range-input {
  background: #fff !important;
  border: 2px solid #64748b !important;
  border-radius: 12px;
  height: 44px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  transition: all 0.3s ease;
}

::v-deep .el-input__inner:hover,
::v-deep .el-range-editor:hover .el-input__inner {
  border-color: #E51D22 !important;
}

::v-deep .el-input__inner:focus,
::v-deep .el-input.is-focus .el-input__inner,
::v-deep .el-range-editor.is-active .el-input__inner {
  border-color: #E51D22 !important;
  box-shadow: 0 0 0 4px rgba(229, 29, 34, 0.12);
}

::v-deep .el-input__inner::placeholder,
::v-deep .el-range-input::placeholder {
  color: #64748b !important;
  font-weight: 600;
  opacity: 1;
}

::v-deep .el-range-separator {
  line-height: 36px;
  color: #64748b;
  font-weight: 600;
}

/* Main Table Container */
.table-container {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid #e2e8f0;
}

.custom-table {
  border-radius: 12px;
  overflow: hidden;
}

/* Table Body Styles */
::v-deep .el-table__body tr td {
  padding: 16px 12px !important;
  border-bottom: 2px solid #94a3b8 !important;
}

::v-deep .el-table__body tr:hover > td {
  background: linear-gradient(135deg, #fff5f5, #fff) !important;
  border-bottom-color: #E51D22 !important;
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
  border: 2px solid #E51D22;
  box-shadow: 0 3px 8px rgba(229, 29, 34, 0.2);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: linear-gradient(135deg, #E51D22, #c41a1d);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  box-shadow: 0 3px 8px rgba(229, 29, 34, 0.3);
}

.athlete-info {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

.sub-text {
  font-size: 0.8rem;
  color: #64748b;
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
  color: #1e293b;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 10px;
  border: 2px solid #e2e8f0;
}

/* Modal Headers */
.modal-header-custom {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.modal-title { font-size: 1.2rem; font-weight: bold; color: #E51D22; }
.modal-subtitle { color: #666; font-size: 1.1rem; }

.modal-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.summary-item {
  background: #f8fafc;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
}
.summary-item.success { background: #f0f9eb; }
.summary-item.danger { background: #fef0f0; }

.summary-item .label { font-size: 0.8rem; color: #606266; margin-bottom: 5px; }
.summary-item .value { font-size: 1.5rem; font-weight: bold; color: #303133; }

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>
