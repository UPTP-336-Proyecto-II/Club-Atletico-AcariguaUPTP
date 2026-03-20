import router from './router'
import store from './store'
import { ElMessage } from 'element-plus'
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

        // Rutas constantes que siempre son accesibles
        const isCore = ['/dashboard', '/dashboard/index', '/login', '/', '/profile/index'].some(path => to.path === path || to.path.startsWith(path))

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

          // dynamically add accessible routes (Vue Router 4)
          accessRoutes.forEach(route => {
            router.addRoute(route)
          })

          // set the replace: true, so the navigation will not leave a history record
          next({ ...to, replace: true })
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          ElMessage.error(error.message || 'Ha ocurrido un error')
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
