'use strict'

const mongoose = require('mongoose')

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    turfName: {
      type:     String,
      required: true,
      trim:     true,
    },
    date: {
      type:     String,
      required: true,
    },
    startTime: {
      type:     String,
      required: true,
    },
    endTime: {
      type:     String,
      required: true,
    },
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Booking', BookingSchema)
