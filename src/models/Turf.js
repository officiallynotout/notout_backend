'use strict'

const mongoose = require('mongoose')

const TurfSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
    },
    location: {
      address: { type: String, required: true },
      city:    { type: String, required: true },
      pincode: { type: String, default: '' },
    },
    amenities: {
      type:    [String],
      default: [],
    },
    pricePerHour: {
      type:     Number,
      required: true,
      min:      0,
    },
    operatingHours: {
      open:  { type: String, default: '06:00' },
      close: { type: String, default: '23:00' },
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

TurfSchema.index({ 'location.city': 1 })

module.exports = mongoose.model('Turf', TurfSchema)
