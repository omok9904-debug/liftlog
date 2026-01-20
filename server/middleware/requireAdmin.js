function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  return next()
}

module.exports = requireAdmin
