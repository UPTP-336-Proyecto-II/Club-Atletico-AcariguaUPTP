<template>
  <div class="navbar">
    <!-- Hamburger para móvil -->
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" />

    <div class="right-menu">
      <!-- Theme Toggle -->
      <div class="right-menu-item hover-effect theme-switch" @click="toggleTheme">
        <el-icon v-if="theme === 'dark'"><sunny /></el-icon>
        <el-icon v-else><moon /></el-icon>
      </div>

      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar+'?imageView2/1/w/80/h/80'" class="user-avatar">
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/profile/index">
              <el-dropdown-item>Perfil</el-dropdown-item>
            </router-link>
            <el-dropdown-item @click="toggleTagsView">
              <span>{{ tagsView ? 'Ocultar Tags-View' : 'Mostrar Tags-View' }}</span>
            </el-dropdown-item>
            <el-dropdown-item divided @click="logout">
              <span style="display:block;">Cerrar Sesión</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Moon, Sunny } from '@element-plus/icons-vue'
import Breadcrumb from '@/components/Breadcrumb/index.vue'
import Hamburger from '@/components/Hamburger/index.vue'
import { applyTheme, getSavedTheme, saveTheme } from '@/utils/theme'

export default {
  components: {
    Breadcrumb,
    Hamburger,
    ArrowDown,
    Moon,
    Sunny
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    
    const theme = ref(getSavedTheme())

    const sidebar = computed(() => store.getters.sidebar)
    const avatar = computed(() => store.getters.avatar)
    const device = computed(() => store.getters.device)
    const tagsView = computed(() => store.state.settings.tagsView)

    function toggleSideBar() {
      store.dispatch('app/toggleSideBar')
    }

    function toggleTagsView() {
      store.dispatch('settings/changeSetting', {
        key: 'tagsView',
        value: !tagsView.value
      })
    }

    function toggleTheme() {
      const nextTheme = theme.value === 'light' ? 'dark' : 'light'
      theme.value = saveTheme(nextTheme)
    }

    async function logout() {
      await store.dispatch('user/logout')
      router.push(`/login?redirect=${route.fullPath}`)
    }

    onMounted(() => {
      theme.value = applyTheme(theme.value)
    })

    return {
      sidebar,
      avatar,
      device,
      tagsView,
      theme,
      toggleSideBar,
      toggleTagsView,
      toggleTheme,
      logout
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 60px;
  overflow: hidden;
  position: relative;
  background: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .3s;
    -webkit-tap-highlight-color: transparent;
    display: flex;
    align-items: center;
    padding: 0 10px;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }

  .breadcrumb-container {
    float: left;
    margin-left: 10px;
  }

  .right-menu {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    height: 100%;
    line-height: 60px;
    padding-right: 20px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 12px;
      height: 100%;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      vertical-align: middle;
    }

    .theme-switch {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: rgba(255, 255, 255, 0.9);
      transition: all 0.3s ease;
      padding: 0 12px;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #fff;
        transform: scale(1.1);
      }
    }

    .avatar-container {
      margin-right: 10px;

      .avatar-wrapper {
        margin-top: 10px;
        position: relative;
        display: flex;
        align-items: center;
        cursor: pointer;

        .user-avatar {
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: border-color 0.3s ease;

          &:hover {
            border-color: rgba(255, 255, 255, 0.6);
          }
        }

        .el-icon--right {
          cursor: pointer;
          position: relative;
          margin-left: 5px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          transition: transform 0.3s ease;
        }
      }
    }
  }
}

/* Responsive Navbar */
@media (max-width: 768px) {
  .navbar {
    height: 55px;
    padding: 0 10px;

    .breadcrumb-container {
      display: none;
    }

    .right-menu {
      line-height: 55px;
      padding-right: 10px;

      .avatar-container {
        margin-right: 5px;

        .avatar-wrapper {
          margin-top: 8px;

          .user-avatar {
            width: 34px;
            height: 34px;
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .navbar {
    height: 50px;

    .right-menu {
      line-height: 50px;
      padding-right: 5px;

      .avatar-container .avatar-wrapper {
        margin-top: 7px;

        .user-avatar {
          width: 32px;
          height: 32px;
        }

        .el-icon--right {
          display: none;
        }
      }
    }
  }
}
</style>
