<template>
  <div id="tags-view-container" class="tags-view-container">
    <scroll-pane ref="scrollPane" class="tags-view-wrapper" @scroll="handleScroll">
      <router-link
        v-for="tag in visitedViews"
        :ref="el => { if (el) tagRefs[tag.path] = el }"
        :key="tag.path"
        :class="isActive(tag)?'active':''"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
        custom
        v-slot="{ navigate }"
      >
        <span
          class="tags-view-item"
          :class="isActive(tag)?'active':''"
          @click="navigate"
          @click.middle="!isAffix(tag)?closeSelectedTag(tag):''"
          @contextmenu.prevent="openMenu(tag,$event)"
        >
          {{ tag.title }}
          <span v-if="!isAffix(tag)" class="el-icon-close" @click.prevent.stop="closeSelectedTag(tag)">×</span>
        </span>
      </router-link>
    </scroll-pane>
    <ul v-show="visible" :style="{left:left+'px',top:top+'px'}" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)">Recargar</li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">Cerrar</li>
      <li @click="closeOthersTags">Cerrar otros</li>
      <li @click="closeAllTags(selectedTag)">Cerrar todos</li>
    </ul>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted, nextTick, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import ScrollPane from './ScrollPane.vue'
import path from 'path'

export default {
  components: { ScrollPane },
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const instance = getCurrentInstance()

    const visible = ref(false)
    const top = ref(0)
    const left = ref(0)
    const selectedTag = ref({})
    const affixTags = ref([])
    const scrollPane = ref(null)
    const tagRefs = reactive({})

    const visitedViews = computed(() => store.state.tagsView.visitedViews)
    const routes = computed(() => store.state.permission.routes)

    function isActive(tag) {
      return tag.path === route.path
    }

    function isAffix(tag) {
      return tag.meta && tag.meta.affix
    }

    function filterAffixTags(routesList, basePath = '/') {
      let tags = []
      routesList.forEach(r => {
        if (r.meta && r.meta.affix) {
          const tagPath = path.resolve(basePath, r.path)
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: r.name,
            meta: { ...r.meta }
          })
        }
        if (r.children) {
          const tempTags = filterAffixTags(r.children, r.path)
          if (tempTags.length >= 1) {
            tags = [...tags, ...tempTags]
          }
        }
      })
      return tags
    }

    function initTags() {
      const tags = affixTags.value = filterAffixTags(routes.value)
      for (const tag of tags) {
        if (tag.name) {
          store.dispatch('tagsView/addVisitedView', tag)
        }
      }
    }

    function addTags() {
      const { name } = route
      if (name) {
        store.dispatch('tagsView/addView', route)
      }
      return false
    }

    function moveToCurrentTag() {
      nextTick(() => {
        for (const tagPath in tagRefs) {
          const tagEl = tagRefs[tagPath]
          if (tagEl && tagEl.$el) {
            const to = { path: tagPath }
            if (to.path === route.path) {
              if (scrollPane.value) {
                scrollPane.value.moveToTarget(tagEl.$el)
              }
              break
            }
          }
        }
      })
    }

    function refreshSelectedTag(view) {
      store.dispatch('tagsView/delCachedView', view).then(() => {
        const { fullPath } = view
        nextTick(() => {
          router.replace({
            path: '/redirect' + fullPath
          })
        })
      })
    }

    function closeSelectedTag(view) {
      store.dispatch('tagsView/delView', view).then(({ visitedViews: views }) => {
        if (isActive(view)) {
          toLastView(views, view)
        }
      })
    }

    function closeOthersTags() {
      router.push(selectedTag.value)
      store.dispatch('tagsView/delOthersViews', selectedTag.value).then(() => {
        moveToCurrentTag()
      })
    }

    function closeAllTags(view) {
      store.dispatch('tagsView/delAllViews').then(({ visitedViews: views }) => {
        if (affixTags.value.some(tag => tag.path === view.path)) {
          return
        }
        toLastView(views, view)
      })
    }

    function toLastView(views, view) {
      const latestView = views.slice(-1)[0]
      if (latestView) {
        router.push(latestView.fullPath)
      } else {
        if (view.name === 'Dashboard') {
          router.replace({ path: '/redirect' + view.fullPath })
        } else {
          router.push('/')
        }
      }
    }

    function openMenu(tag, e) {
      const menuMinWidth = 120
      const el = instance.proxy.$el
      const offsetLeft = el.getBoundingClientRect().left
      const offsetWidth = el.offsetWidth
      const maxLeft = offsetWidth - menuMinWidth
      const l = e.clientX - offsetLeft + 15

      if (l > maxLeft) {
        left.value = maxLeft
      } else {
        left.value = l
      }

      top.value = e.clientY
      visible.value = true
      selectedTag.value = tag
    }

    function closeMenu() {
      visible.value = false
    }

    function handleScroll() {
      closeMenu()
    }

    watch(route, () => {
      addTags()
      moveToCurrentTag()
    })

    watch(visible, (value) => {
      if (value) {
        document.body.addEventListener('click', closeMenu)
      } else {
        document.body.removeEventListener('click', closeMenu)
      }
    })

    onMounted(() => {
      initTags()
      addTags()
    })

    return {
      visible,
      top,
      left,
      selectedTag,
      affixTags,
      scrollPane,
      tagRefs,
      visitedViews,
      routes,
      isActive,
      isAffix,
      refreshSelectedTag,
      closeSelectedTag,
      closeOthersTags,
      closeAllTags,
      openMenu,
      closeMenu,
      handleScroll
    }
  }
}
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 40px;
  width: 100%;
  background: #f5f7fa;
  border-bottom: 1px solid rgba(30, 41, 59, 0.1);
  box-shadow: 0 2px 4px rgba(229, 29, 34, 0.05);

  .tags-view-wrapper {
    overflow-x: auto;
    overflow-y: hidden;
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 32px;
      line-height: 30px;
      border: 1px solid rgba(30, 41, 59, 0.2);
      color: #666;
      background: var(--color-bg-card);
      padding: 0 12px;
      font-size: 13px;
      font-weight: 400;
      margin-left: 6px;
      margin-top: 4px;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:first-of-type {
        margin-left: 15px;
      }
      &:last-of-type {
        margin-right: 15px;
      }

      &:hover {
        border-color: rgba(229, 29, 34, 0.4);
        background: rgba(229, 29, 34, 0.02);
        color: #333;
      }

      &.active {
        background-color: var(--color-primary);
        color: #fff;
        border-color: var(--color-primary);
        font-weight: 500;

        &::before {
          display: none;
        }

        &::after {
          content: '';
          position: absolute;
          top: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 2px 2px 0 0;
        }
      }
    }
  }

  .contextmenu {
    margin: 0;
    background: var(--color-bg-card);
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 6px 0;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 400;
    color: #333;
    border: 1px solid rgba(30, 41, 59, 0.1);
    box-shadow: 0 4px 12px rgba(229, 29, 34, 0.15);

    li {
      margin: 0;
      padding: 8px 20px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(229, 29, 34, 0.08);
        color: var(--color-primary);
      }
    }
  }
}
</style>

<style lang="scss">
.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 14px;
      height: 14px;
      vertical-align: middle;
      border-radius: 50%;
      text-align: center;
      transition: all 0.3s ease;
      transform-origin: center;
      margin-left: 4px;
      color: #999;
      font-size: 12px;
      display: inline-block;
      cursor: pointer;

      &:hover {
        background-color: rgba(30, 41, 59, 0.1);
        color: var(--color-primary);
        transform: scale(1.1);
      }
    }

    &.active {
      .el-icon-close {
        color: rgba(255, 255, 255, 0.7);

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
      }
    }
  }
}
</style>
