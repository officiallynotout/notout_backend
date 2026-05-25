'use strict'

const mongoose              = require('mongoose')
const ROLES                 = require('../common/constants/roles.constant')
const { encryptAES, hashPhone } = require('../utils/encrypt')

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    // AES-encrypted phone number
    phone: {
      type:    String,
      default: null,
    },
    // SHA-256 hash of the raw phone — used for lookups
    phoneHash: {
      type:   String,
      unique: true,
      sparse: true,
    },
    email: {
      type:      String,
      unique:    true,
      sparse:    true,
      lowercase: true,
      trim:      true,
    },
    firebaseUid: {
      type:   String,
      unique: true,
      sparse: true,
    },
    role: {
      type:    String,
      enum:    Object.values(ROLES),
      default: ROLES.USER,
    },
    isVerified: {
      type:    Boolean,
      default: false,
    },
    otp: {
      code:      { type: String },
      expiresAt: { type: Date },
    },
    refreshToken: {
      type:    String,
      default: null,
    },
  },
  { timestamps: true }
)

/**
 * Pre-save hook: encrypt phone and store SHA-256 hash for lookup.
 * Guard prevents double-encryption on subsequent saves.
 */
UserSchema.pre('save', function (next) {
  if (this.isModified('phone') && this.phone) {
    const raw      = this.phone
    this.phoneHash = hashPhone(raw)
    this.phone     = encryptAES(raw)
  }
  next()
})

/**
 * Find a user by their plaintext phone number via the hash index.
 * @param {string} phone - raw plaintext phone
 */
UserSchema.statics.findByPhone = function (phone) {
  return this.findOne({ phoneHash: hashPhone(phone) })
}

module.exports = mongoose.model('User', UserSchema)
