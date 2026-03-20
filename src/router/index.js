import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/* Router Modules */
// Removed unused router modules: components, charts, table, nested

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    noCache: true                if set true, the page will no be cached(default is false)
    affix: true                  if set true, the tag will affix in the tags-view
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/recuperar-password',
    component: () => import('@/views/login/recuperar'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    name: 'Page404',
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error-page/401'),
    hidden: true
  },
  // Nueva landing page como ruta principal
  {
    path: '/',
    component: () => import('@/views/landing/index'),
    hidden: true,
    meta: { title: 'Inicio' }
  },
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/dashboard/index'),
        name: 'Inicio',
        meta: { title: 'Inicio', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    redirect: '/profile/index',
    hidden: true,
    children: [
      {
        path: 'index',
        component: () => import('@/views/profile/index'),
        name: 'Profile',
        meta: { title: 'Profile', icon: 'user', noCache: true }
      }
    ]
  }
]

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncRoutes = [
  // ========== ASISTENCIA (Solo super_user y administrador) ==========
  {
    path: '/asistencia',
    component: Layout,
    meta: { roles: ['super_user', 'administrador'] },
    children: [
      {
        path: 'registro',
        component: () => import('@/views/asistencia/registro'),
        name: 'RegistroDiario',
        meta: { title: 'Asistencia', icon: 'el-icon-document', roles: ['super_user', 'administrador'] }
      }
    ]
  },

  // ========== ATLETAS (Todos los roles) ==========
  {
    path: '/atletas',
    component: Layout,
    meta: { roles: ['super_user', 'administrador', 'entrenador', 'medico'] },
    children: [
      {
        path: 'index',
        component: () => import('@/views/atletas/index'),
        name: 'Atletas',
        meta: { title: 'Atletas', icon: 'el-icon-user', roles: ['super_user', 'administrador', 'entrenador', 'medico'] }
      }
    ]
  },

  // ========== CATEGORÍAS (super_user, administrador, entrenador) ==========
  {
    path: '/categorias',
    component: Layout,
    meta: { roles: ['super_user', 'administrador', 'entrenador'] },
    children: [
      {
        path: 'index',
        component: () => import('@/views/categorias/index'),
        name: 'Categorias',
        meta: { title: 'Categorías', icon: 'el-icon-medal', roles: ['super_user', 'administrador', 'entrenador'] }
      }
    ]
  },

  // ========== PLANTEL (Solo super_user y administrador) ==========
  {
    path: '/plantel',
    component: Layout,
    meta: { roles: ['super_user', 'administrador'] },
    children: [
      {
        path: 'index',
        component: () => import('@/views/plantel/index'),
        name: 'Plantel',
        meta: { title: 'Plantel', icon: 'el-icon-s-custom', roles: ['super_user', 'administrador'] }
      }
    ]
  },

  // ========== REPORTES (super_user, administrador, entrenador con restricciones) ==========
  {
    path: '/reportes',
    component: Layout,
    redirect: '/reportes/rendimiento',
    name: 'Reportes',
    meta: {
      title: 'Reportes',
      icon: 'el-icon-data-line',
      roles: ['super_user', 'administrador', 'entrenador']
    },
    children: [
      {
        path: 'rendimiento',
        component: () => import('@/views/reportes/rendimiento'),
        name: 'EvolucionAtletas',
        meta: { title: 'Gráfica de Rendimiento', icon: 'el-icon-data-analysis', roles: ['super_user', 'administrador', 'entrenador'] }
      },
      {
        path: 'asistencia-atletas',
        component: () => import('@/views/reportes/asistencia-atletas'),
        name: 'AsistenciaAtletas',
        meta: { title: 'Asistencia de Atletas', icon: 'el-icon-date', roles: ['super_user', 'administrador', 'entrenador'] }
      },
      {
        path: 'plantel-reporte',
        component: () => import('@/views/reportes/plantel-reporte'),
        name: 'ReportePlantel',
        hidden: true,
        meta: { title: 'Plantel', icon: 'el-icon-s-custom', roles: ['super_user', 'administrador'] }
      },
      {
        path: 'lista-atletas',
        component: () => import('@/views/reportes/lista-atletas'),
        name: 'ListaAtletas',
        meta: { title: 'Lista de Atletas', icon: 'el-icon-files', roles: ['super_user', 'administrador', 'entrenador'] }
      }
    ]
  },

  // ========== CONFIGURACIÓN (Solo super_user y administrador) ==========
  {
    path: '/configuracion',
    component: Layout,
    redirect: '/configuracion/usuarios',
    name: 'Configuracion',
    meta: {
      title: 'Configuración',
      icon: 'el-icon-setting',
      roles: ['super_user', 'administrador']
    },
    children: [
      {
        path: 'usuarios',
        component: () => import('@/views/configuracion/usuarios'),
        name: 'UsuariosSistema',
        meta: { title: 'Usuarios del Sistema', icon: 'el-icon-user', roles: ['super_user', 'administrador'] }
      },
      {
        path: 'permisos',
        component: () => import('@/views/configuracion/permisos'),
        name: 'PermisosRoles',
        meta: { title: 'Gestión de Roles', icon: 'el-icon-lock', roles: ['super_user', 'administrador'] }
      }
    ]
  }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
