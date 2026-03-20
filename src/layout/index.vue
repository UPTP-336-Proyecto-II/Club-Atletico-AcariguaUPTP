<template>
  <div :class="classObj" class="app-wrapper">
    <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <sidebar class="sidebar-container" />
    <div :class="{hasTagsView:needTagsView}" class="main-container">
      <div :class="{'fixed-header':fixedHeader}">
        <navbar />
        <tags-view v-if="needTagsView" />
      </div>
      <app-main />

      <!-- Global Footer -->
      <footer class="app-footer">
        <div class="footer-content">
          <p><strong>Club Atlético Deportivo Acarigua (CADA)</strong> - Sistema de Gestión Deportiva e Integral</p>
          <p class="copyright">&copy; {{ new Date().getFullYear() }} Todos los derechos reservados.</p>
        </div>
      </footer>

      <right-panel v-if="showSettings">
        <settings />
      </right-panel>
    </div>
  </div>
</template>

<script>
import { computed, watch, onBeforeMount, onBeforeUnmount, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import RightPanel from '@/components/RightPanel/index.vue'
import { AppMain, Navbar, Settings, Sidebar, TagsView } from './components'

const WIDTH = 992

export default {
  name: 'Layout',
  components: {
    AppMain,
    Navbar,
    RightPanel,
    Settings,
    Sidebar,
    TagsView
  },
  setup() {
    const store = useStore()
    const route = useRoute()

    const sidebar = computed(() => store.state.app.sidebar)
    const device = computed(() => store.state.app.device)
    const showSettings = computed(() => store.state.settings.showSettings)
    const needTagsView = computed(() => store.state.settings.tagsView)
    const fixedHeader = computed(() => store.state.settings.fixedHeader)

    const classObj = computed(() => ({
      hideSidebar: !sidebar.value.opened,
      openSidebar: sidebar.value.opened,
      withoutAnimation: sidebar.value.withoutAnimation,
      mobile: device.value === 'mobile'
    }))

    function handleClickOutside() {
      store.dispatch('app/closeSideBar', { withoutAnimation: false })
    }

    // ResizeHandler logic (was mixin)
    function isMobile() {
      const rect = document.body.getBoundingClientRect()
      return rect.width - 1 < WIDTH
    }

    function resizeHandler() {
      if (!document.hidden) {
        const mobile = isMobile()
        store.dispatch('app/toggleDevice', mobile ? 'mobile' : 'desktop')
        if (mobile) {
          store.dispatch('app/closeSideBar', { withoutAnimation: true })
        }
      }
    }

    watch(route, () => {
      if (device.value === 'mobile' && sidebar.value.opened) {
        store.dispatch('app/closeSideBar', { withoutAnimation: false })
      }
    })

    onBeforeMount(() => {
      window.addEventListener('resize', resizeHandler)
    })

    onMounted(() => {
      const mobile = isMobile()
      if (mobile) {
        store.dispatch('app/toggleDevice', 'mobile')
        store.dispatch('app/closeSideBar', { withoutAnimation: true })
      }
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', resizeHandler)
    })

    return {
      sidebar,
      device,
      showSettings,
      needTagsView,
      fixedHeader,
      classObj,
      handleClickOutside
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "@/styles/mixin.scss";
  @import "@/styles/variables.scss";

  /* App Footer Global Styles */
  .app-footer {
    text-align: center;
    color: #909399;
    padding: 20px 0;
    width: 100%;
    background: #f0f2f5;
  }

  .footer-content p {
    margin: 5px 0;
    font-size: 0.9rem;
  }

  .copyright {
    font-size: 0.8rem;
  }

  .app-wrapper {
    @include clearfix;
    position: relative;
    height: 100%;
    width: 100%;

    &.mobile.openSidebar {
      position: fixed;
      top: 0;
    }
  }

  .drawer-bg {
    background: #000;
    opacity: 0.3;
    width: 100%;
    top: 0;
    height: 100%;
    position: absolute;
    z-index: 999;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    width: calc(100% - #{$sideBarWidth});
    transition: width 0.28s;
  }

  .hideSidebar .fixed-header {
    width: calc(100% - 54px)
  }

  .mobile .fixed-header {
    width: 100%;
  }
</style>
