const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

const PORT = process.env.PORT || 5050
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
const MONGO_URI = process.env.MONGO_URI

const allowedOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.has(origin)) return callback(null, true)
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

app.use(cors(corsOptions))
app.use(express.json())

// Express 5 + path-to-regexp no longer accepts "*" as a valid route path.
// Use a RegExp to match all paths for OPTIONS preflight.
app.options(/.*/, cors(corsOptions))

app.use('/weights', require('./routes/weightRoutes'))

app.get('/', (req, res) => {
  res.json({ message: 'LiftLog API running' })
})

async function start() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is missing')
    }

    await mongoose.connect(MONGO_URI)
    console.log('✅ MongoDB connected')

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('❌ Startup error:', err && err.message ? err.message : err)
    process.exit(1)
  }
}

start()