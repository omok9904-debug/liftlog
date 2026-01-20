const mongoose = require('mongoose')

const bodyWeightSchema = new mongoose.Schema({
  weight: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('BodyWeight', bodyWeightSchema)
