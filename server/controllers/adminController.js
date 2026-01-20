const mongoose = require('mongoose')

const User = require('../models/User')
const Weight = require('../models/Weight')
const Workout = require('../models/Workout')

async function listUsers(req, res) {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'bodyweights',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
            { $count: 'count' },
          ],
          as: 'weightCounts',
        },
      },
      {
        $addFields: {
          weightEntriesCount: {
            $ifNull: [{ $arrayElemAt: ['$weightCounts.count', 0] }, 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          createdAt: 1,
          weightEntriesCount: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ])

    return res.json({ users })
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users' })
  }
}

async function deleteUser(req, res) {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid id' })
  }

  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(id).session(session)
      if (!user) {
        const e = new Error('USER_NOT_FOUND')
        e.code = 'USER_NOT_FOUND'
        throw e
      }

      await Weight.deleteMany({ userId: user._id }).session(session)
      await Workout.deleteMany({ userId: user._id }).session(session)
      await User.deleteOne({ _id: user._id }).session(session)
    })

    return res.json({ message: 'User deleted', id })
  } catch (err) {
    if (err && err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.status(500).json({ message: 'Failed to delete user' })
  } finally {
    await session.endSession()
  }
}

module.exports = {
  listUsers,
  deleteUser,
}
