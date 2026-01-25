import request, { publicService } from '@/utils/request'

// Obtener lista de preguntas disponibles
export function getPreguntasDisponibles() {
  return publicService({
    url: '/preguntas-seguridad/disponibles',
    method: 'get'
  })
}

// Guardar preguntas de seguridad (requiere autenticación)
export function guardarPreguntas(data) {
  return request({
    url: '/preguntas-seguridad/guardar',
    method: 'post',
    data
  })
}

// Obtener preguntas de un usuario por email (público, para recuperación)
export function obtenerPreguntasPorEmail(email) {
  return publicService({
    url: '/preguntas-seguridad/por-email',
    method: 'get',
    params: { email }
  })
}

// Verificar solo las respuestas (sin cambiar contraseña)
export function verificarSoloRespuestas(data) {
  return publicService({
    url: '/preguntas-seguridad/verificar-respuestas',
    method: 'post',
    data
  })
}

// Verificar respuestas y cambiar contraseña (público, para recuperación)
export function verificarYCambiarPassword(data) {
  return publicService({
    url: '/preguntas-seguridad/verificar-y-cambiar',
    method: 'post',
    data
  })
}

// Verificar si un usuario tiene preguntas configuradas
export function tienePreguntas(usuario_id) {
  return request({
    url: `/preguntas-seguridad/tiene/${usuario_id}`,
    method: 'get'
  })
}
// Obtener preguntas y respuestas de un usuario (para edición, protegido)
export function obtenerPreguntasRespuestasUsuario(usuario_id) {
  return request({
    url: `/preguntas-seguridad/usuario/${usuario_id}`,
    method: 'get'
  })
}
