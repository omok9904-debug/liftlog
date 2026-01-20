const express = require('express')

const {
  createWeight,
  getWeights,
  updateWeight,
  deleteWeight,
} = require('../controllers/weightController')

const router = express.Router()

router.post('/', createWeight)
router.get('/', getWeights)
router.put('/:id', updateWeight)
router.delete('/:id', deleteWeight)

module.exports = router
