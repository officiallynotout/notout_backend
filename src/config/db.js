'use strict'

const mongoose    = require('mongoose')
const config      = require('./env')
const { dbDebug } = require('../utils/logger')

async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI)
    dbDebug('MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
