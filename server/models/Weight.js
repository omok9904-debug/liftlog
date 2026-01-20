const mongoose = require('mongoose')

const weightSchema = new mongoose.Schema({
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

module.exports = mongoose.model('Weight', weightSchema, 'bodyweights')
