'use strict'

const CryptoJS = require('crypto-js')

const getSecret = () => {
  if (!process.env.CRYPTO_SECRET) throw new Error('CRYPTO_SECRET not set')
  return process.env.CRYPTO_SECRET
}

const encryptAES = (text) =>
  CryptoJS.AES.encrypt(String(text), getSecret()).toString()

const decryptAES = (cipher) =>
  CryptoJS.AES.decrypt(cipher, getSecret()).toString(CryptoJS.enc.Utf8)

const hashPhone = (phone) =>
  CryptoJS.SHA256(String(phone)).toString()

module.exports = { encryptAES, decryptAES, hashPhone }
