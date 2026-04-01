<template>
  <div :class="{'has-logo':showLogo}">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :unique-opened="false"
        :active-text-color="variables.menuActiveText"
        :collapse-transition="false"
        mode="vertical"
      >
        <sidebar-item v-for="route in permissionRoutes" :key="route.path" :item="route" :base-path="route.path" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import Logo from './Logo.vue'
import SidebarItem from './SidebarItem.vue'

// Variables exported as JS constants since :export was removed
const variables = {
  menuText: 'rgba(255, 255, 255, 0.9)',
  menuActiveText: '#ffffff',
  subMenuActiveText: 'rgba(255, 255, 255, 0.9)',
  menuBg: 'var(--color-bg-sidebar)',
  menuHover: 'rgba(0, 0, 0, 0.15)',
  subMenuBg: 'rgba(0, 0, 0, 0.1)',
  subMenuHover: 'rgba(0, 0, 0, 0.2)',
  sideBarWidth: '260px'
}

export default {
  components: { SidebarItem, Logo },
  setup() {
    const store = useStore()
    const route = useRoute()

    const permissionRoutes = computed(() => store.getters.permission_routes)
    const sidebar = computed(() => store.getters.sidebar)

    const activeMenu = computed(() => {
      const { meta, path } = route
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    })

    const showLogo = computed(() => store.state.settings.sidebarLogo)
    const isCollapse = computed(() => !sidebar.value.opened)

    return {
      permissionRoutes,
      sidebar,
      activeMenu,
      showLogo,
      variables,
      isCollapse
    }
  }
}
</script>
