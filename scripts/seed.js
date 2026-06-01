'use strict'

require('dotenv').config()
const mongoose = require('mongoose')
const Turf     = require('../src/models/Turf')
const Slot     = require('../src/models/Slot')

// ─── Turf data ────────────────────────────────────────────────────────────────

const TURFS = [
  {
    name:         'The Green Arena',
    description:  'Premium 5-a-side turf with FIFA-standard artificial grass. Covered with floodlights for night matches.',
    location:     { address: '12, Koramangala 5th Block', city: 'Bangalore', pincode: '560095' },
    amenities:    ['Floodlights', 'Changing Rooms', 'Parking', 'Drinking Water', 'First Aid'],
    pricePerHour: 800,
    operatingHours: { open: '06:00', close: '23:00' },
    isActive:     true,
  },
  {
    name:         'Kickoff Zone',
    description:  'Well-maintained 7-a-side turf. Perfect for weekend leagues and corporate tournaments.',
    location:     { address: '45, Indiranagar 100ft Road', city: 'Bangalore', pincode: '560038' },
    amenities:    ['Floodlights', 'Seating', 'Cafeteria', 'Parking', 'Shower'],
    pricePerHour: 1000,
    operatingHours: { open: '05:30', close: '22:30' },
    isActive:     true,
  },
  {
    name:         'PlayGround Pro',
    description:  'Affordable and accessible turf in the heart of the city. Great for casual matches.',
    location:     { address: '8, MG Road Near Metro', city: 'Bangalore', pincode: '560001' },
    amenities:    ['Floodlights', 'Parking', 'Drinking Water'],
    pricePerHour: 600,
    operatingHours: { open: '06:00', close: '22:00' },
    isActive:     true,
  },
  {
    name:         'Elite Sports Hub',
    description:  'Dual turf facility with professional coaching available on request. Best in town.',
    location:     { address: 'Plot 22, Whitefield Main Road', city: 'Bangalore', pincode: '560066' },
    amenities:    ['Floodlights', 'Coaching', 'Changing Rooms', 'Parking', 'Cafeteria', 'First Aid', 'Shower'],
    pricePerHour: 1200,
    operatingHours: { open: '06:00', close: '23:30' },
    isActive:     true,
  },
  {
    name:         'Striker\'s Den',
    description:  'Compact 5-a-side turf ideal for quick evening games. Located near HSR Layout.',
    location:     { address: '3rd Cross, HSR Layout Sector 2', city: 'Bangalore', pincode: '560102' },
    amenities:    ['Floodlights', 'Drinking Water', 'Parking'],
    pricePerHour: 700,
    operatingHours: { open: '07:00', close: '22:00' },
    isActive:     true,
  },
]

// ─── Slot generation ──────────────────────────────────────────────────────────

/**
 * Generate 1-hour slots between open and close times.
 */
function generateTimeSlots(open, close) {
  const slots = []
  const [openH, openM]   = open.split(':').map(Number)
  const [closeH, closeM] = close.split(':').map(Number)
  const openMins  = openH * 60 + openM
  const closeMins = closeH * 60 + closeM

  for (let start = openMins; start + 60 <= closeMins; start += 60) {
    const end   = start + 60
    const fmt   = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
    slots.push({ startTime: fmt(start), endTime: fmt(end) })
  }
  return slots
}

/**
 * Get next N dates from today as YYYY-MM-DD strings.
 */
function getNextDates(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected to MongoDB')

  // Clear existing data
  await Turf.deleteMany({})
  await Slot.deleteMany({})
  console.log('🗑  Cleared existing turfs and slots')

  // Insert turfs
  const insertedTurfs = await Turf.insertMany(TURFS)
  console.log(`✅ Inserted ${insertedTurfs.length} turfs`)

  // Generate slots for next 10 days per turf
  const dates    = getNextDates(10)
  const allSlots = []

  for (const turf of insertedTurfs) {
    const timeSlots = generateTimeSlots(
      turf.operatingHours.open,
      turf.operatingHours.close,
    )

    for (const date of dates) {
      for (const { startTime, endTime } of timeSlots) {
        allSlots.push({
          turfId:    turf._id,
          date,
          startTime,
          endTime,
          price:     turf.pricePerHour,
          status:    'available',
        })
      }
    }
  }

  await Slot.insertMany(allSlots, { ordered: false })
  console.log(`✅ Inserted ${allSlots.length} slots across ${insertedTurfs.length} turfs × ${dates.length} days`)

  // Summary
  console.log('\n📋 Turfs seeded:')
  insertedTurfs.forEach((t) =>
    console.log(`   • ${t.name} — ${t.location.city} — ₹${t.pricePerHour}/hr  [${t._id}]`)
  )

  await mongoose.disconnect()
  console.log('\n✅ Seed complete. Disconnected.')
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
