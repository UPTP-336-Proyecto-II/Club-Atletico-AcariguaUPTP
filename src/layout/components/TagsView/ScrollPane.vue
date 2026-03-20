<template>
  <el-scrollbar ref="scrollContainer" class="scroll-container" @wheel.prevent="handleScroll">
    <slot />
  </el-scrollbar>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const tagAndTagSpacing = 6

export default {
  name: 'ScrollPane',
  emits: ['scroll'],
  setup(props, { emit }) {
    const scrollContainer = ref(null)

    const scrollWrapper = computed(() => {
      return scrollContainer.value?.wrapRef
    })

    function handleScroll(e) {
      const eventDelta = e.wheelDelta || -e.deltaY * 40
      const wrapper = scrollWrapper.value
      if (wrapper) {
        wrapper.scrollLeft = wrapper.scrollLeft + eventDelta / 4
      }
    }

    function emitScroll() {
      emit('scroll')
    }

    function moveToTarget(currentTag) {
      const $container = scrollContainer.value?.$el
      if (!$container) return
      const $containerWidth = $container.offsetWidth
      const wrapper = scrollWrapper.value
      if (!wrapper) return

      // Simple scroll to make the tag visible
      if (currentTag) {
        const tagOffsetLeft = currentTag.offsetLeft
        const tagWidth = currentTag.offsetWidth

        if (tagOffsetLeft < wrapper.scrollLeft) {
          wrapper.scrollLeft = tagOffsetLeft - tagAndTagSpacing
        } else if (tagOffsetLeft + tagWidth > wrapper.scrollLeft + $containerWidth) {
          wrapper.scrollLeft = tagOffsetLeft + tagWidth - $containerWidth + tagAndTagSpacing
        }
      }
    }

    onMounted(() => {
      const wrapper = scrollWrapper.value
      if (wrapper) {
        wrapper.addEventListener('scroll', emitScroll, true)
      }
    })

    onBeforeUnmount(() => {
      const wrapper = scrollWrapper.value
      if (wrapper) {
        wrapper.removeEventListener('scroll', emitScroll)
      }
    })

    return {
      scrollContainer,
      handleScroll,
      moveToTarget
    }
  }
}
</script>

<style lang="scss" scoped>
.scroll-container {
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  width: 100%;

  :deep(.el-scrollbar__bar) {
    display: none !important;
  }

  :deep(.el-scrollbar__wrap) {
    height: 49px;
    padding-bottom: 0;
    overflow-x: auto !important;
    overflow-y: hidden !important;
  }

  :deep(.el-scrollbar__view) {
    padding: 0 2px;
  }
}
</style>
