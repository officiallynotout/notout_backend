'use strict'

module.exports = {
  SLOT: {
    AVAILABLE: 'available',
    LOCKED:    'locked',
    BOOKED:    'booked',
  },
  BOOKING: {
    PENDING:   'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    REFUNDED:  'refunded',
  },
  PAYMENT: {
    PENDING:  'pending',
    PAID:     'paid',
    FAILED:   'failed',
    REFUNDED: 'refunded',
  },
}
