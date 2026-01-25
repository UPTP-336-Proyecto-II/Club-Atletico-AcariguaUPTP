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
  background-color: #f0f2f5;
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

/* Header Button */
.header-content ::v-deep > .el-button--primary {
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

.header-content ::v-deep > .el-button--primary:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* Roles Card Container */
.roles-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); /* Card shadow */
  border: 2px solid #e2e8f0;
}

/* Table Styles - Matching Athlete List */
::v-deep .el-table {
  border-radius: 12px;
  overflow: hidden;
}

/* Table Header */
::v-deep .el-table__header-wrapper th {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9) !important;
  color: #1e293b !important;
  font-weight: 700 !important;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 3px solid #E51D22 !important; /* Red Underline */
  padding: 16px 12px !important;
  white-space: nowrap;
}

/* Table Rows */
::v-deep .el-table__body tr {
  transition: all 0.3s ease;
}

::v-deep .el-table__body tr td {
  padding: 16px 12px !important;
  border-bottom: 2px solid #94a3b8 !important; /* Visible borders */
  color: #1e293b;
  font-weight: 500;
}

/* Hover Effect */
::v-deep .el-table__body tr:hover > td {
  background: linear-gradient(135deg, #fff5f5, #fff) !important;
  border-bottom-color: #E51D22 !important;
}

::v-deep .el-table--striped .el-table__body tr.el-table__row--striped td {
  background: #f8fafc !important;
}

::v-deep .el-table--striped .el-table__body tr.el-table__row--striped:hover > td {
  background: linear-gradient(135deg, #fff5f5, #fff) !important;
}

/* Rol Name Cell */
.rol-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rol-name i {
  color: #E51D22;
  font-size: 1.2rem;
  background: #fff1f0;
  padding: 8px;
  border-radius: 8px;
}

.rol-name span {
  font-weight: 700;
  font-size: 0.95rem;
}

/* Tag Styles */
::v-deep .el-tag--primary {
  background-color: #f0f9eb;
  border-color: #e1f3d8;
  color: #67C23A; /* Green for active/count */
  font-weight: 600;
}

::v-deep .el-tag--info {
  background-color: #f4f4f5;
  border-color: #e9e9eb;
  color: #909399;
}

/* Action Buttons (Blue/Red Circles) */
::v-deep .el-table .el-button--primary.is-circle {
  background-color: #409EFF;
  border-color: #409EFF;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

::v-deep .el-table .el-button--primary.is-circle:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-2px);
}

::v-deep .el-table .el-button--danger.is-circle {
  background-color: #F56C6C;
  border-color: #F56C6C;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);
}

::v-deep .el-table .el-button--danger.is-circle:hover {
  background-color: #f78989;
  border-color: #f78989;
  transform: translateY(-2px);
}

/* Info Section */
.info-section {
  margin-top: 20px;
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
