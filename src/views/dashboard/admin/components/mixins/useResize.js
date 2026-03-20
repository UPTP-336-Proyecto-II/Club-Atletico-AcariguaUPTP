import { onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue'
import { debounce } from '@/utils'

export default function useResize(chartInstance) {
  let sidebarElm = null

  const resizeHandler = debounce(() => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  }, 100)

  const initResizeEvent = () => {
    window.addEventListener('resize', resizeHandler)
  }

  const destroyResizeEvent = () => {
    window.removeEventListener('resize', resizeHandler)
  }

  const sidebarResizeHandler = (e) => {
    if (e.propertyName === 'width') {
      resizeHandler()
    }
  }

  const initSidebarResizeEvent = () => {
    sidebarElm = document.getElementsByClassName('sidebar-container')[0]
    if (sidebarElm) {
      sidebarElm.addEventListener('transitionend', sidebarResizeHandler)
    }
  }

  const destroySidebarResizeEvent = () => {
    if (sidebarElm) {
      sidebarElm.removeEventListener('transitionend', sidebarResizeHandler)
    }
  }

  onMounted(() => {
    initResizeEvent()
    initSidebarResizeEvent()
  })

  onBeforeUnmount(() => {
    destroyResizeEvent()
    destroySidebarResizeEvent()
  })

  onActivated(() => {
    initResizeEvent()
    initSidebarResizeEvent()
  })

  onDeactivated(() => {
    destroyResizeEvent()
    destroySidebarResizeEvent()
  })
}
