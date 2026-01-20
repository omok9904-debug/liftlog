const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/User')
const { MAX_SIGNUPS, ADMIN_SECRET_KEY } = require('../config/appConfig')

const COOKIE_NAME = 'token'
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function setAuthCookie(res, token, remember = true) {
  const options = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }

  if (remember) {
    options.maxAge = ONE_WEEK_MS
  }

  res.cookie(COOKIE_NAME, token, options)
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
}

function publicUser(user, isAdmin) {
  return { id: user._id.toString(), email: user.email, isAdmin: Boolean(isAdmin) }
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

async function signup(req, res) {
  try {
    const { email, password, remember } = req.body ?? {}

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' })
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const usersCount = await User.countDocuments()
    if (usersCount >= MAX_SIGNUPS) {
      return res.status(403).json({ message: 'Signups are currently closed' })
    }

    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ email: normalizedEmail, passwordHash })

    const token = signToken({ sub: user._id.toString(), isAdmin: false })

    setAuthCookie(res, token, remember !== false)

    return res.status(201).json({ user: publicUser(user, false) })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to sign up' })
  }
}

async function login(req, res) {
  try {
    const { email, password, remember } = req.body ?? {}

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' })
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken({ sub: user._id.toString(), isAdmin: false })

    setAuthCookie(res, token, remember !== false)

    return res.json({ user: publicUser(user, false) })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to log in' })
  }
}

async function logout(req, res) {
  clearAuthCookie(res)
  return res.status(204).send()
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    return res.json({ user: publicUser(user, req.user?.isAdmin) })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch session' })
  }
}

async function verifyAdmin(req, res) {
  try {
    const { key, remember } = req.body ?? {}

    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return res.status(400).json({ message: 'Invalid request' })
    }

    if (key !== ADMIN_SECRET_KEY) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken({ sub: req.user.id, isAdmin: true })
    setAuthCookie(res, token, remember !== false)

    return res.json({ ok: true })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify admin access' })
  }
}

module.exports = {
  signup,
  login,
  logout,
  me,
  verifyAdmin,
}
