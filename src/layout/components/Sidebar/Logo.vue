<template>
  <div class="sidebar-logo-container" :class="{'collapse':collapse}" @click="toggleSideBar">
    <transition name="sidebarLogoFade">
      <div v-if="collapse" key="collapse" class="sidebar-logo-link">
        <img v-if="logo" :src="logo" class="sidebar-logo">
        <h1 v-else class="sidebar-title">{{ title }} </h1>
      </div>
      <div v-else key="expand" class="sidebar-logo-link">
        <img v-if="logo" :src="logo" class="sidebar-logo">
        <h1 class="sidebar-title">
          <span class="club-name">Club Atlético</span>
          <span class="club-subname">Deportivo Acarigua</span>
        </h1>
      </div>
    </transition>
  </div>
</template>

<script>
import { useStore } from 'vuex'
import logoImg from '@/assets/icons/logo.png'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  setup() {
    const store = useStore()

    function toggleSideBar() {
      store.dispatch('app/toggleSideBar')
    }

    return {
      title: 'Club Atlético Deportivo Acarigua',
      logo: logoImg,
      toggleSideBar
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter-from,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: rgba(0, 0, 0, 0.15);
  text-align: center;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.25);
  }

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0 15px;

    & .sidebar-logo {
      width: 32px;
      height: 32px;
      vertical-align: middle;
      margin-right: 12px;
      transition: transform 0.3s ease;
    }

    & .sidebar-title {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 1.2;
      font-size: 14px;
      font-family: 'Figtree', Helvetica Neue, Arial, Helvetica, sans-serif;
      vertical-align: middle;
      text-align: left;
      flex-grow: 1;

      .club-name {
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        display: block;
        margin-bottom: 2px;
      }

      .club-subname {
        font-size: 12px;
        font-weight: 500;
        color: #fff;
        opacity: 0.9;
        display: block;
      }
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0;
    }

    .sidebar-title {
      display: none;
    }
  }

  &:hover .sidebar-logo {
    transform: scale(1.1);
  }
}
</style>
