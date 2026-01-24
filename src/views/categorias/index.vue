<template>
  <div class="app-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-trophy" /> Gestión de Categorías</h1>
          <p class="subtitle">Administración de niveles y equipos</p>
        </div>
        <div class="header-actions">
          <el-button
            v-if="canUserEdit"
            type="primary"
            icon="el-icon-plus"
            class="red-btn"
            @click="nuevaCategoria"
          >
            Nueva Categoría
          </el-button>
        </div>
      </div>
    </div>

    <!-- Controls & Filters -->
    <el-card shadow="hover" class="control-card">
      <div class="control-row">
        <div class="control-item search-box">
          <label>Buscar</label>
          <el-input
            v-model="searchQuery"
            placeholder="Nombre de categoría..."
            clearable
          />
        </div>

        <div class="control-item filter-box">
          <label>Filtrar por Entrenador</label>
          <el-select v-model="filtroEntrenador" placeholder="Todos los entrenadores" clearable filterable>
            <el-option
              v-for="ent in entrenadores"
              :key="ent.plantel_id"
              :label="ent.nombre + ' ' + ent.apellido"
              :value="ent.plantel_id"
            />
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
        shadow="hover"
        :body-style="{ padding: '0px' }"
      >
        <div class="card-header">
          <div class="category-icon">
            <span>{{ getInitials(cat.nombre_categoria) }}</span>
          </div>
          <div class="category-title">
            <h3>{{ cat.nombre_categoria }}</h3>
            <el-tag size="small" effect="dark" type="danger" class="age-tag">
              {{ cat.edad_min }} - {{ cat.edad_max }} Años
            </el-tag>
          </div>
          <div class="card-actions">
            <el-dropdown trigger="click" @command="handleCommand($event, cat)">
              <span class="el-dropdown-link">
                <i class="el-icon-more transform-icon" />
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="edit" icon="el-icon-edit" :disabled="!canUserEdit">Editar</el-dropdown-item>
                <el-dropdown-item command="delete" icon="el-icon-delete" :disabled="!canUserEdit" style="color: #F56C6C">Eliminar</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
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
            <el-progress :percentage="50" :format="() => ''" :color="'#E51D22'" />
          </div>
        </div>
      </el-card>
    </div>

    <!-- Modal Form -->
    <el-dialog
      :title="modoEdicion ? 'Editar Categoría' : 'Nueva Categoría'"
      :visible.sync="mostrarModal"
      width="500px"
      custom-class="category-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="form" :model="formulario" label-position="top" :rules="rules">
        <el-form-item label="Nombre de Categoría" prop="nombre_categoria">
          <el-input v-model="formulario.nombre_categoria" placeholder="Ej: Sub-12" />
        </el-form-item>

        <div class="form-row-2">
          <el-form-item label="Edad Mínima" prop="edad_min">
            <el-input-number v-model="formulario.edad_min" :min="4" :max="20" style="width: 100%" />
          </el-form-item>
          <el-form-item label="Edad Máxima" prop="edad_max">
            <el-input-number v-model="formulario.edad_max" :min="4" :max="20" style="width: 100%" />
          </el-form-item>
        </div>

        <el-form-item label="Entrenador Responsable" prop="entrenador_id">
          <el-select v-model="formulario.entrenador_id" placeholder="Seleccionar" style="width: 100%" filterable>
            <el-option
              v-for="ent in entrenadores"
              :key="ent.plantel_id"
              :label="ent.nombre + ' ' + ent.apellido"
              :value="ent.plantel_id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="mostrarModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="guardando" class="red-btn" @click="guardarCategoria">
          {{ modoEdicion ? 'Actualizar' : 'Crear' }}
        </el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import request from '@/utils/request'
import { canEdit } from '@/utils/permission'

export default {
  name: 'CategoriasIndex',
  data() {
    return {
      loading: false,
      guardando: false,
      categorias: [],
      entrenadores: [],
      searchQuery: '',
      filtroEntrenador: '',

      // Modal state
      mostrarModal: false,
      modoEdicion: false,
      formulario: {
        id: null,
        nombre_categoria: '',
        edad_min: 5,
        edad_max: 7,
        entrenador_id: ''
      },
      rules: {
        nombre_categoria: [{ required: true, message: 'Requerido', trigger: 'blur' }],
        entrenador_id: [{ required: true, message: 'Requerido', trigger: 'change' }]
      }
    }
  },
  computed: {
    canUserEdit() {
      return canEdit()
    },
    categoriasFiltradas() {
      let result = this.categorias

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        result = result.filter(c => c.nombre_categoria.toLowerCase().includes(q))
      }

      if (this.filtroEntrenador) {
        result = result.filter(c => c.entrenador_id === this.filtroEntrenador)
      }

      return result
    }
  },
  created() {
    this.cargarDatos()
  },
  methods: {
    async cargarDatos() {
      this.loading = true
      try {
        const [catResponse, entResponse] = await Promise.all([
          request({ url: '/categoria', method: 'get' }),
          request({ url: '/plantel', method: 'get', params: { rol: 'ENTRENADOR' }})
        ])

        this.categorias = Array.isArray(catResponse) ? catResponse : []
        this.entrenadores = Array.isArray(entResponse) ? entResponse : []
      } catch (error) {
        console.error(error)
        this.$message.error('Error cargando datos')
      } finally {
        this.loading = false
      }
    },
    getInitials(name) {
      if (!name) return 'C'
      return name.substring(0, 2).toUpperCase()
    },
    getEntrenadorName(id) {
      if (!id) return 'No Asignado'
      const ent = this.entrenadores.find(e => e.plantel_id === id)
      return ent ? `${ent.nombre} ${ent.apellido}` : 'No Encontrado'
    },
    nuevaCategoria() {
      this.formulario = {
        id: null,
        nombre_categoria: '',
        edad_min: 5,
        edad_max: 7,
        entrenador_id: ''
      }
      this.modoEdicion = false
      this.mostrarModal = true
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate()
      })
    },
    handleCommand(command, categoria) {
      if (command === 'edit') {
        this.formulario = {
          id: categoria.categoria_id,
          nombre_categoria: categoria.nombre_categoria,
          edad_min: categoria.edad_min,
          edad_max: categoria.edad_max,
          entrenador_id: categoria.entrenador_id
        }
        this.modoEdicion = true
        this.mostrarModal = true
      } else if (command === 'delete') {
        this.confirmarEliminacion(categoria)
      }
    },
    async guardarCategoria() {
      this.$refs.form.validate(async(valid) => {
        if (valid) {
          if (this.formulario.edad_min >= this.formulario.edad_max) {
            this.$message.warning('La edad mínima debe ser menor que la máxima')
            return
          }

          this.guardando = true
          try {
            if (this.modoEdicion) {
              await request({
                url: `/categoria/${this.formulario.id}`,
                method: 'put',
                data: this.formulario
              })
              this.$message.success('Categoría actualizada')
            } else {
              await request({
                url: '/categoria',
                method: 'post',
                data: this.formulario
              })
              this.$message.success('Categoría creada')
            }
            this.mostrarModal = false
            this.cargarDatos()
          } catch (error) {
            console.error(error)
            this.$message.error('Error al guardar')
          } finally {
            this.guardando = false
          }
        }
      })
    },
    async confirmarEliminacion(categoria) {
      try {
        await this.$confirm(
          `¿Eliminar categoría "${categoria.nombre_categoria}"?`,
          'Confirmar',
          { type: 'warning', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' }
        )

        await request({
          url: `/categoria/${categoria.categoria_id}`,
          method: 'delete'
        })

        this.$message.success('Eliminado correctamente')
        this.cargarDatos()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('Error al eliminar')
        }
      }
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}

/* Header Red Style */
.page-header {
  background: linear-gradient(135deg, #E51D22, #c41a1d);
  color: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

/* Header Button - Modern Executive Style */
.header-actions ::v-deep .el-button--primary,
.header-actions .red-btn {
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

.header-actions ::v-deep .el-button--primary:hover,
.header-actions .red-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.header-actions ::v-deep .el-button--primary:active,
.header-actions .red-btn:active {
  transform: translateY(0);
}

/* Controls */
.control-card {
  margin-bottom: 25px;
  border: none;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.control-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.control-item {
  flex: 1;
  min-width: 250px;
}

.control-item label {
  display: block;
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 700;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Modern Input & Select Styles for Controls */
.control-item ::v-deep .el-input__inner,
.control-item ::v-deep .el-select .el-input__inner {
  background: #fff !important;
  border: 2px solid #64748b !important;
  border-radius: 12px;
  padding: 14px 16px;
  height: 48px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.control-item ::v-deep .el-input__inner:hover,
.control-item ::v-deep .el-select .el-input__inner:hover {
  border-color: #E51D22 !important;
}

.control-item ::v-deep .el-input__inner:focus,
.control-item ::v-deep .el-select .el-input.is-focus .el-input__inner {
  border-color: #E51D22 !important;
  box-shadow: 0 0 0 4px rgba(229, 29, 34, 0.12);
}

.control-item ::v-deep .el-input__inner::placeholder {
  color: #64748b !important;
  font-weight: 500;
}

.control-item ::v-deep .el-input__prefix {
  left: 12px;
  color: #64748b;
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
  background: #fff;
}

.category-card:hover {
  border-color: #E51D22;
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(229, 29, 34, 0.15);
}

.card-header {
  position: relative;
  padding: 20px;
  background-color: #fff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 15px;
}

.category-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #E51D22 0%, #ff4d4f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 4px 6px rgba(229, 29, 34, 0.2);
}

.category-title h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #1e293b;
}

.card-actions {
  margin-left: auto;
}

.transform-icon {
  font-size: 1.2rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 5px;
}

.transform-icon:hover {
  color: #1e293b;
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
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-row .value {
  font-weight: 600;
  color: #1e293b;
}

.progress-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f1f5f9;
}

.progress-label {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 8px;
}

/* Utilities */
.red-btn {
  background-color: #E51D22 !important;
  border-color: #E51D22 !important;
}

.red-btn:hover {
  background-color: #cf1a1e !important;
  border-color: #cf1a1e !important;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .page-header {
    padding: 15px;
  }

  .control-row {
    flex-direction: column;
    gap: 15px;
  }

  .control-item {
    width: 100%;
  }
}
</style>
