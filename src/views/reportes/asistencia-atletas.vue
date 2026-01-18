<template>
  <div class="asistencia-reporte-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-date" /> Reporte de Asistencia</h1>
          <p class="subtitle">Análisis detallado por atleta y categoría</p>
        </div>
        <div class="no-print">
          <el-button icon="el-icon-printer" plain @click="handlePrint">
            Imprimir Reporte
          </el-button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <el-card shadow="hover" class="filters-card no-print">
      <div class="filters-row">
        <div class="filter-item">
          <label>Categoría</label>
          <el-select
            v-model="filters.categoria_id"
            placeholder="Seleccionar Categoría"
            clearable
            filterable
            style="width: 100%"
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

        <div class="filter-item date-range">
          <label>Rango de Fechas</label>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="a"
            start-placeholder="Inicio"
            end-placeholder="Fin"
            value-format="yyyy-MM-dd"
            style="width: 100%"
            @change="handleFilterChange"
          />
        </div>

        <div class="filter-item search-box">
          <label>Buscar Atleta</label>
          <el-input
            v-model="filters.search"
            placeholder="Nombre o apellido..."
            prefix-icon="el-icon-search"
            clearable
          />
        </div>
      </div>
    </el-card>

    <!-- Main Content -->
    <el-card shadow="hover" class="main-card">
      <div v-if="loading" class="loading-state">
        <i class="el-icon-loading" /> Cargando datos...
      </div>

      <div v-else>

        <el-table
          :data="filteredAthletesStats"
          style="width: 100%"
          border
          stripe
          :header-cell-style="{background: '#f8fafc', color: '#324157', fontWeight: 'bold'}"
        >
          <el-table-column label="Atleta" min-width="250">
            <template slot-scope="scope">
              <div class="athlete-cell">
                <div class="athlete-photo">
                  <img v-if="scope.row.foto" :src="getFotoUrl(scope.row.foto)" class="avatar-img">
                  <i v-else class="el-icon-user" />
                </div>
                <div class="athlete-info">
                  <span class="name">{{ scope.row.nombre }} {{ scope.row.apellido }}</span>
                  <span class="category-tag">{{ scope.row.categoria_nombre }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Estadísticas" min-width="300" align="center">
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

          <el-table-column label="% Asistencia" width="160" align="center">
            <template slot-scope="scope">
              <div class="progress-col">
                <el-progress
                  :percentage="scope.row.stats.percentage"
                  :color="getProgressColor(scope.row.stats.percentage)"
                  :format="p => p + '%'"
                  :stroke-width="18"
                  text-inside
                />
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Acciones" width="150" align="center" class-name="no-print">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="primary"
                plain
                circle
                icon="el-icon-view"
                title="Ver Detalle"
                @click="viewDetail(scope.row)"
              />
              <el-button
                size="mini"
                type="danger"
                plain
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

      </div>
    </el-card>

    <!-- Detailed Modal -->
    <el-dialog
      :visible.sync="showDetailModal"
      width="700px"
      append-to-body
      custom-class="detail-modal"
    >
      <div slot="title" class="modal-header">
        <span class="modal-title">Historial de Asistencia</span>
        <span v-if="selectedAthlete" class="modal-subtitle">
          {{ selectedAthlete.nombre }} {{ selectedAthlete.apellido }}
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
    }
  }
}
</script>

<style scoped>
.asistencia-reporte-container {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #E51D22, #c41a1d);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
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

/* Filters */
.filters-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.filters-row {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 200px;
}

.filter-item label {
  display: block;
  font-size: 0.9rem;
  color: #606266;
  font-weight: 600;
  margin-bottom: 5px;
}

.main-card {
  min-height: 500px;
  border-radius: 8px;
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
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #dcdfe6;
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
  color: #303133;
}

.athlete-info .category-tag {
  font-size: 0.75rem;
  color: #909399;
}

/* Stats Mini Grid */
.stats-mini-grid {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.stat-box {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 50px;
}

.stat-box.present { background: #f0f9eb; color: #67C23A; }
.stat-box.absent { background: #fef0f0; color: #F56C6C; }
.stat-box.justified { background: #fdf6ec; color: #E6A23C; }
.stat-box.total { background: #f4f4f5; color: #909399; }
.stat-box i { margin-right: 2px; }

/* Progress */
.progress-col {
  padding: 0 10px;
}

/* Modal Helpers */
.modal-header {
  display: flex;
  flex-direction: column;
}
.modal-title { font-size: 1.2rem; font-weight: bold; color: #303133; }
.modal-subtitle { font-size: 0.9rem; color: #909399; margin-top: 5px; }

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

.empty-state {
  padding: 40px;
  text-align: center;
  color: #909399;
}
</style>
