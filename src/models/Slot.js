'use strict'

const mongoose = require('mongoose')
const STATUS   = require('../common/constants/status.constant')

const { ObjectId } = mongoose.Schema.Types

const SlotSchema = new mongoose.Schema(
  {
    turfId: {
      type:     ObjectId,
      ref:      'Turf',
      required: true,
    },
    date: {
      type:     String,   // YYYY-MM-DD
      required: true,
    },
    startTime: {
      type:     String,   // HH:mm
      required: true,
    },
    endTime: {
      type:     String,   // HH:mm
      required: true,
    },
    price: {
      type:     Number,
      required: true,
      min:      0,
    },
    status: {
      type:    String,
      enum:    Object.values(STATUS.SLOT),
      default: STATUS.SLOT.AVAILABLE,
    },
    lockedBy: {
      type:    ObjectId,
      ref:     'User',
      default: null,
    },
    lockedUntil: {
      type:    Date,
      default: null,
    },
    bookedBy: {
      type:    ObjectId,
      ref:     'User',
      default: null,
    },
  },
  { timestamps: true }
)

// Unique compound index — prevents duplicate slots
SlotSchema.index({ turfId: 1, date: 1, startTime: 1 }, { unique: true })
SlotSchema.index({ date: 1, status: 1 })

module.exports = mongoose.model('Slot', SlotSchema)
