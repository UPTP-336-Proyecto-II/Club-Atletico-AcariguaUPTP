<template>
  <div class="progress-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-data-line" /> Evolución de Atletas</h1>
          <p class="subtitle">Análisis de Progreso y Rendimiento</p>
        </div>
      </div>
    </div>

    <!-- Barra de Control Compacta -->
    <el-card class="control-panel" shadow="hover">
      <div class="control-content">
        <div class="search-section">
          <label class="control-label"><i class="el-icon-search" /> Buscar Atleta:</label>
          <el-select
            :key="searchKey"
            v-model="selectedAtletaId"
            filterable
            remote
            :remote-method="filterAtletas"
            no-data-text="No se encontraron atletas"
            placeholder="Nombre o Apellido..."
            class="compact-search"
            @change="handleAtletaChange"
          >
            <el-option
              v-for="item in filteredAtletas"
              :key="item.atleta_id"
              :label="item.nombre + ' ' + item.apellido"
              :value="item.atleta_id"
            >
              <div class="atleta-option">
                <img v-if="item.foto" :src="getFotoUrl(item.foto)" class="option-avatar">
                <div v-else class="option-avatar-placeholder"><i class="el-icon-user" /></div>
                <span>{{ item.nombre }} {{ item.apellido }}</span>
                <el-tag size="mini" type="info" class="option-tag">{{ item.categoria_nombre }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </div>

        <div class="filter-section">
          <label class="control-label"><i class="el-icon-medal" /> Categoría:</label>
          <el-select v-model="selectedCategoriaId" placeholder="Todas" clearable class="compact-select" @change="handleCategoriaChange">
            <el-option
              v-for="cat in categorias"
              :key="cat.categoria_id"
              :label="cat.nombre_categoria"
              :value="cat.categoria_id"
            />
          </el-select>
        </div>

        <div class="actions-section">
          <el-button type="danger" icon="el-icon-printer" :disabled="!selectedAtletaId" @click="printCurrentReport">Imprimir Atleta</el-button>
          <el-button type="primary" icon="el-icon-document-copy" :disabled="!selectedCategoriaId" @click="printCategoryReports">Reportes Categoría</el-button>
        </div>
      </div>
    </el-card>

    <!-- Content Area -->
    <div v-if="!selectedAtletaId" class="empty-layout">
      <el-card class="empty-card">
        <div class="empty-state">
          <i class="el-icon-user" />
          <h3>Selecciona un atleta para ver su progreso</h3>
          <p>Utiliza el buscador compacto para comenzar el análisis.</p>
        </div>
      </el-card>
    </div>

    <div v-else v-loading="loading" class="printable-area">
      <!-- NOTE: Header/Footer are now handled by PDFMake natively -->

      <!-- Athlete Profile Mini Card -->
      <el-card shadow="hover" class="athlete-summary-card">
        <div class="summary-content">
          <div class="athlete-avatar">
            <img v-if="atleta.foto" :src="getFotoUrl(atleta.foto)" class="avatar-img">
            <i v-else class="el-icon-user" />
          </div>
          <div class="athlete-details">
            <h2>{{ atleta.nombre }} {{ atleta.apellido }}</h2>
            <div class="tags">
              <el-tag size="small" type="danger">{{ atleta.categoria_nombre }}</el-tag>
              <el-tag size="small" type="info">{{ atleta.posicion_de_juego_nombre || 'Sin posición' }}</el-tag>
              <el-tag size="small" type="success">Pierna: {{ atleta.pierna_dominante || 'Derecha' }}</el-tag>
            </div>
          </div>
          <div class="quick-stats">
            <div class="stat-mini">
              <span class="label">Peso Actual</span>
              <span class="value">{{ latestMedicion ? latestMedicion.peso + ' kg' : '-' }}</span>
            </div>
            <div class="stat-mini">
              <span class="label">IMC</span>
              <span class="value">{{ latestMedicion ? latestMedicion.indice_de_masa : '-' }}</span>
            </div>
            <div class="stat-mini">
              <span class="label">Tests</span>
              <span class="value">{{ tests.length }} realizados</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Trends Row -->
      <el-row :gutter="20" class="stat-cards">
        <el-col v-for="trend in trends" :key="trend.label" :span="6">
          <el-card shadow="hover" class="trend-card">
            <div class="trend-label">{{ trend.label }}</div>
            <div class="trend-value">{{ trend.value }}{{ trend.unit }}</div>
            <div :class="['trend-percentage', trend.status]">
              <i :class="trend.status === 'up' ? 'el-icon-top' : 'el-icon-bottom'" />
              {{ trend.diff > 0 ? '+' : '' }}{{ trend.diff }}%
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Charts Grid -->
      <el-row :gutter="20">
        <el-col :span="16" class="performance-evolution-column">
          <el-card shadow="hover" class="chart-card">
            <template #header><div>
              <span><i class="el-icon-line-chart" /> Evolución de Rendimiento</span>
            </div></template>
            <div id="performance-chart" style="height: 400px;" />
          </el-card>
        </el-col>
        <el-col :span="8" class="radar-card-container">
          <el-card shadow="hover" class="chart-card">
            <template #header><div>
              <span><i class="el-icon-aim" /> Perfil Competitivo (Radar)</span>
            </div></template>
            <div id="radar-chart" style="height: 400px;" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card shadow="hover" class="chart-card">
            <template #header><div>
              <span><i class="el-icon-receiving" /> Histórico de Medidas Corporales</span>
            </div></template>
            <div id="anthropometric-chart" style="height: 350px;" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onActivated, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const route = useRoute()

const selectedAtletaId = ref(null)
const selectedCategoriaId = ref('')
const atletas = ref([])
const filteredAtletas = ref([])
const categorias = ref([])
const atleta = ref({})
const tests = ref([])
const mediciones = ref([])
const loading = ref(false)
const backendUrl = ref('http://localhost:3000')
const searchKey = ref(0)
const charts = {
  performance: null,
  radar: null,
  anthropometric: null
}

const latestMedicion = computed(() => {
  return mediciones.value.length > 0 ? mediciones.value[0] : null
})

const trends = computed(() => {
  if (tests.value.length < 2) return []
  const first = tests.value[tests.value.length - 1]
  const latest = tests.value[0]

  const calculate = (val1, val2) => {
    if (!val1) return 0
    return (((val2 - val1) / val1) * 100).toFixed(1)
  }

  return [
    { label: 'Fuerza', value: latest.test_de_fuerza, unit: '', diff: calculate(first.test_de_fuerza, latest.test_de_fuerza), status: (latest.test_de_fuerza >= first.test_de_fuerza ? 'up' : 'down') },
    { label: 'Velocidad', value: latest.test_velocidad, unit: '', diff: calculate(first.test_velocidad, latest.test_velocidad), status: (latest.test_velocidad >= first.test_velocidad ? 'up' : 'down') },
    { label: 'Resistencia', value: latest.test_resistencia, unit: '', diff: calculate(first.test_resistencia, latest.test_resistencia), status: (latest.test_resistencia >= first.test_resistencia ? 'up' : 'down') },
    { label: 'Coordinación', value: latest.test_coordinacion, unit: '', diff: calculate(first.test_coordinacion, latest.test_coordinacion), status: (latest.test_coordinacion >= first.test_coordinacion ? 'up' : 'down') }
  ]
})

const loadAtletas = async () => {
  try {
    const response = await request({ url: '/atletas', method: 'get' })
    atletas.value = Array.isArray(response) ? response : []
    filteredAtletas.value = [...atletas.value].slice(0, 50)
  } catch (error) {
    console.error('Error cargando atletas:', error)
  }
}

const loadCategorias = async () => {
  try {
    const response = await request({ url: '/categoria', method: 'get' })
    categorias.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error cargando categorías:', error)
  }
}

const filterAtletas = (query) => {
  if (query !== '') {
    filteredAtletas.value = atletas.value.filter(item => {
      const fullName = (item.nombre + ' ' + item.apellido).toLowerCase()
      return fullName.indexOf(query.toLowerCase()) > -1
    }).slice(0, 20)
  } else {
    filteredAtletas.value = (selectedCategoriaId.value
      ? atletas.value.filter(a => a.categoria_id === selectedCategoriaId.value)
      : atletas.value
    ).slice(0, 50)
  }
}

const handleCategoriaChange = (val) => {
  selectedAtletaId.value = null
  if (val) {
    filteredAtletas.value = atletas.value.filter(a => a.categoria_id === val).slice(0, 50)
  } else {
    filteredAtletas.value = [...atletas.value].slice(0, 50)
  }
}

const handleAtletaChange = async (id) => {
  if (!id) return
  loading.value = true

  try {
    const currentAtleta = await request({ url: `/atletas?atleta_id=${id}`, method: 'get' })
    if (currentAtleta) {
      const updatedInfo = Array.isArray(currentAtleta) ? currentAtleta.find(a => a.atleta_id === id) : currentAtleta
      if (updatedInfo) {
        atleta.value = updatedInfo
        const idx = atletas.value.findIndex(a => a.atleta_id === id)
        if (idx !== -1) {
          atletas.value[idx] = updatedInfo 
        }
      }
    }

    const [t, m] = await Promise.all([
      request({ url: `/tests?atleta_id=${id}`, method: 'get' }),
      request({ url: `/mediciones?atleta_id=${id}`, method: 'get' })
    ])
    tests.value = t || []
    mediciones.value = m || []

    nextTick(() => {
      initCharts()
    })
  } catch (error) {
    console.error('Error sincronizando:', error)
    ElMessage.error('Error cargando datos actualizados')
  } finally {
    loading.value = false
  }
}

const getFotoUrl = (filename) => {
  return `${backendUrl.value}/uploads/atletas/${filename}`
}

const initPerformanceChart = () => {
  const chartDom = document.getElementById('performance-chart')
  if (!chartDom) return
  if (charts.performance) charts.performance.dispose()
  charts.performance = echarts.init(chartDom)

  const revertedTests = [...tests.value].reverse()
  const dates = revertedTests.map(t => {
    const d = new Date(t.fecha_test)
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString()
  })

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Fuerza', 'Velocidad', 'Resistencia', 'Coordinación'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dates },
    yAxis: { type: 'value' },
    series: [
      { name: 'Fuerza', type: 'line', smooth: true, data: revertedTests.map(t => t.test_de_fuerza) },
      { name: 'Velocidad', type: 'line', smooth: true, data: revertedTests.map(t => t.test_velocidad) },
      { name: 'Resistencia', type: 'line', smooth: true, data: revertedTests.map(t => t.test_resistencia) },
      { name: 'Coordinación', type: 'line', smooth: true, data: revertedTests.map(t => t.test_coordinacion) }
    ],
    color: ['var(--color-text-main)', 'var(--color-text-main)', '#4CAF50', '#f39c12']
  }
  charts.performance.setOption(option)
}

const initRadarChart = () => {
  const chartDom = document.getElementById('radar-chart')
  if (!chartDom) return
  if (charts.radar) charts.radar.dispose()
  charts.radar = echarts.init(chartDom)

  if (tests.value.length === 0) return

  const latest = tests.value[0]
  const first = tests.value[tests.value.length - 1]

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: ['Estado Actual', 'Estado Inicial'],
      bottom: 0,
      textStyle: { color: 'var(--color-text-main)' }
    },
    radar: {
      center: ['50%', '45%'],
      radius: '60%',
      nameGap: 15,
      indicator: [
        { name: 'Fuerza', max: 100 },
        { name: 'Velocidad', max: 100 },
        { name: 'Resistencia', max: 100 },
        { name: 'Coordinación', max: 100 },
        { name: 'Reacción', max: 100 }
      ],
      axisName: {
        color: 'var(--color-text-main)',
        fontSize: 11,
        padding: [5, 10]
      },
      splitArea: { show: false }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [
            latest.test_de_fuerza,
            latest.test_velocidad,
            latest.test_resistencia,
            latest.test_coordinacion,
            latest.test_de_reaccion
          ],
          name: 'Estado Actual',
          areaStyle: { color: 'rgba(30, 41, 59, 0.3)' },
          itemStyle: { color: 'var(--color-text-main)' }
        },
        {
          value: [
            first.test_de_fuerza,
            first.test_velocidad,
            first.test_resistencia,
            first.test_coordinacion,
            first.test_de_reaccion
          ],
          name: 'Estado Inicial',
          areaStyle: { color: 'rgba(26, 58, 95, 0.1)' },
          itemStyle: { color: 'var(--color-text-main)' },
          lineStyle: { type: 'dashed' }
        }
      ]
    }]
  }
  charts.radar.setOption(option)
}

const initAnthropometricChart = () => {
  const chartDom = document.getElementById('anthropometric-chart')
  if (!chartDom) return
  if (charts.anthropometric) charts.anthropometric.dispose()
  charts.anthropometric = echarts.init(chartDom)

  const revertedMediciones = [...mediciones.value].reverse()
  const dates = revertedMediciones.map(m => {
    const d = new Date(m.fecha_medicion)
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString()
  })

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Peso (kg)', 'Altura (cm)', 'IMC'] },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { rotate: 30 }
    },
    yAxis: [
      { type: 'value', name: 'Kg/Cm', axisLine: { show: true }},
      { type: 'value', name: 'IMC', position: 'right', axisLine: { show: true }}
    ],
    series: [
      { name: 'Peso (kg)', type: 'bar', data: revertedMediciones.map(m => m.peso) },
      { name: 'Altura (cm)', type: 'line', data: revertedMediciones.map(m => m.altura) },
      { name: 'IMC', type: 'line', yAxisIndex: 1, data: revertedMediciones.map(m => m.indice_de_masa) }
    ],
    color: ['#f39c12', 'var(--color-text-main)', '#4CAF50']
  }
  charts.anthropometric.setOption(option)
}

const initCharts = () => {
  initPerformanceChart()
  initRadarChart()
  initAnthropometricChart()
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

const printCurrentReport = async () => {
  try {
    loading.value = true

    const chartsImages = {}

    if (charts.performance) {
      chartsImages.performance = charts.performance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
    }

    if (charts.radar) {
      chartsImages.radar = charts.radar.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
    }

    if (charts.anthropometric) {
      chartsImages.anthropometric = charts.anthropometric.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
    }

    let photoBase64 = null
    if (atleta.value.foto) {
      try {
        const url = getFotoUrl(atleta.value.foto)
        photoBase64 = await toDataURL(url)
      } catch (e) {
        console.warn('Could not load profile photo for PDF', e)
      }
    }

    const { PdfReportService } = await import('@/utils/pdfReportService')

    PdfReportService.generatePerformanceReport(atleta.value, chartsImages, trends.value, photoBase64)

    ElMessage.success('Generando PDF...')
  } catch (error) {
    console.error('Error generando PDF:', error)
    ElMessage.error('Error al generar el PDF')
  } finally {
    loading.value = false
  }
}

const printCategoryReports = async () => {
  if (!selectedCategoriaId.value) return

  loading.value = true
  try {
    const categoria = categorias.value.find(c => c.categoria_id === selectedCategoriaId.value)
    const athletes = atletas.value.filter(a => a.categoria_id === selectedCategoriaId.value)

    if (athletes.length === 0) {
      ElMessage.warning('No hay atletas en esta categoría')
      return
    }

    const allData = await Promise.all(athletes.map(async (atletaItem) => {
      const [t, m] = await Promise.all([
        request({ url: `/tests?atleta_id=${atletaItem.atleta_id}`, method: 'get' }),
        request({ url: `/mediciones?atleta_id=${atletaItem.atleta_id}`, method: 'get' })
      ])
      const latestTest = t && t.length > 0 ? t[0] : {}
      const latestMed = m && m.length > 0 ? m[0] : {}

      return {
        cedula: atletaItem.cedula || `ID: ${atletaItem.atleta_id}`,
        nombre: `${atletaItem.nombre} ${atletaItem.apellido}`,
        posicion: atletaItem.posicion_de_juego_nombre || 'N/A',
        peso: latestMed.peso || '-',
        altura: latestMed.altura || '-',
        imc: latestMed.indice_de_masa || '-',
        fuerza: latestTest.test_de_fuerza || '-',
        velocidad: latestTest.test_velocidad || '-',
        resistencia: latestTest.test_resistencia || '-',
        coordinacion: latestTest.test_coordinacion || '-',
        reaccion: latestTest.test_de_reaccion || '-'
      }
    }))

    const { PdfReportService } = await import('@/utils/pdfReportService')
    PdfReportService.generateCategoryPerformanceReport(allData, categoria.nombre_categoria, categoria.entrenador_nombre)
    ElMessage.success('Generando PDF...')
  } catch (error) {
    console.error('Error generando reporte de categoría:', error)
    ElMessage.error('Error al generar reporte de categoría')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadAtletas(), loadCategorias()])
  const queryId = route.query.atleta_id
  if (queryId) {
    selectedAtletaId.value = parseInt(queryId)
    handleAtletaChange(selectedAtletaId.value)
  }
})

onActivated(async () => {
  await loadAtletas()
  searchKey.value++
  
  const queryId = route.query.atleta_id
  if (queryId && parseInt(queryId) !== selectedAtletaId.value) {
    selectedAtletaId.value = parseInt(queryId)
    await handleAtletaChange(selectedAtletaId.value)
  } else if (selectedAtletaId.value) {
    handleAtletaChange(selectedAtletaId.value)
  }
})

onBeforeUnmount(() => {
  Object.values(charts).forEach(chart => {
    if (chart) chart.dispose()
  })
})
</script>

<style scoped>
.progress-container {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
}

.header-content h1 {
  font-size: 1.8rem;
  margin: 0;
  font-weight: 700;
}

.subtitle {
  opacity: 0.9;
  margin: 5px 0 0;
}

.control-panel {
  margin-bottom: 30px;
  border-radius: 10px;
  border-bottom: 3px solid var(--color-primary);
}

.control-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.control-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-main);
  margin-right: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.control-label i {
  display: none;
}

.search-section, .filter-section {
  display: flex;
  align-items: center;
}

.compact-search {
  width: 280px;
}

.compact-select {
  width: 200px;
}

/* Modern Input & Select Styles */
.search-section :deep(.el-input__inner),
.filter-section :deep(.el-input__inner) {
  background: var(--color-bg-card) !important;
  border: 2px solid #64748b !important;
  border-radius: 12px;
  padding: 12px 16px;
  height: 46px;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-main);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.search-section :deep(.el-input__inner:hover),
.filter-section :deep(.el-input__inner:hover) {
  border-color: var(--color-primary) !important;
}

.search-section :deep(.el-input.is-focus .el-input__inner),
.filter-section :deep(.el-input.is-focus .el-input__inner) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 4px rgba(30, 41, 59, 0.12);
}

.search-section :deep(.el-input__inner::placeholder),
.filter-section :deep(.el-input__inner::placeholder) {
  color: var(--color-text-placeholder) !important;
  font-weight: 500;
}

.atleta-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.option-avatar-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.option-tag {
  margin-left: auto;
}

.empty-layout {
  padding: 40px 0;
}

.empty-card {
  text-align: center;
  padding: 60px 20px;
}

.empty-state i {
  font-size: 4rem;
  color: #eee;
  margin-bottom: 20px;
}

.athlete-summary-card {
  margin-bottom: 20px;
  border-left: 5px solid var(--color-primary);
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.athlete-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  overflow: hidden;
  border: 3px solid #f8d7da;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.athlete-details h2 {
  margin: 0 0 8px 0;
  font-size: 1.6rem;
  color: var(--color-text-main);
}

.tags {
  display: flex;
  gap: 8px;
}

.quick-stats {
  margin-left: auto;
  display: flex;
  gap: 30px;
}

.stat-mini {
  display: flex;
  flex-direction: column;
}

.stat-mini .label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-mini .value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-cards {
  margin-bottom: 20px;
}

.trend-card {
  text-align: center;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.trend-card:hover {
  transform: translateY(-5px);
  border-color: var(--color-primary);
}

.trend-label {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 5px;
}

.trend-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-main);
  margin-bottom: 5px;
}

.trend-percentage {
  font-weight: 700;
  font-size: 0.95rem;
}

.trend-percentage.up {
  color: #10b981;
}

.trend-percentage.down {
  color: #ef4444;
}

.chart-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.chart-card [slot="header"] {
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 1.1rem;
}

/* ============================================
   RESPONSIVE STYLES
   ============================================ */

/* Tablets y laptops pequeños */
@media (max-width: 1200px) {
  .control-content {
    gap: 15px;
  }

  .compact-search {
    width: 240px;
  }

  .compact-select {
    width: 160px;
  }

  .quick-stats {
    gap: 20px;
  }

  /* Cambiar grid de columnas */
  :deep(.el-col-16) {
    width: 100% !important;
    margin-bottom: 20px;
  }

  :deep(.el-col-8) {
    width: 100% !important;
  }
}

/* Tablets */
@media (max-width: 992px) {
  .progress-container {
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

  .search-section,
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }

  .compact-search,
  .compact-select {
    width: 100%;
  }

  .actions-section {
    width: 100%;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .actions-section .el-button {
    flex: 1;
    min-width: 140px;
  }

  .summary-content {
    flex-wrap: wrap;
    gap: 15px;
  }

  .quick-stats {
    width: 100%;
    justify-content: space-around;
    margin-left: 0;
    margin-top: 10px;
  }

  /* Trend cards en 2 columnas */
  :deep(.stat-cards .el-col-6) {
    width: 50% !important;
    margin-bottom: 15px;
  }

  /* Charts apilados */
  :deep(.el-col-16),
  :deep(.el-col-8) {
    width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
}

/* Móviles */
@media (max-width: 768px) {
  .progress-container {
    padding: 10px;
  }

  .page-header {
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 8px;
  }

  .header-content h1 {
    font-size: 1.3rem;
  }

  .subtitle {
    font-size: 0.85rem;
  }

  .control-panel {
    margin-bottom: 20px;
    border-radius: 10px;
  }

  .control-panel :deep(.el-card__body) {
    padding: 12px;
  }

  .control-label {
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-right: 0;
    margin-bottom: 5px;
  }

  .control-label i {
    display: inline-block;
  }

  .actions-section .el-button {
    width: 100%;
    min-width: auto;
  }

  .athlete-summary-card {
    margin-bottom: 15px;
  }

  .athlete-summary-card :deep(.el-card__body) {
    padding: 12px;
  }

  .summary-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .athlete-avatar {
    width: 60px;
    height: 60px;
    font-size: 1.8rem;
  }

  .athlete-details h2 {
    font-size: 1.2rem;
  }

  .tags {
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
  }

  .tags .el-tag {
    font-size: 11px;
  }

  .quick-stats {
    flex-wrap: wrap;
    gap: 15px;
    justify-content: center;
  }

  .stat-mini {
    min-width: 80px;
    text-align: center;
  }

  .stat-mini .label {
    font-size: 0.7rem;
  }

  .stat-mini .value {
    font-size: 1.1rem;
  }

  /* Trend cards en 2 columnas */
  :deep(.stat-cards .el-col-6) {
    width: 50% !important;
    padding: 5px !important;
  }

  .trend-card {
    border-radius: 8px;
  }

  .trend-value {
    font-size: 1.4rem;
  }

  .trend-label {
    font-size: 0.75rem;
  }

  /* Charts más pequeños */
  .chart-card {
    border-radius: 10px;
  }

  .chart-card :deep(.el-card__header) {
    padding: 12px 15px;
  }

  .chart-card :deep(.el-card__header span) {
    font-size: 0.9rem;
  }

  #performance-chart,
  #radar-chart,
  #anthropometric-chart {
    height: 280px !important;
  }

  .empty-card {
    padding: 40px 15px;
  }

  .empty-state i {
    font-size: 3rem;
  }

  .empty-state h3 {
    font-size: 1rem;
  }

  .empty-state p {
    font-size: 0.85rem;
  }
}

/* Móviles pequeños */
@media (max-width: 480px) {
  .progress-container {
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

  .control-panel :deep(.el-card__body) {
    padding: 10px;
  }

  .search-section :deep(.el-input__inner),
  .filter-section :deep(.el-input__inner) {
    height: 42px;
    font-size: 0.9rem;
  }

  .athlete-avatar {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .athlete-details h2 {
    font-size: 1rem;
  }

  .quick-stats {
    gap: 10px;
  }

  .stat-mini {
    min-width: auto;
  }

  .stat-mini .value {
    font-size: 1rem;
  }

  /* Trend cards apiladas */
  :deep(.stat-cards .el-col-6) {
    width: 100% !important;
    margin-bottom: 10px;
  }

  .trend-value {
    font-size: 1.2rem;
  }

  /* Charts aún más pequeños */
  #performance-chart,
  #radar-chart,
  #anthropometric-chart {
    height: 220px !important;
  }
}

/* Móviles muy pequeños */
@media (max-width: 320px) {
  .progress-container {
    padding: 5px;
  }

  .page-header {
    padding: 10px;
  }

  .header-content h1 {
    font-size: 0.95rem;
  }

  .athlete-avatar {
    width: 40px;
    height: 40px;
  }

  .athlete-details h2 {
    font-size: 0.9rem;
  }

  .tags .el-tag {
    font-size: 10px;
    padding: 0 5px;
  }

  #performance-chart,
  #radar-chart,
  #anthropometric-chart {
    height: 180px !important;
  }
}
</style>

<!-- Estilos globales para impresión -->
<style>
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .sidebar-container, .navbar, .tags-view-container, .fixed-header, .drawer-bg, .page-header, .control-panel, .actions-section {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .main-container, .app-main, .progress-container {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    min-width: 100% !important;
    float: none !important;
    display: block !important;
    background: var(--color-bg-card) !important;
  }

  /* Allow global margin-top to apply or set it explicitly here */
  .printable-area {
    width: 100% !important;
    display: block !important;
    margin-top: 0 !important; /* Managed by @page now */
    padding: 0 10px !important;
  }

  .el-row {
    display: flex !important;
    flex-wrap: wrap !important;
    margin: 0 !important;
    width: 100% !important;
  }

  /* Compact styles for print */
  .athlete-summary-card {
    margin-bottom: 10px !important;
    border-left: none !important;
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }

  .athlete-summary-card .el-card__body {
    padding: 10px !important;
  }

  .athlete-avatar {
    width: 50px !important;
    height: 50px !important;
    font-size: 1.5rem !important;
  }

  .athlete-details h2 {
    font-size: 1.2rem !important;
    margin-bottom: 5px !important;
  }

  .stat-mini .label {
    font-size: 0.7rem !important;
  }

  .stat-mini .value {
    font-size: 1.1rem !important;
  }

  .trend-card {
    margin-bottom: 10px !important;
    padding: 5px !important;
    box-shadow: none !important;
    border: 1px solid #eee !important;
  }

  .trend-card .el-card__body {
    padding: 5px !important;
  }

  .trend-value {
    font-size: 1.2rem !important;
  }

  .trend-label {
    font-size: 0.8rem !important;
    margin-bottom: 2px !important;
  }

  .el-col {
    width: 100% !important;
    float: none !important;
    padding: 0 !important;
    margin: 0 0 25px 0 !important;
    display: block !important;
  }

  .el-card {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
    break-inside: avoid !important;
    width: 100% !important;
    margin-bottom: 30px !important;
  }

  .el-card__header {
    background-color: #f8f9fa !important;
    border-bottom: 2px solid var(--color-primary) !important;
  }

  /* Centrado forzado de gráficas mediante tamaño fijo y margen auto */
  #performance-chart, #radar-chart, #anthropometric-chart {
    width: 800px !important;
    height: 320px !important;
    margin: 0 auto !important;
    display: block !important;
  }

  /* FORZAR REPORTE A 2 PÁGINAS */
  .athlete-summary-card {
    margin-bottom: 10px !important;
    padding: 10px !important;
  }

  .summary-content {
    gap: 15px !important;
  }

  .stat-cards {
    margin-bottom: 10px !important;
  }

  .trend-card {
    padding: 5px !important;
  }

  .trend-value {
    font-size: 1.5rem !important;
  }

  /* El salto de página SOLO antes del Radar para dividir 1 y 2 */
  .radar-card-container {
    page-break-before: always !important;
  }

  /* Asegurar que el resto no salte página */
  .athlete-summary-card, .stat-cards, .performance-evolution-column {
    page-break-after: avoid !important;
    page-break-inside: avoid !important;
  }

  .stat-cards {
    display: flex !important;
    flex-wrap: wrap !important;
    flex-direction: row !important;
    width: 100% !important;
    margin-bottom: 20px !important;
  }

  .stat-cards .el-col {
    width: 45% !important;
    margin: 2% !important;
    display: inline-block !important;
  }
}
</style>
