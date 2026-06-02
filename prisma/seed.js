'use strict'

require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const { encryptAES, hashPhone } = require('../src/utils/encrypt')

const prisma = new PrismaClient()

const USERS = [
  { name: 'Rahul Sharma', phone: '9876543210', role: 'user' },
  { name: 'Priya Mehta',  phone: '9123456780', role: 'user' },
  { name: 'Admin User',   phone: '9000000001', role: 'admin' },
]

const TURFS = [
  {
    name:         'GreenField Box Cricket',
    description:  'Premium box cricket turf with floodlights and artificial turf.',
    address:      '12, Sports Complex Road, Andheri West',
    city:         'Mumbai',
    pincode:      '400058',
    amenities:    ['Floodlights', 'Parking', 'Changing Room', 'Water', 'First Aid'],
    pricePerHour: 800,
    openTime:     '06:00',
    closeTime:    '23:00',
    isActive:     true,
  },
  {
    name:         'PlayZone Cricket Arena',
    description:  'Affordable turf near FC Road with quality playing surface.',
    address:      '45, FC Road, Shivajinagar',
    city:         'Pune',
    pincode:      '411004',
    amenities:    ['Floodlights', 'Parking', 'Cafeteria', 'Changing Room'],
    pricePerHour: 600,
    openTime:     '06:00',
    closeTime:    '23:00',
    isActive:     true,
  },
  {
    name:         'Champions Turf',
    description:  'Professional-grade box cricket facility in Kondapur.',
    address:      '8, IT Park Lane, Kondapur',
    city:         'Hyderabad',
    pincode:      '500084',
    amenities:    ['Floodlights', 'Parking', 'Changing Room', 'Scoreboard'],
    pricePerHour: 700,
    openTime:     '06:00',
    closeTime:    '23:00',
    isActive:     true,
  },
]

const generateSlots = (turfId, pricePerHour, daysAhead = 14) => {
  const slots = []
  const today = new Date()

  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() + d)
    const dateStr = date.toISOString().split('T')[0]

    for (let hour = 6; hour < 23; hour++) {
      slots.push({
        turfId,
        date:      dateStr,
        startTime: `${String(hour).padStart(2, '0')}:00`,
        endTime:   `${String(hour + 1).padStart(2, '0')}:00`,
        price:     pricePerHour,
        status:    'available',
      })
    }
  }
  return slots
}

async function main() {
  console.log('Seeding database...')

  await prisma.booking.deleteMany()
  await prisma.slot.deleteMany()
  await prisma.turf.deleteMany()
  await prisma.user.deleteMany()

  console.log('Creating users...')
  for (const u of USERS) {
    await prisma.user.create({
      data: {
        name:       u.name,
        phone:      encryptAES(u.phone),
        phoneHash:  hashPhone(u.phone),
        role:       u.role,
        isVerified: true,
      },
    })
  }
  console.log(`  ${USERS.length} users created`)

  console.log('Creating turfs and slots...')
  for (const t of TURFS) {
    const turf  = await prisma.turf.create({ data: t })
    const slots = generateSlots(turf.id, turf.pricePerHour)
    await prisma.slot.createMany({ data: slots })
    console.log(`  ${turf.name} -> ${slots.length} slots`)
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
