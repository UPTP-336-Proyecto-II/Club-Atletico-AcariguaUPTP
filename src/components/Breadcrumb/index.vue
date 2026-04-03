<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item,index) in levelList" :key="item.path">
        <span v-if="item.redirect==='noRedirect'||index==levelList.length-1" class="no-redirect">{{ item.meta.title }}</span>
        <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const levelList = ref(null)

    function getBreadcrumb() {
      let matched = route.matched.filter(item => item.meta && item.meta.title)
      const first = matched[0]

      if (!isInicio(first)) {
        matched = [{ path: '/dashboard', meta: { title: 'Inicio' } }].concat(matched)
      }

      levelList.value = matched.filter(item => item.meta && item.meta.title && item.meta.breadcrumb !== false)
    }

    function isInicio(r) {
      const name = r && r.name
      if (!name) return false
      return name.toString().trim().toLowerCase() === 'inicio'
    }

    function handleLink(item) {
      const { redirect, path } = item
      if (redirect) {
        router.push(redirect)
        return
      }
      router.push(path)
    }

    watch(() => route.path, () => {
      if (route.path.startsWith('/redirect/')) return
      getBreadcrumb()
    })

    onMounted(() => {
      getBreadcrumb()
    })

    return { levelList, handleLink }
  }
}
</script>

<style lang="scss" scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 60px;
  margin-left: 12px;
  font-family: 'Figtree', sans-serif;

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: rgba(255, 255, 255, 0.7) !important;
      font-weight: 500;
      transition: all 0.25s ease;

      a {
        color: rgba(255, 255, 255, 0.9) !important;
        text-decoration: none;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.2s ease;

        &:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.1);
        }
      }

      &.no-redirect {
        color: rgba(255, 255, 255, 0.5) !important;
        font-weight: 500;
        cursor: default;
      }
    }

    &:last-child .el-breadcrumb__inner {
      color: #ffffff !important;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .el-breadcrumb__separator {
      color: rgba(255, 255, 255, 0.4);
      font-weight: 400;
      margin: 0 4px;
    }
  }
}
</style>
