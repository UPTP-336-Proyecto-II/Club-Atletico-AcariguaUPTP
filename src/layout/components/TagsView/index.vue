<template>
  <div id="tags-view-container" class="tags-view-container">
    <scroll-pane ref="scrollPane" class="tags-view-wrapper" @scroll="handleScroll">
      <router-link
        v-for="tag in visitedViews"
        ref="tag"
        :key="tag.path"
        :class="isActive(tag)?'active':''"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
        tag="span"
        class="tags-view-item"
        @click.middle.native="!isAffix(tag)?closeSelectedTag(tag):''"
        @contextmenu.prevent.native="openMenu(tag,$event)"
      >
        {{ tag.title }}
        <span v-if="!isAffix(tag)" class="el-icon-close" @click.prevent.stop="closeSelectedTag(tag)" />
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
import ScrollPane from './ScrollPane'
import path from 'path'

export default {
  components: { ScrollPane },
  data() {
    return {
      visible: false,
      top: 0,
      left: 0,
      selectedTag: {},
      affixTags: []
    }
  },
  computed: {
    visitedViews() {
      return this.$store.state.tagsView.visitedViews
    },
    routes() {
      return this.$store.state.permission.routes
    }
  },
  watch: {
    $route() {
      this.addTags()
      this.moveToCurrentTag()
    },
    visible(value) {
      if (value) {
        document.body.addEventListener('click', this.closeMenu)
      } else {
        document.body.removeEventListener('click', this.closeMenu)
      }
    }
  },
  mounted() {
    this.initTags()
    this.addTags()
  },
  methods: {
    isActive(route) {
      return route.path === this.$route.path
    },
    isAffix(tag) {
      return tag.meta && tag.meta.affix
    },
    filterAffixTags(routes, basePath = '/') {
      let tags = []
      routes.forEach(route => {
        if (route.meta && route.meta.affix) {
          const tagPath = path.resolve(basePath, route.path)
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            meta: { ...route.meta }
          })
        }
        if (route.children) {
          const tempTags = this.filterAffixTags(route.children, route.path)
          if (tempTags.length >= 1) {
            tags = [...tags, ...tempTags]
          }
        }
      })
      return tags
    },
    initTags() {
      const affixTags = this.affixTags = this.filterAffixTags(this.routes)
      for (const tag of affixTags) {
        // Must have tag name
        if (tag.name) {
          this.$store.dispatch('tagsView/addVisitedView', tag)
        }
      }
    },
    addTags() {
      const { name } = this.$route
      if (name) {
        this.$store.dispatch('tagsView/addView', this.$route)
      }
      return false
    },
    moveToCurrentTag() {
      const tags = this.$refs.tag
      this.$nextTick(() => {
        for (const tag of tags) {
          if (tag.to.path === this.$route.path) {
            this.$refs.scrollPane.moveToTarget(tag)
            // when query is different then update
            if (tag.to.fullPath !== this.$route.fullPath) {
              this.$store.dispatch('tagsView/updateVisitedView', this.$route)
            }
            break
          }
        }
      })
    },
    refreshSelectedTag(view) {
      this.$store.dispatch('tagsView/delCachedView', view).then(() => {
        const { fullPath } = view
        this.$nextTick(() => {
          this.$router.replace({
            path: '/redirect' + fullPath
          })
        })
      })
    },
    closeSelectedTag(view) {
      this.$store.dispatch('tagsView/delView', view).then(({ visitedViews }) => {
        if (this.isActive(view)) {
          this.toLastView(visitedViews, view)
        }
      })
    },
    closeOthersTags() {
      this.$router.push(this.selectedTag)
      this.$store.dispatch('tagsView/delOthersViews', this.selectedTag).then(() => {
        this.moveToCurrentTag()
      })
    },
    closeAllTags(view) {
      this.$store.dispatch('tagsView/delAllViews').then(({ visitedViews }) => {
        if (this.affixTags.some(tag => tag.path === view.path)) {
          return
        }
        this.toLastView(visitedViews, view)
      })
    },
    toLastView(visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0]
      if (latestView) {
        this.$router.push(latestView.fullPath)
      } else {
        // now the default is to redirect to the home page if there is no tags-view,
        // you can adjust it according to your needs.
        if (view.name === 'Dashboard') {
          // to reload home page
          this.$router.replace({ path: '/redirect' + view.fullPath })
        } else {
          this.$router.push('/')
        }
      }
    },
    openMenu(tag, e) {
      const menuMinWidth = 120
      const offsetLeft = this.$el.getBoundingClientRect().left // container margin left
      const offsetWidth = this.$el.offsetWidth // container width
      const maxLeft = offsetWidth - menuMinWidth // left boundary
      const left = e.clientX - offsetLeft + 15 // 15: margin right

      if (left > maxLeft) {
        this.left = maxLeft
      } else {
        this.left = left
      }

      this.top = e.clientY
      this.visible = true
      this.selectedTag = tag
    },
    closeMenu() {
      this.visible = false
    },
    handleScroll() {
      this.closeMenu()
    }
  }
}
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 40px; /* Aumentada para mejor visibilidad */
  width: 100%;
  background: #f5f7fa; /* Fondo claro en lugar de blanco */
  border-bottom: 1px solid rgba(229, 29, 34, 0.1); /* Borde rojo sutil */
  box-shadow: 0 2px 4px rgba(229, 29, 34, 0.05);

  .tags-view-wrapper {
    /* Permitir scroll horizontal sin barra visible */
    overflow-x: auto;
    overflow-y: hidden;
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;     /* Firefox */

    /* Ocultar scrollbar en Chrome, Safari y Opera */
    &::-webkit-scrollbar {
      display: none;
    }
    .tags-view-item {
      display: inline-block;
      position: relative;
      cursor: pointer;
      height: 32px; /* Aumentada */
      line-height: 30px; /* Ajustada */
      border: 1px solid rgba(229, 29, 34, 0.2); /* Borde rojo sutil */
      color: #666;
      background: #fff;
      padding: 0 12px; /* Más padding */
      font-size: 13px;
      font-weight: 400;
      margin-left: 6px;
      margin-top: 4px;
      border-radius: 4px; /* Bordes redondeados */
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
        background-color: #E51D22; /* Rojo igual que navbar */
        color: #fff;
        border-color: #E51D22;
        font-weight: 500;

        /* Eliminado el punto blanco anterior */
        &::before {
          display: none; /* Eliminamos el punto blanco */
        }

        /* Nueva decoración: línea superior */
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
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 6px 0;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 400;
    color: #333;
    border: 1px solid rgba(229, 29, 34, 0.1);
    box-shadow: 0 4px 12px rgba(229, 29, 34, 0.15);

    li {
      margin: 0;
      padding: 8px 20px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(229, 29, 34, 0.08);
        color: #E51D22;
      }
    }
  }
}
</style>

<style lang="scss">
// Estilos para el botón de cerrar
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

      &:before {
        transform: scale(0.8);
        display: inline-block;
        vertical-align: -1px;
      }

      &:hover {
        background-color: rgba(229, 29, 34, 0.1);
        color: #E51D22;
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
