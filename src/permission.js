import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false })

const whiteList = ['/', '/login', '/auth-redirect', '/recuperar-password']

router.beforeEach(async(to, from, next) => {
  NProgress.start()

  document.title = getPageTitle(to.meta.title)

  const hasToken = getToken()

  // 🔥 FORZAR LANDING PAGE SIEMPRE AL INICIAR (eliminar esta parte después de testing)
  if (to.path === '/' && from.path === '/') {
    // Limpiar token solo para testing
    const token = getToken()
    if (token) {
      console.log('🔍 Token encontrado, forzando landing page para testing...')
      // Si quieres forzar la landing, comenta esta línea:
      // await store.dispatch('user/resetToken')
    }
  }

  if (hasToken) {
    if (to.path === '/login' || to.path === '/') {
      next({ path: '/dashboard' })
      NProgress.done()
    } else {
      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) {
        // Verificar si el usuario tiene permiso para acceder a esta ruta
        const accessRoutes = store.getters.permission_routes || []
        const hasPermission = accessRoutes.some(route => {
          if (route.path === to.path) return true
          if (route.children) {
            return route.children.some(child => {
              const fullPath = (route.path.endsWith('/') ? route.path : route.path + '/') + child.path
              return fullPath === to.path || to.path.startsWith(fullPath)
            })
          }
          return false
        })

        // Rutas constantes que siempre son accesibles pero NO deben ocultar errores de permiso
        const isCore = ['/dashboard', '/dashboard/index', '/login', '/', '/profile/index'].some(path => to.path === path || to.path.startsWith(path))

        // Si no tiene permiso y no es una ruta core, o si es un 404, redirigir al dashboard
        // Note: We include /404 here because if they hit it, it means they matched the '*' route
        if ((!hasPermission && !isCore) || to.path === '/404') {
          next({ path: '/dashboard', replace: true })
          NProgress.done()
        } else {
          next()
        }
      } else {
        try {
          // get user info
          const { roles } = await store.dispatch('user/getInfo')

          // generate accessible routes map based on roles
          const accessRoutes = await store.dispatch('permission/generateRoutes', roles)

          // dynamically add accessible routes
          router.addRoutes(accessRoutes)

          // Hack: Check if the current destination (to.path) exists in the newly added routes
          // If the user was redirected to a page they no longer have access to (due to role change),
          // router.resolve will help us identify if it's a 404
          const resolved = router.resolve(to.path)
          if (resolved.route.name === 'Page404' || resolved.route.matched.length === 0) {
            next({ path: '/dashboard', replace: true })
          } else {
            // set the replace: true, so the navigation will not leave a history record
            next({ ...to, replace: true })
          }
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next('/')
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
