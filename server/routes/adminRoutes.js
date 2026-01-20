const express = require('express')

const { listUsers, deleteUser } = require('../controllers/adminController')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const router = express.Router()

router.use(requireAuth)
router.use(requireAdmin)

router.get('/users', listUsers)
router.delete('/users/:id', deleteUser)

module.exports = router
