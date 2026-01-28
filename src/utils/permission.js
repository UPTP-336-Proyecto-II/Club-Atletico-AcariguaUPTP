import store from '@/store'

/**
 * @param {Array} value
 * @returns {Boolean}
 * @example see @/views/permission/directive.vue
 */
export default function checkPermission(value) {
  if (value && value instanceof Array && value.length > 0) {
    const roles = store.getters && store.getters.roles
    const permissionRoles = value

    const hasPermission = roles.some(role => {
      return permissionRoles.includes(role)
    })
    return hasPermission
  } else {
    console.error(`need roles! Like v-permission="['admin','editor']"`)
    return false
  }
}

/**
 * Verificar si el usuario tiene los roles especificados
 * @param {Array} roles - Roles requeridos
 * @returns {Boolean}
 */
export function hasRole(roles) {
  if (!roles || roles.length === 0) return true
  const userRoles = store.getters?.roles || []
  return roles.some(role => userRoles.includes(role))
}

/**
 * Verificar si el usuario puede editar (no está en modo solo lectura)
 * @returns {Boolean}
 */
export function canEdit() {
  const userRoles = store.getters?.roles || []
  // Entrenador y médico solo pueden ver, no editar
  return !userRoles.includes('entrenador') && !userRoles.includes('medico')
}

/**
 * Verificar si el usuario es personal médico
 * @returns {Boolean}
 */
export function isMedico() {
  const userRoles = store.getters?.roles || []
  return userRoles.includes('medico')
}

/**
 * Verificar si el usuario es administrador (super_user o administrador)
 * @returns {Boolean}
 */
export function isAdmin() {
  const userRoles = store.getters?.roles || []
  return userRoles.includes('super_user') || userRoles.includes('administrador')
}

/**
 * Obtener pestañas visibles para el módulo de atletas según el rol
 * @returns {Array}
 */
export function getVisibleAtletasTabs() {
  const userRoles = store.getters?.roles || []

  // Si es médico, solo puede ver ficha médica y tutor
  if (userRoles.includes('medico')) {
    return ['ficha-medica', 'tutor']
  }

  // Cualquier otro rol puede ver todas las pestañas
  return ['datos-personales', 'ficha-medica', 'medidas-antropometricas', 'rendimiento', 'tutor']
}
