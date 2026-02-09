<template>
  <div class="navbar">
    <!-- Hamburger para móvil -->
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" />

    <div class="right-menu">
      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar+'?imageView2/1/w/80/h/80'" class="user-avatar">
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown">
          <router-link to="/profile/index">
            <el-dropdown-item>Perfil</el-dropdown-item>
          </router-link>
          <el-dropdown-item @click.native="toggleTagsView">
            <span>{{ tagsView ? 'Ocultar Tags-View' : 'Mostrar Tags-View' }}</span>
          </el-dropdown-item>
          <el-dropdown-item divided @click.native="logout">
            <span style="display:block;">Cerrar Sesión</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'

export default {
  components: {
    Breadcrumb,
    Hamburger
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'device'
    ]),
    tagsView() {
      return this.$store.state.settings.tagsView
    }
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    toggleTagsView() {
      this.$store.dispatch('settings/changeSetting', {
        key: 'tagsView',
        value: !this.tagsView
      })
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 60px;
  overflow: hidden;
  position: relative;
  background: #E51D22;
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
    float: right;
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

    .avatar-container {
      margin-right: 10px;

      .avatar-wrapper {
        margin-top: 10px;
        position: relative;
        display: flex;
        align-items: center;

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

        .el-icon-caret-bottom {
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

/* Estilos para el dropdown del perfil */
.el-dropdown-menu {
  background: white;
  border: 1px solid rgba(229, 29, 34, 0.1);
  box-shadow: 0 4px 12px rgba(229, 29, 34, 0.15);

  .el-dropdown-menu__item {
    font-size: 13px;
    color: #333;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(229, 29, 34, 0.08);
      color: #E51D22;
    }

    &[divided] {
      border-top-color: rgba(229, 29, 34, 0.1);
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

        .el-icon-caret-bottom {
          display: none;
        }
      }
    }
  }
}
</style>
