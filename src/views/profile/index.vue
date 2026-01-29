<template>
  <div class="user-profile-container">
    <!-- Header simIlar a Atletas -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1><i class="el-icon-user-solid" /> Mi Perfil</h1>
          <p class="subtitle">Gestión de cuenta personal</p>
        </div>
      </div>
    </div>

    <div v-if="user" class="main-content">
      <el-row :gutter="20">
        <!-- Sidebar Card (Avatar e Info Básica) -->
        <el-col :span="6" :xs="24">
          <el-card shadow="hover" class="profile-card">
            <div slot="header" class="clearfix">
              <span>Resumen</span>
            </div>
            <div class="user-profile">
              <div class="user-avatar box-center">
                <el-upload
                  class="avatar-uploader"
                  :action="backendUrl + '/api/usuarios/profile/avatar'"
                  :headers="headers"
                  :show-file-list="false"
                  :on-success="handleAvatarSuccess"
                  :before-upload="beforeAvatarUpload"
                  name="avatar"
                >
                  <!-- Mostramos la imagen del usuario (reactiva) o un placeholder -->
                  <img v-if="user.avatar" :src="user.avatar" class="img-circle">
                  <i v-else class="el-icon-user-solid img-circle placeholder-avatar" />

                  <div class="avatar-mask">
                    <i class="el-icon-camera"><br>Cambiar Foto</i>
                  </div>
                </el-upload>
              </div>
              <div class="box-center info-section">
                <div class="user-name text-center">{{ user.name }}</div>
                <div class="user-role text-center text-muted">{{ user.role | uppercaseFirst }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- Main Card (Tabs de Edición) -->
        <el-col :span="18" :xs="24">
          <el-card shadow="hover">
            <el-tabs v-model="activeTab">
              <el-tab-pane label="Datos de Cuenta" name="account">
                <el-form ref="form" :model="form" :rules="rules" label-width="120px" label-position="top">

                  <div class="form-grid">
                    <!-- Sección Correo -->
                    <div class="form-item full-width">
                      <div class="section-title">Información de Contacto</div>
                      <el-form-item label="Correo Electrónico" prop="email">
                        <el-input v-model="form.email" prefix-icon="el-icon-message" />
                      </el-form-item>
                    </div>

                    <!-- Sección Contraseña -->
                    <div class="form-item full-width" style="margin-top: 20px;">
                      <div class="section-title">Cambio de Contraseña</div>
                      <el-alert
                        title="Para guardar cualquier cambio, debes ingresar tu contraseña actual."
                        type="info"
                        show-icon
                        :closable="false"
                        style="margin-bottom: 20px;"
                      />
                    </div>

                    <div class="form-item">
                      <el-form-item label="Nueva Contraseña" prop="newPassword">
                        <el-input v-model="form.newPassword" type="password" placeholder="Solo si deseas cambiarla" show-password />
                      </el-form-item>
                    </div>

                    <div class="form-item">
                      <el-form-item label="Confirmar Nueva Contraseña" prop="confirmPassword">
                        <el-input v-model="form.confirmPassword" type="password" placeholder="Repite la nueva contraseña" show-password />
                      </el-form-item>
                    </div>

                    <div class="form-item full-width">
                      <el-divider />
                    </div>

                    <div class="form-item full-width">
                      <el-form-item label="Contraseña Actual (Requerido)" prop="password">
                        <el-input v-model="form.password" type="password" placeholder="Tu contraseña actual para confirmar" show-password />
                      </el-form-item>
                    </div>

                    <div class="form-item full-width actions-row">
                      <el-button type="primary" :loading="loading" icon="el-icon-check" @click="submit">
                        Actualizar Perfil
                      </el-button>
                    </div>
                  </div>

                </el-form>
              </el-tab-pane>

              <!-- Tab de Seguridad (Preguntas) -->
              <el-tab-pane label="Preguntas de Seguridad" name="security">
                <security-questions />
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import request from '@/utils/request'
import SecurityQuestions from './components/SecurityQuestions'

export default {
  name: 'Profile',
  components: { SecurityQuestions },
  data() {
    const validateConfirm = (rule, value, callback) => {
      if (this.form.newPassword && value !== this.form.newPassword) {
        callback(new Error('Las contraseñas no coinciden'))
      } else {
        callback()
      }
    }
    return {
      user: {}, // Objeto local para manejar la UI inmediatamente
      activeTab: 'account',
      loading: false,
      backendUrl: 'http://localhost:3000',
      headers: {
        Authorization: 'Bearer ' // Se completa en created
      },
      form: {
        email: '',
        newPassword: '',
        confirmPassword: '',
        password: '',
        foto: ''
      },
      rules: {
        email: [
          { required: true, message: 'El correo es requerido', trigger: 'blur' },
          { type: 'email', message: 'Ingrese un correo válido', trigger: 'blur' }
        ],
        password: [
          { required: true, message: 'La contraseña actual es requerida', trigger: 'blur' }
        ],
        confirmPassword: [
          { validator: validateConfirm, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters([
      'name',
      'avatar',
      'roles',
      'token'
    ])
  },
  created() {
    // Inicializar headers
    this.headers.Authorization = 'Bearer ' + this.$store.getters.token
    this.getUser()
  },
  methods: {
    getUser() {
      // Mapear datos del store a objeto local
      this.user = {
        name: this.name, // En este sistema name=email
        role: this.roles.join(' | '),
        email: this.name,
        avatar: this.avatar || ''
      }

      // Si el avatar viene del backend con path relativo (ej: uploads/...), concatenar backendUrl
      // PERO el componente el-upload devuelve solo el filename.
      // Si ya es una URL completa (ej: blob:...), dejarla.
      // Si es un filename simple, concatenar.

      this.form.email = this.user.email
      this.form.foto = ''
    },
    async submit() {
      this.$refs.form.validate(async valid => {
        if (valid) {
          this.loading = true
          try {
            await request({
              url: '/usuarios/profile',
              method: 'put',
              data: this.form
            })

            this.$message({
              message: 'Perfil actualizado exitosamente',
              type: 'success',
              duration: 3000
            })

            // Limpiar campos sensibles
            this.form.password = ''
            this.form.newPassword = ''
            this.form.confirmPassword = ''

            // Aquí podrías disparar una acción para recargar info del usuario en vuex si fuera necesario
          } catch (error) {
            console.error(error)
          } finally {
            this.loading = false
          }
        }
      })
    },
    handleAvatarSuccess(res, file) {
      if (res.filename) {
        // Guardamos el filename en el form para enviarlo al guardar perfil
        this.form.foto = res.filename

        // Actualizamos visualmente el avatar INMEDIATAMENTE con el blob local para feedback rápido
        this.user.avatar = URL.createObjectURL(file.raw)

        this.$message.success('Foto cargada. Recuerda pulsar "Actualizar Perfil" para guardar permanentemente.')
      }
    },
    beforeAvatarUpload(file) {
      const isValidType = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isValidType) {
        this.$message.error('La imagen debe ser JPG o PNG!')
      }
      if (!isLt2M) {
        this.$message.error('La imagen excede los 2MB!')
      }
      return isValidType && isLt2M
    }
  }
}
</script>

<style lang="scss" scoped>
.user-profile-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.page-header {
  background: #fff;
  padding: 20px;
  margin: -20px -20px 20px -20px;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      margin: 0;
      font-size: 20px;
      color: #303133;

      i {
        margin-right: 10px;
        color: #E51D22;
      }
    }

    .subtitle {
      margin: 5px 0 0 0;
      color: #909399;
      font-size: 14px;
    }
  }
}

.profile-card {
  margin-bottom: 20px;
}

.box-center {
  margin: 0 auto;
  display: table;
}

.text-muted {
  color: #777;
}

.user-profile {
  .user-name {
    font-weight: bold;
    font-size: 1.2rem;
    margin-bottom: 5px;
  }

  .user-role {
    font-size: 14px;
    background: #f4f4f5;
    padding: 2px 10px;
    border-radius: 12px;
    display: inline-block;
  }

  .info-section {
    margin-top: 20px;
  }
}

.user-avatar {
  position: relative;
  cursor: pointer;
  width: 150px;
  height: 150px;
  margin-bottom: 20px;

  /* IMPORTANTE: Mantener círculo perfecto */
  .img-circle {
    border-radius: 50%;
    width: 100%;
    height: 100%;
    object-fit: cover; /* Evita ovalamiento */
    border: 4px solid #fff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .placeholder-avatar {
    font-size: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #C0C4CC;
    background: #F2F6FC;
  }

  .avatar-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s;
    color: white;
    font-size: 1rem;
    text-align: center;

    i {
      font-size: 24px;
      margin-bottom: 5px;
    }
  }

  &:hover .avatar-mask {
    opacity: 1;
    cursor: pointer;
  }
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
}

/* Form Grid Styling similar a Atletas */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Dos columnas */
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .form-item {
    &.full-width {
      grid-column: 1 / -1;
    }

    &.actions-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}
</style>
