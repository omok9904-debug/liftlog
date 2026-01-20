const mongoose = require('mongoose')

const Weight = require('../models/Weight')

function isValidDate(value) {
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

async function createWeight(req, res) {
  try {
    const { weight, date } = req.body ?? {}

    if (weight === undefined || weight === null || Number.isNaN(Number(weight))) {
      return res.status(400).json({ message: 'Weight is required and must be a number' })
    }

    if (!date || !isValidDate(date)) {
      return res.status(400).json({ message: 'Date is required and must be a valid date' })
    }

    const entry = await Weight.create({
      weight: Number(weight),
      date: new Date(date),
    })

    return res.status(201).json(entry)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create weight entry' })
  }
}

async function getWeights(req, res) {
  try {
    const weights = await Weight.find({}).sort({ date: 1 })
    return res.json(weights)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch weight entries' })
  }
}

async function updateWeight(req, res) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }

    const { weight, date } = req.body ?? {}

    if (weight !== undefined && weight !== null && Number.isNaN(Number(weight))) {
      return res.status(400).json({ message: 'Weight must be a number' })
    }

    if (date !== undefined && date !== null && !isValidDate(date)) {
      return res.status(400).json({ message: 'Date must be a valid date' })
    }

    const updated = await Weight.findByIdAndUpdate(
      id,
      {
        ...(weight === undefined ? {} : { weight: Number(weight) }),
        ...(date === undefined ? {} : { date: new Date(date) }),
      },
      { new: true },
    )

    if (!updated) {
      return res.status(404).json({ message: 'Weight entry not found' })
    }

    return res.json(updated)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update weight entry' })
  }
}

async function deleteWeight(req, res) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }

    const deleted = await Weight.findByIdAndDelete(id)

    if (!deleted) {
      return res.status(404).json({ message: 'Weight entry not found' })
    }

    return res.json({ message: 'Deleted', id })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete weight entry' })
  }
}

module.exports = {
  createWeight,
  getWeights,
  updateWeight,
  deleteWeight,
}
