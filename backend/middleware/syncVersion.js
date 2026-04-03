const { bumpSyncVersion } = require('../services/syncVersionService')

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function syncVersionMiddleware(req, res, next) {
  res.on('finish', () => {
    if (!MUTATING_METHODS.has(req.method)) return
    if (!req.originalUrl.startsWith('/api/')) return
    if (req.originalUrl.startsWith('/api/sync/version')) return
    if (res.statusCode < 200 || res.statusCode >= 400) return

    bumpSyncVersion({
      method: req.method,
      path: req.originalUrl
    })
  })

  next()
}

module.exports = {
  syncVersionMiddleware
}
