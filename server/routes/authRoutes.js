const express = require('express')

const { signup, login, logout, me, verifyAdmin } = require('../controllers/authController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)
router.post('/admin/verify', requireAuth, verifyAdmin)

module.exports = router
