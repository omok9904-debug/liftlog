const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  try {
    const cookieToken = req.cookies?.token
    const header = req.headers?.authorization
    const headerToken =
      typeof header === 'string' && header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null

    const token = cookieToken || headerToken

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET?.trim())
    req.user = {
      id: payload.sub,
      isAdmin: Boolean(payload.isAdmin),
      email: payload.email,
      firstName: payload.firstName,
    }

    return next()
  } catch (err) {
    try {
      const header = req.headers?.authorization
      const headerToken =
        typeof header === 'string' && header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null
      console.error('[requireAuth] Unauthorized', {
        hasCookie: Boolean(req.cookies?.token),
        hasHeader: Boolean(headerToken),
        errorName: err?.name,
        errorMessage: err?.message,
      })
    } catch {
      // ignore
    }
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

module.exports = requireAuth
