const state = {
  version: 1,
  updated_at: new Date().toISOString(),
  last_change: null
}

function getSyncState() {
  return {
    version: state.version,
    updated_at: state.updated_at,
    last_change: state.last_change
  }
}

function bumpSyncVersion(change = {}) {
  state.version += 1
  state.updated_at = new Date().toISOString()
  state.last_change = {
    method: change.method || null,
    path: change.path || null,
    at: state.updated_at
  }
  return getSyncState()
}

module.exports = {
  getSyncState,
  bumpSyncVersion
}
