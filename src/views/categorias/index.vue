<template>
  <div class="app-container">
    <!-- Header -->
    <div class="premium-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-trophy" /> Gestión de Categorías</h1>
          <p class="subtitle">Categorías predefinidas de la academia</p>
        </div>
      </div>
    </div>

    <!-- Controls & Filters -->
    <el-card shadow="hover" class="premium-control-card">
      <div class="control-row">
        <div class="control-item search-box">
          <label class="premium-search-label">Buscar Categoría</label>
          <el-select
            v-model="filtroCategoria"
            placeholder="Seleccionar categoría..."
            clearable
            :filterable="false"
            style="width: 100%"
            class="modern-search-input"
          >
            <el-option
              v-for="cat in categorias"
              :key="cat.categoria_id"
              :label="cat.nombre_categoria"
              :value="cat.categoria_id"
            />
          </el-select>
        </div>

        <div class="control-item filter-box">
          <label class="premium-search-label">Entrenador</label>
          <el-select v-model="filtroEntrenador" placeholder="Todos" clearable filterable style="width: 100%" class="modern-search-input">
            <el-option
              v-for="ent in entrenadores"
              :key="ent.plantel_id"
              :label="ent.nombre + ' ' + ent.apellido"
              :value="ent.plantel_id"
            />
          </el-select>
        </div>

        <div class="control-item filter-box">
          <label class="premium-search-label">Estatus</label>
          <el-select v-model="filtroEstatus" placeholder="Todos" clearable style="width: 100%" class="modern-search-input">
            <el-option label="Activas" value="Activa" />
            <el-option label="Inactivas" value="Inactiva" />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- Main Content -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="categoriasFiltradas.length === 0" class="empty-state">
      <i class="el-icon-folder-opened" />
      <p>No se encontraron categorías</p>
    </div>

    <div v-else class="categories-grid">
      <el-card
        v-for="cat in categoriasFiltradas"
        :key="cat.categoria_id"
        class="category-card"
        :class="{ 'inactive-card': cat.estatus === 'Inactiva' }"
        shadow="hover"
        :body-style="{ padding: '0px' }"
      >
        <div class="card-header">
          <div class="category-icon">
            <span>{{ getInitials(cat.nombre_categoria) }}</span>
          </div>
          <div class="category-title">
            <h3>{{ cat.nombre_categoria }}</h3>
            <div class="tags-row">
              <el-tag size="small" effect="dark" type="danger" class="age-tag">
                {{ cat.edad_min }} - {{ cat.edad_max }} Años
              </el-tag>
              <el-tag
                size="small"
                :type="cat.estatus === 'Activa' ? 'success' : 'info'"
              >
                {{ cat.estatus || 'Activa' }}
              </el-tag>
            </div>
          </div>
          <div v-if="canUserEdit" class="card-actions">
            <el-button
              type="text"
              icon="el-icon-edit"
              @click="editarCategoria(cat)"
            />
          </div>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="label"><i class="el-icon-user" /> Entrenador</span>
            <span class="value">{{ getEntrenadorName(cat.entrenador_id) }}</span>
          </div>

          <div class="info-row">
            <span class="label"><i class="el-icon-s-cooperation" /> Atletas</span>
            <span class="value">{{ cat.total_atletas || 0 }} Registrados</span>
          </div>

          <div class="progress-section">
            <div class="progress-label">Ocupación</div>
            <el-progress :percentage="getOcupacion(cat)" :format="() => ''" :color="'var(--color-text-main)'" />
          </div>
        </div>
      </el-card>
    </div>

    <!-- Modal Form (Solo editar entrenador y estatus) -->
    <el-dialog
      title="Editar Categoría"
      v-model="mostrarModal"
      width="450px"
      custom-class="category-dialog"
      :close-on-click-modal="false"
    >
      <div class="categoria-info">
        <h3>{{ formulario.nombre_categoria }}</h3>
        <el-tag type="danger" size="small">{{ formulario.edad_min }} - {{ formulario.edad_max }} años</el-tag>
      </div>

      <el-form ref="form" :model="formulario" label-position="top">
        <el-form-item label="Entrenador Responsable">
          <el-select v-model="formulario.entrenador_id" placeholder="Seleccionar entrenador" style="width: 100%" filterable clearable>
            <el-option
              v-for="ent in entrenadores"
              :key="ent.plantel_id"
              :label="ent.nombre + ' ' + ent.apellido"
              :value="ent.plantel_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Estado de la Categoría">
          <el-radio-group v-model="formulario.estatus">
            <el-radio-button label="Activa">
              <i class="el-icon-check" /> Activa
            </el-radio-button>
            <el-radio-button label="Inactiva">
              <i class="el-icon-close" /> Inactiva
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
        <el-button @click="mostrarModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="guardando" class="red-btn" @click="guardarCategoria">
          Guardar Cambios
        </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { canEdit } from '@/utils/permission'
import { ElMessage } from 'element-plus'
import { useServerDataRefresh } from '@/composables/useServerDataRefresh'

const loading = ref(false)
const guardando = ref(false)
const categorias = ref([])
const entrenadores = ref([])
const searchQuery = ref('')
const filtroCategoria = ref('')
const filtroEntrenador = ref('')
const filtroEstatus = ref('')

const mostrarModal = ref(false)
const formulario = ref({
  id: null,
  nombre_categoria: '',
  edad_min: 0,
  edad_max: 0,
  entrenador_id: null,
  estatus: 'Activa'
})

const canUserEdit = computed(() => canEdit())

const categoriasFiltradas = computed(() => {
  let result = categorias.value

  if (filtroCategoria.value) {
    result = result.filter(c => c.categoria_id === filtroCategoria.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(c => c.nombre_categoria.toLowerCase().includes(q))
  }
  if (filtroEntrenador.value) {
    result = result.filter(c => c.entrenador_id === filtroEntrenador.value)
  }
  if (filtroEstatus.value) {
    result = result.filter(c => c.estatus === filtroEstatus.value)
  }
  return result
})

const cargarDatos = async () => {
  loading.value = true
  try {
    const [catResponse, entResponse] = await Promise.all([
      request({ url: '/categoria', method: 'get' }),
      request({ url: '/plantel', method: 'get', params: { rol: 'ENTRENADOR' }})
    ])

    categorias.value = Array.isArray(catResponse) ? catResponse : []
    entrenadores.value = Array.isArray(entResponse) ? entResponse : []
  } catch (error) {
    console.error(error)
    ElMessage.error('Error cargando datos')
  } finally {
    loading.value = false
  }
}

const getInitials = (name) => {
  if (!name) return 'C'
  return name.substring(0, 2).toUpperCase()
}

const getEntrenadorName = (id) => {
  if (!id) return 'No Asignado'
  const ent = entrenadores.value.find(e => e.plantel_id === id)
  return ent ? `${ent.nombre} ${ent.apellido}` : 'No Encontrado'
}

const getOcupacion = (cat) => {
  const maxAtletas = 25
  const total = cat.total_atletas || 0
  return Math.min(Math.round((total / maxAtletas) * 100), 100)
}

const editarCategoria = (categoria) => {
  formulario.value = {
    id: categoria.categoria_id,
    nombre_categoria: categoria.nombre_categoria,
    edad_min: categoria.edad_min,
    edad_max: categoria.edad_max,
    entrenador_id: categoria.entrenador_id,
    estatus: categoria.estatus || 'Activa'
  }
  mostrarModal.value = true
}

const guardarCategoria = async () => {
  guardando.value = true
  try {
    await request({
      url: `/categoria/${formulario.value.id}`,
      method: 'put',
      data: {
        entrenador_id: formulario.value.entrenador_id,
        estatus: formulario.value.estatus
      }
    })
    ElMessage.success('Categoría actualizada')
    mostrarModal.value = false
    cargarDatos()
  } catch (error) {
    console.error(error)
    ElMessage.error('Error al guardar')
  } finally {
    guardando.value = false
  }
}

useServerDataRefresh(cargarDatos, {
  isBusy: () => loading.value || guardando.value || mostrarModal.value
})

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
  min-height: calc(100vh - 84px);
}

/* Local Styles */
.control-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.control-item {
  flex: 1;
  min-width: 200px;
}


/* Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.category-card {
  border: 2px solid #cbd5e1;
  border-radius: 16px;
  transition: all 0.3s ease;
  overflow: hidden;
  height: 100%;
  background: var(--color-bg-card);
}

.category-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(30, 41, 59, 0.15);
}

.category-card.inactive-card {
  opacity: 0.7;
  border-color: var(--color-border);
}

.category-card.inactive-card:hover {
  border-color: var(--color-text-muted);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
  position: relative;
  padding: 20px;
  background-color: var(--color-bg-card);
  border-bottom: 1px solid var(--color-bg-body);
  display: flex;
  align-items: center;
  gap: 15px;
}

.category-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 4px 6px rgba(30, 41, 59, 0.2);
}

.inactive-card .category-icon {
  background: linear-gradient(135deg, #64748b 0%, var(--color-border) 100%);
  box-shadow: 0 4px 6px rgba(100, 116, 139, 0.2);
}

.category-title h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: var(--color-text-main);
}

.tags-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-actions {
  margin-left: auto;
}

.card-actions .el-button {
  font-size: 1.2rem;
  color: var(--color-text-muted);
}

.card-actions .el-button:hover {
  color: var(--color-primary);
}

.card-body {
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.info-row .label {
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-row .value {
  font-weight: 600;
  color: var(--color-text-main);
}

.progress-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--color-bg-body);
}

.progress-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-bottom: 8px;
}

.progress-section :deep(.el-progress-bar__outer) {
  background-color: var(--color-bg-hover);
}

.progress-section :deep(.el-progress-bar__inner) {
  background-color: var(--color-primary);
}

/* Modal Styles */
.categoria-info {
  text-align: center;
  padding: 20px;
  background: var(--color-bg-card);
  border-radius: 12px;
  margin-bottom: 20px;
}

.categoria-info h3 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: var(--color-text-main);
}

/* Utilities */
.red-btn {
  background-color: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
}

.red-btn:hover {
  background-color: var(--color-primary-hover) !important;
  border-color: var(--color-primary-hover) !important;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: var(--color-border);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

/* ============================================
   RESPONSIVE STYLES
   ============================================ */

/* Tablets y laptops pequeños */
@media (max-width: 1200px) {
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

/* Tablets */
@media (max-width: 992px) {
  .app-container {
    padding: 15px;
  }

  .page-header {
    padding: 18px;
  }

  .control-row {
    gap: 15px;
  }

  .control-item {
    min-width: 180px;
  }

  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

/* Móviles */
@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }

  .page-header {
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .header-content h1 {
    font-size: 1.2rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .control-row {
    flex-direction: column;
    gap: 12px;
  }

  .control-item {
    width: 100%;
    min-width: auto;
  }

  .control-item label {
    font-size: 0.75rem;
    margin-bottom: 6px;
  }

  .control-item :deep(.el-input__inner),
  .control-item :deep(.el-select .el-input__inner) {
    height: 42px;
    padding: 10px 12px;
    font-size: 0.9rem;
  }

  .categories-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .category-card {
    border-radius: 12px;
  }

  .card-header {
    padding: 15px;
    gap: 12px;
  }

  .category-icon {
    width: 45px;
    height: 45px;
    font-size: 1rem;
  }

  .category-title h3 {
    font-size: 1rem;
  }

  .card-body {
    padding: 15px;
  }

  .info-row {
    font-size: 0.85rem;
  }

  /* Modal responsive */
  :deep(.category-dialog) {
    width: 95% !important;
    max-width: 95vw !important;
    margin: 5vh auto !important;
  }

  .categoria-info {
    padding: 15px;
  }

  .categoria-info h3 {
    font-size: 1.1rem;
  }

  .empty-state {
    padding: 40px 20px;
  }

  .empty-state i {
    font-size: 2.5rem;
  }
}

/* Móviles pequeños */
@media (max-width: 480px) {
  .app-container {
    padding: 8px;
  }

  .page-header {
    padding: 12px;
  }

  .header-content h1 {
    font-size: 1.05rem;
  }

  .subtitle {
    font-size: 0.75rem;
  }

  .control-card :deep(.el-card__body) {
    padding: 10px;
  }

  .card-header {
    padding: 12px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .category-icon {
    width: 40px;
    height: 40px;
    font-size: 0.9rem;
  }

  .category-title {
    flex: 1;
    min-width: 0;
  }

  .category-title h3 {
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tags-row {
    gap: 4px;
  }

  .tags-row .el-tag {
    font-size: 10px;
    padding: 0 6px;
    height: 20px;
    line-height: 18px;
  }

  .card-body {
    padding: 12px;
  }

  .info-row {
    font-size: 0.8rem;
    flex-direction: column;
    gap: 3px;
    margin-bottom: 10px;
  }

  .info-row .label {
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .info-row .value {
    color: var(--color-text-main);
  }
}

/* Móviles muy pequeños */
@media (max-width: 320px) {
  .app-container {
    padding: 5px;
  }

  .page-header {
    padding: 10px;
  }

  .header-content h1 {
    font-size: 0.95rem;
  }

  .category-icon {
    width: 35px;
    height: 35px;
    font-size: 0.8rem;
  }

  .category-title h3 {
    font-size: 0.85rem;
  }
}
</style>

