<template>
  <div class="report-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-files" /> Reporte de Atletas</h1>
          <p class="subtitle">Listado General y Fichas Técnicas</p>
        </div>
      </div>
    </div>

    <!-- Control Panel -->
    <el-card class="control-panel" shadow="hover">
      <div class="control-content">
        <div class="filter-section">
          <div class="filter-item">
            <span class="filter-label"><i class="el-icon-medal" /> Categoría:</span>
            <el-select v-model="filters.category" placeholder="Todas" clearable size="small" class="filter-select">
              <el-option label="Todas" value="all" />
              <el-option v-for="cat in categories" :key="cat.categoria_id" :label="cat.nombre_categoria" :value="cat.categoria_id" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-label"><i class="el-icon-user" /> Posición:</span>
            <el-select v-model="filters.position" placeholder="Todas" clearable size="small" class="filter-select">
              <el-option label="Todas" value="all" />
              <el-option v-for="pos in positions" :key="pos" :label="pos" :value="pos" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-label"><i class="el-icon-first-aid-kit" /> Estatus:</span>
            <el-select v-model="filters.status" placeholder="Todos" clearable size="small" class="filter-select">
              <el-option label="Todos" value="all" />
              <el-option label="Activo" value="ACTIVO" />
              <el-option label="Lesionado" value="LESIONADO" />
              <el-option label="Inactivo" value="INACTIVO" />
              <el-option label="Suspendido" value="SUSPENDIDO" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-label"><i class="el-icon-date" /> Edad:</span>
            <el-select v-model="filters.age" placeholder="Todas" clearable size="small" class="filter-select">
              <el-option label="Todas" value="all" />
              <el-option label="< 15 años" value="under15" />
              <el-option label="15 - 17 años" value="15-17" />
              <el-option label="18 - 20 años" value="18-20" />
              <el-option label="> 20 años" value="over20" />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-label"><i class="el-icon-postcard" /> Cédula:</span>
            <el-select v-model="filters.cedulaFilter" placeholder="Todos" size="small" class="filter-select">
              <el-option label="Todos los Atletas" value="todos" />
              <el-option label="Con Cédula" value="con_cedula" />
              <el-option label="Sin Cédula" value="sin_cedula" />
            </el-select>
          </div>

          <div v-if="filters.cedulaFilter === 'con_cedula'" class="filter-item">
            <span class="filter-label"><i class="el-icon-search" /> Buscar:</span>
            <el-input
              v-model="filters.cedula"
              placeholder="Ej: 123456789"
              size="small"
              clearable
              maxlength="9"
              class="filter-input"
              @input="v => filters.cedula = v.replace(/\D/g, '')"
            />
          </div>
        </div>

        <div class="actions-section">
          <el-button type="info" size="small" icon="el-icon-refresh" :loading="loading" @click="fetchData">Actualizar</el-button>
          <el-button type="danger" size="small" icon="el-icon-printer" @click="handlePrintList">Imprimir Lista</el-button>
        </div>
      </div>
    </el-card>

    <!-- Main Table -->
    <div class="table-container">
      <!-- TABLA DESKTOP (oculta en móvil) -->
      <el-table
        v-loading="loading"
        :data="filteredAthletes"
        style="width: 100%"
        class="desktop-table"
        :header-cell-style="{background: '#f5f7fa', color: '#324157', fontWeight: 'bold'}"
        border
        stripe
      >
        <el-table-column label="Atleta" min-width="250">
          <template #default="{row}">
            <div class="athlete-cell">
              <img v-if="row.foto" :src="getFotoUrl(row.foto)" class="cell-avatar" @error="handleImgError">
              <div v-else class="cell-avatar-placeholder"><i class="el-icon-user" /></div>
              <div class="athlete-name">
                <span class="name">{{ row.nombre }} {{ row.apellido }}</span>
                <span class="sub-text">{{ row.telefono || 'Sin teléfono' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Edad" width="100" align="center">
          <template #default="{row}">
            {{ calculateAge(row.fecha_nacimiento) }}
          </template>
        </el-table-column>

        <el-table-column label="Posición" align="center" min-width="120">
          <template #default="{row}">
            <el-tag size="mini" type="info" effect="plain">{{ row.posicion_de_juego_nombre || 'N/A' }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Categoría" align="center" min-width="130">
          <template #default="{row}">
            {{ row.categoria_nombre || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="Estatus" align="center" width="110">
          <template #default="{row}">
            <el-tag size="small" :type="getStatusType(row.estatus)">{{ row.estatus }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Acciones" align="center" width="150" class-name="no-print">
          <template #default="{row}">
            <el-button type="primary" circle size="small" icon="el-icon-view" title="Ver Detalles" @click="openDetailModal(row)" />
            <el-button type="danger" circle size="small" icon="el-icon-printer" title="Imprimir Ficha" @click="handlePrintAthlete(row)" />
          </template>
        </el-table-column>
      </el-table>

      <!-- VISTA TARJETAS MÓVIL (oculta en desktop) -->
      <div v-loading="loading" class="mobile-cards-view">
        <div
          v-for="atleta in filteredAthletes"
          :key="atleta.atleta_id"
          class="athlete-card"
        >
          <!-- Header de la tarjeta -->
          <div class="card-header-section">
            <div class="card-photo-wrapper">
              <img v-if="atleta.foto" :src="getFotoUrl(atleta.foto)" class="card-avatar" @error="handleImgError">
              <div v-else class="card-avatar-placeholder"><i class="el-icon-user" /></div>
            </div>
            <div class="card-athlete-info">
              <span class="card-name">{{ atleta.nombre }} {{ atleta.apellido }}</span>
              <span class="card-phone">{{ atleta.telefono || 'Sin teléfono' }}</span>
            </div>
          </div>

          <!-- Info del atleta -->
          <div class="card-info-section">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">Edad</span>
                <span class="info-value">{{ calculateAge(atleta.fecha_nacimiento) }} años</span>
              </div>
              <div class="info-item">
                <span class="info-label">Categoría</span>
                <span class="info-value">{{ atleta.categoria_nombre || '-' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">Posición</span>
                <el-tag size="mini" type="info" effect="plain">{{ atleta.posicion_de_juego_nombre || 'N/A' }}</el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">Estatus</span>
                <el-tag size="small" :type="getStatusType(atleta.estatus)">{{ atleta.estatus }}</el-tag>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="card-actions-section no-print">
            <el-button size="small" type="primary" icon="el-icon-view" @click="openDetailModal(atleta)">
              Ver Detalles
            </el-button>
            <el-button size="small" type="danger" icon="el-icon-printer" @click="handlePrintAthlete(atleta)">
              Imprimir
            </el-button>
          </div>
        </div>
      </div>

      <div class="table-footer">
        <span>Total: <strong>{{ filteredAthletes.length }}</strong> atletas</span>
      </div>
    </div>

    <!-- Detail Modal -->
    <el-dialog
      v-model="showModal"
      width="900px"
      top="5vh"
      custom-class="athlete-detail-modal"
      :show-close="true"
      append-to-body
    >
      <div v-if="selectedAthlete" id="printable-modal-content" class="modal-content-wrapper">

        <!-- Header Screen -->
        <div class="modal-header-custom screen-only">
          <div class="modal-title">
            <h2><i class="el-icon-document" /> Ficha del Atleta</h2>
          </div>
        </div>

        <!-- Personal / Header Section -->
        <div class="section-block personal-section">
          <div class="profile-header">
            <div class="profile-photo-container">
              <img v-if="selectedAthlete.foto" :src="getFotoUrl(selectedAthlete.foto)" class="profile-photo" @error="handleImgError">
              <div v-else class="profile-placeholder"><i class="el-icon-user" /></div>
            </div>
            <div class="profile-main-info">
              <h3 class="athlete-fullname">{{ selectedAthlete.nombre }} {{ selectedAthlete.apellido }}</h3>
              <div class="tags-container">
                <span class="info-tag category">{{ selectedAthlete.categoria_nombre }}</span>
                <span class="info-tag position">{{ selectedAthlete.posicion_de_juego_nombre }}</span>
                <span :class="['info-tag status', selectedAthlete.estatus ? selectedAthlete.estatus.toLowerCase() : '']">{{ selectedAthlete.estatus }}</span>
              </div>
              <div class="basic-details-grid">
                <div class="detail-item"><strong>Edad:</strong> {{ calculateAge(selectedAthlete.fecha_nacimiento) }} años</div>
                <div class="detail-item"><strong>Nacimiento:</strong> {{ formatDate(selectedAthlete.fecha_nacimiento) }}</div>
                <div class="detail-item"><strong>Teléfono:</strong> {{ selectedAthlete.telefono || 'N/A' }}</div>
                <div class="detail-item"><strong>Pierna:</strong> {{ selectedAthlete.pierna_dominante || 'N/A' }}</div>
              </div>
            </div>
          </div>

          <div class="address-box">
            <strong><i class="el-icon-location" /> Dirección:</strong> {{ selectedAthlete.direccion || 'Dirección no registrada' }}
          </div>
        </div>

        <div class="sheets-container">
          <!-- Medical Sheet -->
          <div class="sheet-section">
            <div class="sheet-title"><h4><i class="el-icon-first-aid-kit" /> Información Médica</h4></div>
            <div v-if="selectedMedical" class="sheet-content">
              <div class="info-grid-3">
                <div class="info-item"><label>Tipo Sanguíneo</label><span>{{ selectedMedical.tipo_sanguineo || 'N/A' }}</span></div>
                <div class="info-item"><label>Alergias</label><span>{{ selectedMedical.alergias || 'Ninguna' }}</span></div>
                <div class="info-item"><label>Condición</label><span>{{ selectedMedical.condicion_medica || 'Ninguna' }}</span></div>
              </div>
              <div class="info-row">
                <label>Lesiones:</label>
                <p>{{ selectedMedical.lesion || 'Sin registro de lesiones' }}</p>
              </div>
              <div class="info-row">
                <label>Observaciones:</label>
                <p>{{ selectedMedical.observacion || 'Sin observaciones' }}</p>
              </div>
            </div>
            <div v-else class="empty-sheet">No hay información médica registrada.</div>
          </div>

          <div class="dual-columns">
            <!-- Anthropometric Sheet -->
            <div class="sheet-section half">
              <div class="sheet-title"><h4><i class="el-icon-guide" /> Antropometría</h4></div>
              <div v-if="selectedMetrics" class="sheet-content">
                <div class="metrics-grid">
                  <div class="metric-box"><strong>Peso</strong><span>{{ selectedMetrics.peso }} kg</span></div>
                  <div class="metric-box"><strong>Altura</strong><span>{{ selectedMetrics.altura }} cm</span></div>
                  <div class="metric-box"><strong>IMC</strong><span>{{ selectedMetrics.indice_de_masa }}</span></div>
                  <div class="metric-box"><strong>Envergadura</strong><span>{{ selectedMetrics.envergadura }} cm</span></div>
                </div>
                <div class="metric-row">
                  <span>P. Pierna: <strong>{{ selectedMetrics.largo_de_pierna }} cm</strong></span> |
                  <span>P. Torso: <strong>{{ selectedMetrics.largo_de_torso }} cm</strong></span>
                </div>
                <div class="metric-date">Medición: {{ formatDate(selectedMetrics.fecha_medicion) }}</div>
              </div>
              <div v-else class="empty-sheet">No hay medidas registradas.</div>
            </div>

            <!-- Performance Sheet -->
            <div class="sheet-section half">
              <div class="sheet-title"><h4><i class="el-icon-stopwatch" /> Rendimiento</h4></div>
              <div v-if="selectedTest" class="sheet-content">
                <div class="metrics-grid">
                  <div class="metric-box performance"><strong>Fuerza</strong><span>{{ selectedTest.test_de_fuerza }}</span></div>
                  <div class="metric-box performance"><strong>Resistencia</strong><span>{{ selectedTest.test_resistencia }}</span></div>
                  <div class="metric-box performance"><strong>Velocidad</strong><span>{{ selectedTest.test_velocidad }}</span></div>
                  <div class="metric-box performance"><strong>Coord.</strong><span>{{ selectedTest.test_coordinacion }}</span></div>
                </div>
                <div class="metric-row">
                  <span>Reacción: <strong>{{ selectedTest.test_de_reaccion }}</strong></span>
                </div>
                <div class="metric-date">Test: {{ formatDate(selectedTest.fecha_test) }}</div>
              </div>
              <div v-else class="empty-sheet">No hay tests registrados.</div>
            </div>
          </div>

          <!-- Tutor Sheet -->
          <div class="sheet-section">
            <div class="sheet-title"><h4><i class="el-icon-s-custom" /> Información del Tutor</h4></div>
            <div v-if="selectedTutor" class="sheet-content">
              <div class="info-grid-3">
                <div class="info-item"><label>Nombre</label><span>{{ selectedTutor.nombre_completo }}</span></div>
                <div class="info-item"><label>Relación</label><span>{{ selectedTutor.tipo_relacion }}</span></div>
                <div class="info-item"><label>Teléfono</label><span>{{ selectedTutor.telefono }}</span></div>
              </div>
              <div class="info-row">
                <label>Correo:</label> <span>{{ selectedTutor.correo || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <label>Dirección:</label> <span>{{ selectedTutor.direccion || 'No especificada' }}</span>
              </div>
            </div>
            <div v-else class="empty-sheet">No hay tutor asignado.</div>
          </div>
        </div>

      </div>
      <template #footer><span class="dialog-footer">
        <el-button @click="showModal = false">Cerrar</el-button>
        <el-button type="danger" icon="el-icon-printer" @click="printModal">Imprimir Ficha</el-button>
      </span></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const atletas = ref([])
const categories = ref([])
const loading = ref(false)
const backendUrl = ref('http://localhost:3000')

const filters = ref({
  category: 'all',
  position: 'all',
  status: 'all',
  age: 'all',
  cedulaFilter: 'todos',
  cedula: ''
})

const showModal = ref(false)
const activeTab = ref('personal')
const selectedAthlete = ref(null)
const selectedMedical = ref(null)
const selectedMetrics = ref(null)
const selectedTest = ref(null)
const selectedTutor = ref(null)

const positions = computed(() => {
  const pos = new Set(atletas.value.map(a => a.posicion_de_juego_nombre).filter(p => p))
  return Array.from(pos)
})

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

const filteredAthletes = computed(() => {
  return atletas.value.filter(athlete => {
    if (filters.value.category !== 'all' && athlete.categoria_id !== filters.value.category) return false
    if (filters.value.position !== 'all' && athlete.posicion_de_juego_nombre !== filters.value.position) return false
    if (filters.value.status !== 'all' && athlete.estatus?.toUpperCase() !== filters.value.status?.toUpperCase()) return false

    const age = calculateAge(athlete.fecha_nacimiento)
    if (filters.value.age !== 'all') {
      if (filters.value.age === 'under15' && age >= 15) return false
      if (filters.value.age === '15-17' && (age < 15 || age > 17)) return false
      if (filters.value.age === '18-20' && (age < 18 || age > 20)) return false
      if (filters.value.age === 'over20' && age <= 20) return false
    }

    if (filters.value.cedulaFilter === 'con_cedula') {
      if (!athlete.cedula || String(athlete.cedula).trim() === '') return false
      if (filters.value.cedula && !String(athlete.cedula).includes(filters.value.cedula)) return false
    } else if (filters.value.cedulaFilter === 'sin_cedula') {
      if (athlete.cedula && String(athlete.cedula).trim() !== '') return false
    }

    return true
  })
})

const fetchData = async () => {
  loading.value = true
  try {
    const [atletasData, categoriasData] = await Promise.all([
      request({ url: '/atletas', method: 'get' }),
      request({ url: '/categoria', method: 'get' })
    ])

    atletas.value = Array.isArray(atletasData) ? atletasData : []
    categories.value = Array.isArray(categoriasData) ? categoriasData : []

    atletas.value.forEach(a => {
      const cat = categories.value.find(c => c.categoria_id === a.categoria_id)
      if (cat) a.categoria_nombre = cat.nombre_categoria
    })
  } catch (err) {
    console.error(err)
    ElMessage.error('Error cargando los datos')
  } finally {
    loading.value = false
  }
}

const openDetailModal = async (athlete) => {
  selectedAthlete.value = athlete
  selectedMedical.value = null
  selectedMetrics.value = null
  selectedTest.value = null
  selectedTutor.value = null
  activeTab.value = 'personal'
  showModal.value = true 

  try {
    const [medical, metrics, tests, tutors] = await Promise.all([
      request({ url: `/ficha-medica`, method: 'get' }),
      request({ url: `/mediciones?atleta_id=${athlete.atleta_id}`, method: 'get' }),
      request({ url: `/tests?atleta_id=${athlete.atleta_id}`, method: 'get' }),
      request({ url: `/tutor`, method: 'get' })
    ])

    if (Array.isArray(medical)) {
      selectedMedical.value = medical.find(m => m.atleta_id === athlete.atleta_id)
    }

    if (Array.isArray(metrics) && metrics.length > 0) selectedMetrics.value = metrics[metrics.length - 1]
    if (Array.isArray(tests) && tests.length > 0) selectedTest.value = tests[0]

    if (athlete.tutor_id && Array.isArray(tutors)) {
      selectedTutor.value = tutors.find(t => t.tutor_id === athlete.tutor_id)
    }
  } catch (e) {
    console.error('Error loading details', e)
    ElMessage.error('Error cargando detalles del atleta')
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES')
}

const getFotoUrl = (filename) => {
  return `${backendUrl.value}/uploads/atletas/${filename}`
}

const handleImgError = (e) => {
  e.target.style.display = 'none'
  if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'
}

const getStatusType = (status) => {
  if (status === 'ACTIVO') return 'success'
  if (status === 'LESIONADO') return 'warning'
  if (status === 'INACTIVO') return 'info'
  if (status === 'SUSPENDIDO') return 'danger'
  return 'info'
}

const handleExport = () => {
  import('@/vendor/Export2Excel').then(excel => {
    const tHeader = ['Nombre', 'Apellido', 'Edad', 'Posición', 'Categoría', 'Teléfono', 'Estatus']
    const filterVal = ['nombre', 'apellido', 'age', 'posicion_de_juego_nombre', 'categoria_nombre', 'telefono', 'estatus']
    const dataToExport = filteredAthletes.value.map(a => ({
      ...a,
      age: calculateAge(a.fecha_nacimiento)
    }))
    const data = dataToExport.map(v => filterVal.map(j => v[j]))
    excel.export_json_to_excel({
      header: tHeader,
      data,
      filename: 'Lista_Atletas_' + new Date().toISOString().slice(0, 10),
      autoWidth: true,
      bookType: 'xlsx'
    })
  })
}

const handlePrintList = async () => {
  try {
    loading.value = true
    const { PdfReportService } = await import('@/utils/pdfReportService')
    PdfReportService.generateAthleteListReport(filteredAthletes.value)
  } catch (e) {
    console.error(e)
    ElMessage.error('Error generando PDF')
  } finally {
    loading.value = false
  }
}

const toDataURL = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}

const printModal = async () => {
  try {
    loading.value = true

    const { PdfReportService } = await import('@/utils/pdfReportService')

    let photoBase64 = null
    if (selectedAthlete.value && selectedAthlete.value.foto) {
      try {
        const url = getFotoUrl(selectedAthlete.value.foto)
        photoBase64 = await toDataURL(url)
      } catch (e) {
        console.warn('Could not load profile photo for PDF', e)
      }
    }

    PdfReportService.generateAthleteCardReport(
      selectedAthlete.value,
      selectedMedical.value,
      selectedMetrics.value,
      selectedTest.value,
      selectedTutor.value,
      photoBase64
    )
  } catch (e) {
    console.error(e)
    ElMessage.error('Error generando Ficha PDF')
  } finally {
    loading.value = false
  }
}

const handlePrintAthlete = async (row) => {
  if (!showModal.value || selectedAthlete.value?.atleta_id !== row.atleta_id) {
    await openDetailModal(row)
  }
  printModal()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.report-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

/* Header styled as per red theme */
.page-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: white;
  padding: 25px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(30, 41, 59, 0.2);
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

/* Control Panel Control Panel matching Rendimiento */
.control-panel {
  margin-bottom: 20px;
  border-left: 5px solid var(--color-primary);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.control-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.filter-section {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-weight: 700;
  color: var(--color-text-main);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.filter-label i {
  display: none;
}

.filter-select {
  width: 160px;
}

/* Modern Select Styles */
.filter-item :deep(.el-input__inner) {
  background: var(--color-bg-card) !important;
  border: 2px solid #64748b !important;
  border-radius: 12px;
  padding: 10px 14px;
  height: 44px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-main);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.filter-item :deep(.el-input__inner:hover) {
  border-color: var(--color-primary) !important;
}

.filter-item :deep(.el-input.is-focus .el-input__inner) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 4px rgba(30, 41, 59, 0.12);
}

.filter-item :deep(.el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
  font-weight: 500;
}

/* Estilos para el input de cédula */
.filter-input {
  width: 140px;
}

.filter-input :deep(.el-input__inner) {
  background: var(--color-bg-card) !important;
  border: 2px solid #64748b !important;
  border-radius: 12px;
  padding: 10px 14px;
  height: 44px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-main);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.filter-input :deep(.el-input__inner:hover) {
  border-color: var(--color-primary) !important;
}

.filter-input :deep(.el-input__inner:focus) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 4px rgba(30, 41, 59, 0.12);
}

.filter-input :deep(.el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
  font-weight: 500;
}

/* Estilos modernos para el switch */
.filter-switch {
  display: flex;
  align-items: center;
}

.filter-switch :deep(.el-switch) {
  height: 28px;
}

.filter-switch :deep(.el-switch__core) {
  width: 50px !important;
  height: 26px !important;
  border-radius: 13px;
  border: 2px solid #cbd5e1;
  background-color: var(--color-border);
  transition: all 0.3s ease;
}

.filter-switch :deep(.el-switch__core::after) {
  width: 20px;
  height: 20px;
  top: 1px;
  left: 1px;
  border-radius: 50%;
  background-color: var(--color-bg-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.filter-switch :deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
}

.filter-switch :deep(.el-switch.is-checked .el-switch__core::after) {
  left: 100%;
  margin-left: -23px;
}

.filter-switch :deep(.el-switch__label) {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.filter-switch :deep(.el-switch__label.is-active) {
  color: var(--color-text-main);
}

.actions-section {
  display: flex;
  gap: 12px;
}

/* Table */
.table-container {
  background: var(--color-bg-card);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid var(--color-border);
}

/* Modern Table Row Styles */
.table-container :deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}

.table-container :deep(.el-table__header-wrapper th) {
  background: linear-gradient(135deg, var(--color-bg-card), var(--color-bg-body)) !important;
  color: var(--color-text-main) !important;
  font-weight: 700 !important;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 3px solid var(--color-primary) !important;
  padding: 16px 12px !important;
  white-space: nowrap;
}

.table-container :deep(.el-table__body tr) {
  transition: all 0.3s ease;
}

.table-container :deep(.el-table__body tr td) {
  padding: 16px 12px !important;
  border-bottom: 2px solid var(--color-border) !important;
}

.table-container :deep(.el-table__body tr:hover > td) {
  background: var(--color-bg-hover) !important;
  border-bottom-color: var(--color-primary) !important;
}

.table-container :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: var(--color-bg-card) !important;
}

.table-container :deep(.el-table--striped .el-table__body tr.el-table__row--striped:hover > td) {
  background: linear-gradient(135deg, #fff5f5, #fff) !important;
}

.table-container :deep(.el-table--border td) {
  border-right: 2px solid #cbd5e1 !important;
}

.athlete-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cell-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid var(--color-primary);
  box-shadow: 0 3px 8px rgba(30, 41, 59, 0.2);
}

.cell-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  box-shadow: 0 3px 8px rgba(30, 41, 59, 0.3);
}

.athlete-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

/* Modal Styling */
.modal-content-wrapper {
  color: #333;
  font-family: 'Figtree', 'Segoe UI', sans-serif;
}

.modal-header-custom {
  border-bottom: 2px solid var(--color-primary);
  margin-bottom: 20px;
  padding-bottom: 10px;
}

.modal-title h2 {
  color: var(--color-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Personal Section */
.section-block {
  background: var(--color-bg-card);
  margin-bottom: 20px;
}

.personal-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.profile-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.profile-photo-container {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  border: 3px solid #eee;
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #ccc;
}

.profile-main-info {
  flex: 1;
}

.athlete-fullname {
  margin: 0 0 10px 0;
  font-size: 1.8rem;
  color: var(--color-primary);
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.tags-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.info-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

.info-tag.category { background: #e6f7ff; color: #0050b3; }
.info-tag.position { background: var(--color-bg-card)7e6; color: #d46b08; }
.info-tag.status { background: #f6ffed; color: #389e0d; }
.info-tag.status.lesionado { background: var(--color-bg-card)1f0; color: #cf1322; }

.basic-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-size: 0.95rem;
}

.address-box {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.9rem;
  border-left: 3px solid #ccc;
}

/* Sheet Layout for other sections */
.sheets-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sheet-section {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.sheet-title {
  background: #f5f7fa;
  padding: 8px 15px;
  border-bottom: 1px solid #e8e8e8;
}

.sheet-title h4 {
  margin: 0;
  color: #324157;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sheet-content {
  padding: 15px;
  background: var(--color-bg-card);
}

.info-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-size: 0.8rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.info-row {
  margin-top: 8px;
  display: flex;
  gap: 5px;
  font-size: 0.95rem;
  border-top: 1px dashed #eee;
  padding-top: 8px;
}

.info-row label {
  font-weight: 700;
  color: #555;
}

.info-row p {
  margin: 0;
  color: #333;
}

/* Metrics */
.dual-columns {
  display: flex;
  gap: 15px;
}

.dual-columns .half {
  flex: 1;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.metric-box {
  border: 1px solid #eee;
  padding: 8px;
  text-align: center;
  border-radius: 4px;
}

.metric-box strong {
  display: block;
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
}

.metric-box span {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: #324157;
}

.metric-box.performance span {
  color: var(--color-primary);
}

.metric-row {
  text-align: center;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #666;
}

.metric-date {
  margin-top: 10px;
  text-align: right;
  font-size: 0.75rem;
  color: #aaa;
  font-style: italic;
}

.empty-sheet {
  padding: 20px;
  text-align: center;
  color: #ccc;
  font-style: italic;
}

.print-only-header {
  display: none;
}

.modal-footer-custom {
  text-align: center;
  margin-top: 20px;
  font-size: 0.7rem;
  color: #ccc;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

/* Footer for App */
.app-footer {
  margin-top: 40px;
  text-align: center;
  color: #909399;
  padding: 20px 0;
  border-top: 1px solid #e6e6e6;
}

.footer-content p {
  margin: 5px 0;
  font-size: 0.9rem;
}

.copyright {
  font-size: 0.8rem;
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

.card-photo-wrapper {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.card-avatar {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid var(--color-primary);
}

.card-avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.card-athlete-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.card-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text-main);
}

.card-phone {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.card-info-section {
  margin-bottom: 12px;
}

.card-info-section .info-row {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.card-info-section .info-row:last-child {
  margin-bottom: 0;
}

.card-info-section .info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-info-section .info-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.card-info-section .info-value {
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 0.9rem;
}

.card-actions-section {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--color-bg-body);
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
    gap: 12px;
  }

  .filter-select {
    width: 140px;
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

  .control-content {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    width: 100%;
    justify-content: space-between;
  }

  .filter-select,
  .filter-input {
    flex: 1;
    width: auto;
    max-width: none;
  }

  .actions-section {
    justify-content: center;
    flex-wrap: wrap;
  }

  .table-container {
    padding: 15px;
    overflow-x: auto;
  }

  .info-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }

  .dual-columns {
    flex-direction: column;
  }

  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .basic-details-grid {
    grid-template-columns: 1fr;
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
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .header-content h1 {
    font-size: 1.3rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .subtitle {
    margin-left: 0;
    text-align: center;
    font-size: 0.85rem;
  }

  .control-panel {
    border-radius: 10px;
  }

  .control-panel :deep(.el-card__body) {
    padding: 12px;
  }

  .filter-label {
    font-size: 0.75rem;
    min-width: 80px;
  }

  .filter-item :deep(.el-input__inner) {
    height: 40px;
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  .actions-section {
    width: 100%;
    gap: 8px;
  }

  .actions-section .el-button {
    flex: 1;
  }

  .table-container {
    padding: 10px;
    border-radius: 10px;
    -webkit-overflow-scrolling: touch;
  }

  .table-container :deep(.el-table__header-wrapper th) {
    padding: 10px 8px !important;
    font-size: 0.75rem;
  }

  .table-container :deep(.el-table__body tr td) {
    padding: 10px 8px !important;
    font-size: 0.85rem;
  }

  .cell-avatar,
  .cell-avatar-placeholder {
    width: 38px;
    height: 38px;
    border-radius: 8px;
  }

  .athlete-cell {
    gap: 10px;
  }

  .name {
    font-size: 0.85rem;
  }

  .sub-text {
    font-size: 0.75rem;
  }

  .table-footer {
    padding: 10px 12px;
    font-size: 0.85rem;
  }

  /* Modal responsive */
  :deep(.athlete-detail-modal) {
    width: 95% !important;
    max-width: 95vw !important;
  }

  .profile-photo-container {
    width: 100px;
    height: 100px;
  }

  .athlete-fullname {
    font-size: 1.3rem;
  }

  .tags-container {
    flex-wrap: wrap;
    justify-content: center;
  }

  .info-grid-3 {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .sheet-section {
    border-radius: 8px;
  }

  .sheet-content {
    padding: 10px;
  }

  .metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .modal-header-custom {
    margin-bottom: 15px;
    padding-bottom: 8px;
  }

  .modal-title h2 {
    font-size: 1.2rem;
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
    font-size: 1.1rem;
  }

  .subtitle {
    font-size: 0.75rem;
  }

  .filter-label {
    font-size: 0.7rem;
    display: none;
  }

  .filter-label i {
    display: inline-block;
    font-size: 1rem;
  }

  .filter-item {
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
  }

  .actions-section .el-button {
    padding: 8px 12px;
    font-size: 0.75rem;
  }

  .table-container {
    padding: 8px;
  }

  .athlete-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .cell-avatar,
  .cell-avatar-placeholder {
    width: 32px;
    height: 32px;
  }

  .profile-photo-container {
    width: 80px;
    height: 80px;
  }

  .athlete-fullname {
    font-size: 1.1rem;
  }

  .info-tag {
    padding: 3px 8px;
    font-size: 0.75rem;
  }

  .info-item label {
    font-size: 0.7rem;
  }

  .info-item span {
    font-size: 0.85rem;
  }

  .metric-box {
    padding: 6px;
  }

  .metric-box strong {
    font-size: 0.65rem;
  }

  .metric-box span {
    font-size: 0.9rem;
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
    font-size: 1rem;
  }

  .control-panel :deep(.el-card__body) {
    padding: 8px;
  }
}

</style>
