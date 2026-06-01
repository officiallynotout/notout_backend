'use strict'

const prisma         = require('../config/prisma')
const ApiError       = require('../utils/ApiError')
const MESSAGES       = require('../common/constants/messages.constant')
const { decryptAES } = require('../utils/encrypt')

const formatProfile = (user) => ({
  _id:        user.id,
  name:       user.name,
  phone:      user.phone ? decryptAES(user.phone) : null,
  email:      user.email  || null,
  role:       user.role,
  isVerified: user.isVerified,
  createdAt:  user.createdAt,
})

const getProfile = (user) => formatProfile(user)

const updateProfile = async (userId, { name }) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data:  { name },
  }).catch(() => { throw new ApiError(404, MESSAGES.COMMON.USER_NOT_FOUND) })

  return formatProfile(user)
}

module.exports = { getProfile, updateProfile }
