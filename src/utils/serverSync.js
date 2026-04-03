import { publicService } from '@/utils/request'

const SERVER_SYNC_EVENT = 'app:server-data-updated'
const DEFAULT_SYNC_INTERVAL_MS = 3000

let syncStarted = false
let syncIntervalId = null
let syncRequestInFlight = false
let lastKnownVersion = null

const toNumericVersion = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const emitServerDataUpdated = (detail) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SERVER_SYNC_EVENT, { detail }))
}

const fetchSyncVersion = async () => {
  const response = await publicService({
    url: '/sync/version',
    method: 'get',
    params: { _: Date.now() }
  })

  return response?.data || response
}

const pollSyncVersion = async () => {
  if (typeof document !== 'undefined' && document.hidden) return
  if (syncRequestInFlight) return

  syncRequestInFlight = true
  try {
    const payload = await fetchSyncVersion()
    const version = toNumericVersion(payload?.version)
    if (version === null) return

    if (lastKnownVersion === null) {
      lastKnownVersion = version
      return
    }

    if (version > lastKnownVersion) {
      lastKnownVersion = version
      emitServerDataUpdated(payload)
    }
  } catch (error) {
    // Silent on purpose: sync failures should not block UI usage.
  } finally {
    syncRequestInFlight = false
  }
}

const handleVisibilityChange = () => {
  if (typeof document !== 'undefined' && !document.hidden) {
    pollSyncVersion()
  }
}

export const startServerSyncWatcher = (intervalMs = DEFAULT_SYNC_INTERVAL_MS) => {
  if (syncStarted || typeof window === 'undefined') return

  syncStarted = true
  pollSyncVersion()
  syncIntervalId = setInterval(pollSyncVersion, intervalMs)
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

export const onServerDataUpdated = (handler) => {
  if (typeof window === 'undefined' || typeof handler !== 'function') {
    return () => {}
  }

  const listener = (event) => handler(event.detail || {})
  window.addEventListener(SERVER_SYNC_EVENT, listener)

  return () => {
    window.removeEventListener(SERVER_SYNC_EVENT, listener)
  }
}

export const stopServerSyncWatcher = () => {
  if (!syncStarted || typeof window === 'undefined') return

  syncStarted = false
  if (syncIntervalId) {
    clearInterval(syncIntervalId)
    syncIntervalId = null
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
}
