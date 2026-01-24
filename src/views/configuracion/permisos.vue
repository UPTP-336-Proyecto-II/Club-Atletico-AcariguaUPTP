<template>
  <div class="roles-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-lock" /> Gestión de Roles</h1>
          <p class="subtitle">Club Atlético Deportivo Acarigua</p>
        </div>
        <el-button type="primary" icon="el-icon-plus" @click="openRolModal(false)">
          Agregar Rol
        </el-button>
      </div>
    </div>

    <!-- Content -->
    <el-card shadow="hover" class="roles-card">
      <el-table
        v-loading="loading"
        :data="roles"
        style="width: 100%"
        stripe
        border
      >
        <el-table-column prop="rol_id" label="ID" width="80" align="center" />
        <el-table-column prop="nombre_rol" label="Nombre del Rol" min-width="150">
          <template slot-scope="{ row }">
            <div class="rol-name">
              <i class="el-icon-s-custom" />
              <span>{{ row.nombre_rol }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="descripcion" label="Descripción" min-width="300" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span>{{ row.descripcion || 'Sin descripción' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="usuarios_count" label="Usuarios" width="180" align="center">
          <template slot-scope="{ row }">
            <div class="usuarios-stats">
              <el-tag :type="row.usuarios_count > 0 ? 'primary' : 'info'" size="small">
                {{ row.usuarios_count }} Total
              </el-tag>
              <div v-if="row.usuarios_count > 0" class="usuarios-breakdown">
                <span class="stat-activo"><i class="el-icon-check" /> {{ row.usuarios_activos || 0 }}</span>
                <span class="stat-inactivo"><i class="el-icon-close" /> {{ row.usuarios_inactivos || 0 }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="fecha_creacion" label="Fecha Creación" width="180" align="center">
          <template slot-scope="{ row }">
            {{ formatDate(row.fecha_creacion) }}
          </template>
        </el-table-column>
        <el-table-column label="Acciones" width="160" align="center">
          <template slot-scope="{ row }">
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-edit"
              circle
              @click="handleEdit(row)"
            />
            <el-button
              type="danger"
              size="mini"
              icon="el-icon-delete"
              circle
              :disabled="row.usuarios_count > 0"
              @click="handleDelete(row)"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- Info Card -->
      <div class="info-section">
        <el-alert
          title="Información sobre Roles"
          type="info"
          :closable="false"
          show-icon
        >
          <template slot="default">
            <p>Los roles con usuarios asignados no pueden ser eliminados. Primero debe reasignar los usuarios a otro rol.</p>
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- Modal Rol -->
    <el-dialog
      :title="isEditing ? 'Editar Rol' : 'Agregar Nuevo Rol'"
      :visible.sync="showRolModal"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="rolForm" :model="rolForm" :rules="rolRules" label-position="top">
        <el-form-item label="Nombre del Rol" prop="nombre_rol">
          <el-input v-model="rolForm.nombre_rol" placeholder="Ej: administrador, entrenador" />
        </el-form-item>
        <el-form-item label="Descripción" prop="descripcion">
          <el-input
            v-model="rolForm.descripcion"
            type="textarea"
            :rows="4"
            placeholder="Describe los permisos y responsabilidades de este rol..."
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showRolModal = false">Cancelar</el-button>
        <el-button type="primary" :loading="saving" @click="saveRol">
          {{ isEditing ? 'Actualizar' : 'Guardar' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getRoles, createRol, updateRol, deleteRol } from '@/api/roles'

export default {
  name: 'GestionRoles',
  data() {
    return {
      roles: [],
      loading: false,
      saving: false,
      showRolModal: false,
      isEditing: false,
      currentRolId: null,
      rolForm: {
        nombre_rol: '',
        descripcion: ''
      },
      rolRules: {
        nombre_rol: [
          { required: true, message: 'El nombre del rol es requerido', trigger: 'blur' },
          { min: 3, message: 'El nombre debe tener al menos 3 caracteres', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.loadRoles()
  },
  methods: {
    async loadRoles() {
      this.loading = true
      try {
        const response = await getRoles()
        this.roles = Array.isArray(response) ? response : []
      } catch (error) {
        console.error('Error cargando roles:', error)
        this.$message.error('Error al cargar roles')
      } finally {
        this.loading = false
      }
    },
    openRolModal(isEdit) {
      this.isEditing = isEdit
      if (!isEdit) {
        this.resetForm()
      }
      this.showRolModal = true
    },
    handleEdit(row) {
      this.currentRolId = row.rol_id
      this.rolForm = {
        nombre_rol: row.nombre_rol,
        descripcion: row.descripcion || ''
      }
      this.openRolModal(true)
    },
    async handleDelete(row) {
      if (row.usuarios_count > 0) {
        this.$message.warning('No se puede eliminar un rol con usuarios asignados')
        return
      }

      try {
        await this.$confirm(
          `¿Está seguro de eliminar el rol "${row.nombre_rol}"?`,
          'Confirmar Eliminación',
          {
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            type: 'warning'
          }
        )

        await deleteRol(row.rol_id)
        this.$message.success('Rol eliminado exitosamente')
        await this.loadRoles()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error eliminando rol:', error)
          this.$message.error(error.response?.data?.error || 'Error al eliminar rol')
        }
      }
    },
    async saveRol() {
      this.$refs.rolForm.validate(async(valid) => {
        if (!valid) return

        this.saving = true
        try {
          if (this.isEditing) {
            await updateRol(this.currentRolId, this.rolForm)
            this.$message.success('Rol actualizado exitosamente')
          } else {
            await createRol(this.rolForm)
            this.$message.success('Rol creado exitosamente')
          }

          this.showRolModal = false
          await this.loadRoles()
        } catch (error) {
          console.error('Error guardando rol:', error)
          this.$message.error(error.response?.data?.error || 'Error al guardar rol')
        } finally {
          this.saving = false
        }
      })
    },
    resetForm() {
      this.rolForm = {
        nombre_rol: '',
        descripcion: ''
      }
      this.currentRolId = null
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES')
    }
  }
}
</script>

<style scoped>
.roles-container {
  padding: 20px;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #E51D22, #c41a1d);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
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

.roles-card {
  border-radius: 10px;
}

.rol-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rol-name i {
  color: #E51D22;
  font-size: 1.1rem;
}

.info-section {
  margin-top: 20px;
}

::v-deep .el-button--primary {
  background-color: #E51D22;
  border-color: #E51D22;
}

::v-deep .el-button--primary:hover,
::v-deep .el-button--primary:focus {
  background-color: #c41a1d;
  border-color: #c41a1d;
}

::v-deep .el-tag--primary {
  background-color: rgba(229, 29, 34, 0.1);
  border-color: rgba(229, 29, 34, 0.2);
  color: #E51D22;
}

::v-deep .el-table th {
  background-color: #f8fafc;
  color: #2c3e50;
  font-weight: 600;
}

::v-deep .el-table .el-button--primary.is-circle {
  background-color: #E51D22;
  border-color: #E51D22;
}

::v-deep .el-table .el-button--primary.is-circle:hover {
  background-color: #c41a1d;
  border-color: #c41a1d;
}
::v-deep .el-table .el-table__fixed-right::before,
::v-deep .el-table .el-table__fixed::before {
  display: none !important;
}

::v-deep .el-table__fixed-right {
  box-shadow: none !important;
}

::v-deep .el-table--border th.gutter:last-of-type {
  border-bottom: 1px solid #dfe6ec !important;
}
::v-deep .el-table td,
::v-deep .el-table th {
  padding: 12px 0 !important;
  height: 60px;
}

::v-deep .el-table .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 24px;
}

.usuarios-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.usuarios-breakdown {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
}

.stat-activo {
  color: #67C23A;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-inactivo {
  color: #909399;
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
