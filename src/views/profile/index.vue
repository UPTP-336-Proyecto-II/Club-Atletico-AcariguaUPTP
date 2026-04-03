<template>
  <div class="user-profile-container">
    <!-- Header simIlar a Atletas -->
    <div class="premium-header">
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
                <div class="user-role text-center text-muted">{{ uppercaseFirst(user.role) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- Main Card (Tabs de Edición) -->
        <el-col :span="18" :xs="24">
          <el-card shadow="hover">
            <el-tabs v-model="activeTab">
              <el-tab-pane label="Datos de Cuenta" name="account">
                <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" label-position="top">

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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import request from '@/utils/request'
import SecurityQuestions from './components/SecurityQuestions.vue'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'Profile'
})

const store = useStore()

const user = ref({})
const activeTab = ref('account')
const loading = ref(false)
const backendUrl = ref('http://localhost:3000')

const headers = ref({
  Authorization: 'Bearer ' 
})

const formRef = ref(null)

const form = ref({
  email: '',
  newPassword: '',
  confirmPassword: '',
  password: '',
  foto: ''
})

const uppercaseFirst = (string) => {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const validateConfirm = (rule, value, callback) => {
  if (form.value.newPassword && value !== form.value.newPassword) {
    callback(new Error('Las contraseñas no coinciden'))
  } else {
    callback()
  }
}

const rules = {
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

const name = computed(() => store.getters.name)
const avatar = computed(() => store.getters.avatar)
const roles = computed(() => store.getters.roles)
const token = computed(() => store.getters.token)

const getUser = () => {
  user.value = {
    name: name.value,
    role: roles.value.join(' | '),
    email: name.value,
    avatar: avatar.value || ''
  }

  form.value.email = user.value.email
  form.value.foto = ''
}

const submit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true
      try {
        await request({
          url: '/usuarios/profile',
          method: 'put',
          data: form.value
        })

        ElMessage({
          message: 'Perfil actualizado exitosamente',
          type: 'success',
          duration: 3000
        })

        form.value.password = ''
        form.value.newPassword = ''
        form.value.confirmPassword = ''

      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

const handleAvatarSuccess = (res, file) => {
  if (res.filename) {
    form.value.foto = res.filename
    user.value.avatar = URL.createObjectURL(file.raw)
    ElMessage.success('Foto cargada. Recuerda pulsar "Actualizar Perfil" para guardar permanentemente.')
  }
}

const beforeAvatarUpload = (file) => {
  const isValidType = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isValidType) {
    ElMessage.error('La imagen debe ser JPG o PNG!')
  }
  if (!isLt2M) {
    ElMessage.error('La imagen excede los 2MB!')
  }
  return isValidType && isLt2M
}

onMounted(() => {
  headers.value.Authorization = 'Bearer ' + token.value
  getUser()
})
</script>

<style lang="scss" scoped>
.user-profile-container {
  padding: 20px;
}

/* Local UI Adjustments */
.header-content h1 {
  margin: 0;
}

.profile-card {
  margin-bottom: 20px;
}

.box-center {
  margin: 0 auto;
  display: table;
}

.text-muted {
  color: var(--color-text-muted);
}

.user-profile {
  .user-name {
    font-weight: bold;
    font-size: 1.2rem;
    margin-bottom: 5px;
  }

  .user-role {
    font-size: 14px;
    background: var(--color-bg-body);
    color: var(--color-text-muted);
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
  color: var(--color-text-main);
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
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
