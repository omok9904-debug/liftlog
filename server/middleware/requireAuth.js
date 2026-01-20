const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, isAdmin: Boolean(payload.isAdmin) }

    return next()
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

module.exports = requireAuth
