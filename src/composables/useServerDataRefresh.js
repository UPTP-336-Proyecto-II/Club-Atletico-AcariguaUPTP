import { onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import { onServerDataUpdated } from '@/utils/serverSync'

export function useServerDataRefresh(refreshFn, options = {}) {
  const {
    isBusy = () => false,
    minIntervalMs = 1200
  } = options

  let stopListening = null
  let inFlight = false
  let lastRunAt = 0
  let isViewActive = true

  const runRefresh = async () => {
    if (typeof refreshFn !== 'function') return
    if (!isViewActive) return
    if (document.hidden) return
    if (inFlight) return
    if (isBusy()) return

    const now = Date.now()
    if (now - lastRunAt < minIntervalMs) return

    inFlight = true
    try {
      await refreshFn()
      lastRunAt = Date.now()
    } catch (error) {
      console.error('Error actualizando datos en segundo plano:', error)
    } finally {
      inFlight = false
    }
  }

  onMounted(() => {
    isViewActive = true
    stopListening = onServerDataUpdated(runRefresh)
  })

  onActivated(() => {
    isViewActive = true
    runRefresh()
  })

  onDeactivated(() => {
    isViewActive = false
  })

  onUnmounted(() => {
    isViewActive = false
    if (stopListening) {
      stopListening()
      stopListening = null
    }
  })
}
