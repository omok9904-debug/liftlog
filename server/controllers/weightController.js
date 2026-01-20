const mongoose = require('mongoose')

const Weight = require('../models/Weight')

function isValidDate(value) {
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

function toDateKey(value) {
  const d = new Date(value)
  return d.toISOString().slice(0, 10)
}

function normalizeToUtcMidnight(dateKey) {
  return new Date(`${dateKey}T00:00:00.000Z`)
}

function dayRangeUtc(dateKey) {
  const start = normalizeToUtcMidnight(dateKey)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
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

    const dateKey = toDateKey(date)
    const { start, end } = dayRangeUtc(dateKey)
    const normalizedDate = start

    const existing = await Weight.findOne({
      userId: req.user.id,
      $or: [{ dateKey }, { date: { $gte: start, $lt: end } }],
    })
    if (existing) {
      return res.status(409).json({ message: 'Weight entry already exists for this date' })
    }

    const entry = await Weight.create({
      userId: req.user.id,
      weight: Number(weight),
      date: normalizedDate,
      dateKey,
    })

    return res.status(201).json(entry)
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Weight entry already exists for this date' })
    }
    return res.status(500).json({ message: 'Failed to create weight entry' })
  }
}

async function getWeights(req, res) {
  try {
    const rawPage = req.query?.page
    const rawLimit = req.query?.limit

    const hasPagination = rawPage !== undefined || rawLimit !== undefined
    if (!hasPagination) {
      const weights = await Weight.find({ userId: req.user.id }).sort({ date: 1 })
      return res.json(weights)
    }

    const page = Math.max(1, Number.parseInt(String(rawPage ?? '1'), 10) || 1)
    const limit = Math.min(50, Math.max(1, Number.parseInt(String(rawLimit ?? '10'), 10) || 10))

    const filter = { userId: req.user.id }
    const totalCount = await Weight.countDocuments(filter)
    const totalPages = Math.max(1, Math.ceil(totalCount / limit))
    const safePage = Math.min(page, totalPages)
    const skip = (safePage - 1) * limit

    const data = await Weight.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)

    return res.json({ data, totalCount, totalPages, page: safePage, limit })
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

    let datePatch = {}
    if (date !== undefined) {
      const nextDateKey = toDateKey(date)

      const { start, end } = dayRangeUtc(nextDateKey)
      const conflict = await Weight.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(id) },
        userId: req.user.id,
        $or: [{ dateKey: nextDateKey }, { date: { $gte: start, $lt: end } }],
      })

      if (conflict) {
        return res.status(409).json({ message: 'Weight entry already exists for this date' })
      }

      datePatch = {
        date: start,
        dateKey: nextDateKey,
      }
    }

    const updated = await Weight.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        ...(weight === undefined ? {} : { weight: Number(weight) }),
        ...datePatch,
      },
      { new: true },
    )

    if (!updated) {
      return res.status(404).json({ message: 'Weight entry not found' })
    }

    return res.json(updated)
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Weight entry already exists for this date' })
    }
    return res.status(500).json({ message: 'Failed to update weight entry' })
  }
}

async function deleteWeight(req, res) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }

    const deleted = await Weight.findOneAndDelete({ _id: id, userId: req.user.id })

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
