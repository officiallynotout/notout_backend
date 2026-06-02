'use strict'

const DEFAULT_PAGE  = 1
const DEFAULT_LIMIT = 10

const parsePagination = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page)  || DEFAULT_PAGE)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT))
  const skip  = (page - 1) * limit
  return { page, limit, skip, take: limit }
}

const paginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext:    page < Math.ceil(total / limit),
  hasPrev:    page > 1,
})

module.exports = { parsePagination, paginationMeta }
