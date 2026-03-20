import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import store from '../store'
import { getToken } from '@/utils/auth'

// Crear instancia de axios
const service = axios.create({
  baseURL: 'http://localhost:3000/api', // Tu API de Node.js
  timeout: 5000 // 5 segundos
})

// Interceptor de request
service.interceptors.request.use(
  config => {
    // Agregar token si existe
    if (store.getters.token) {
      config.headers['Authorization'] = 'Bearer ' + getToken()
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// Interceptor de response
service.interceptors.response.use(
  response => {
    const res = response.data

    // Si la API devuelve un error (200 = OK, 201 = Created son éxitos)
    if (response.status !== 200 && response.status !== 201) {
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      // Token expirado o inválido
      if (response.status === 401) {
        ElMessageBox.confirm(
          'Tu sesión ha expirado, puedes permanecer en esta página o volver a iniciar sesión',
          'Confirmar cierre de sesión',
          {
            confirmButtonText: 'Iniciar sesión nuevamente',
            cancelButtonText: 'Cancelar',
            type: 'warning'
          }
        ).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error) // for debug
    let message = error.message

    // Personalizar mensaje para error 401 (No autorizado)
    if (error.response && error.response.status === 401) {
      if (error.response.data && error.response.data.error) {
        message = error.response.data.error
      } else {
        message = 'Usuario o contraseña incorrectos'
      }
    } else if (error.response && error.response.data && error.response.data.error) {
      message = error.response.data.error
    }

    ElMessage({
      message: message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

// Instancia pública (sin token) para endpoints de recuperación de contraseña
const publicService = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000
})

export default service
export { publicService }
