'use strict'

class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data })
  }

  static created(res, data, message = 'Created') {
    return res.status(201).json({ success: true, message, data })
  }

  static noContent(res) {
    return res.status(204).send()
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    })
  }
}

module.exports = ApiResponse
