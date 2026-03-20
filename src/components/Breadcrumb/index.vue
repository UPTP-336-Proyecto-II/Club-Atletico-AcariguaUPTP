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
  margin-left: 8px;

  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 400;
      transition: color 0.3s ease;

      a {
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;

        &:hover {
          color: #ffffff;
          text-decoration: underline;
        }
      }

      &.no-redirect {
        color: rgba(255, 255, 255, 0.5);
        font-weight: 500;
        cursor: default;
      }
    }

    &:last-child .el-breadcrumb__inner {
      color: #ffffff;
      font-weight: 600;
    }

    .el-breadcrumb__separator {
      color: rgba(255, 255, 255, 0.5);
    }
  }
}
</style>
