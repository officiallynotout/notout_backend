'use strict'

require('dotenv').config()

const fs             = require('fs')
const path           = require('path')
const { PrismaClient } = require('@prisma/client')
const { encryptAES, hashPhone } = require('../src/utils/encrypt')

const prisma = new PrismaClient()

const getImageUrls = (folderName) => {
  const folderPath = path.join(__dirname, '../public/turf-images', folderName)
  if (!fs.existsSync(folderPath)) return []
  return fs.readdirSync(folderPath)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort()
    .map(f => `/turf-images/${folderName}/${f}`)
}

const USERS = [
  { name: 'Rahul Sharma', phone: '9876543210', role: 'user' },
  { name: 'Priya Mehta',  phone: '9123456780', role: 'user' },
  { name: 'Admin User',   phone: '9000000001', role: 'admin' },
]

const TURFS = [
  {
    name:         'Kelghar',
    description:  'Premium box cricket turf in Vesu with excellent playing surface and modern facilities.',
    address:      '2, beside Empire Regency, next to Maruti Suzuki Kataria Shop, Vesu, Surat',
    city:         'Surat',
    pincode:      '395007',
    amenities:    ['Floodlights', 'Parking', 'Changing Room', 'Water', 'First Aid'],
    imageFolder:  'kelghar',
    pricePerHour: 1000,
    openTime:     '06:00',
    closeTime:    '23:00',
    latitude:     21.1453,
    longitude:    72.7795,
    boxes:        ['Box 1', 'Box 2'],
  },
  {
    name:         'Rebounce',
    description:  'Well-maintained cricket turf near Prime Shoppers, Vesu, with ample parking.',
    address:      '4QW8+32, next to Prime Shoppers, opp. Happy Residency, Vesu, Surat',
    city:         'Surat',
    pincode:      '395007',
    amenities:    ['Floodlights', 'Parking', 'Changing Room', 'Water'],
    imageFolder:  'rebounce',
    pricePerHour: 900,
    openTime:     '06:00',
    closeTime:    '23:00',
    latitude:     21.1468,
    longitude:    72.7812,
    boxes:        ['Box 1', 'Box 2'],
  },
  {
    name:         'Smashup Turf',
    description:  'Top-quality box cricket facility on Vesu Canal Road with floodlit courts.',
    address:      'RCC, Plot No 62, Vesu Canal Rd, near Shyam Sangini, Vesu, Surat',
    city:         'Surat',
    pincode:      '395007',
    amenities:    ['Floodlights', 'Parking', 'Changing Room', 'Water', 'First Aid'],
    imageFolder:  'smashup-turf',
    pricePerHour: 800,
    openTime:     '06:00',
    closeTime:    '23:00',
    latitude:     21.1441,
    longitude:    72.7780,
    boxes:        ['Box 1', 'Box 2'],
  },
  {
    name:         'HeminOm Turf',
    description:  'Affordable cricket turf in Bhimrad with good playing surface and night facility.',
    address:      '4RQ2+6HX, Bhimrad-Althan Rd, Bhimrad, Surat',
    city:         'Surat',
    pincode:      '395007',
    amenities:    ['Floodlights', 'Parking', 'Changing Room', 'Water'],
    imageFolder:  'hemiom-turf',
    pricePerHour: 800,
    openTime:     '06:00',
    closeTime:    '23:00',
    latitude:     21.1512,
    longitude:    72.7850,
    boxes:        ['Box 1', 'Box 2'],
  },
  {
    name:         'Miraaj Turf',
    description:  'Spacious cricket facility at Miraaj Sports Club on VIP Road, opposite Metro Mall.',
    address:      'Miraaj Sports Club, VIP Rd, opp. Metro Mall, Anand Park, Althan, Surat',
    city:         'Surat',
    pincode:      '395017',
    amenities:    ['Floodlights', 'Parking', 'Changing Room', 'Water', 'Cafeteria', 'First Aid'],
    imageFolder:  'miraaj-turf',
    pricePerHour: 1000,
    openTime:     '06:00',
    closeTime:    '23:00',
    latitude:     21.1388,
    longitude:    72.7901,
    boxes:        ['Box 1', 'Box 2', 'Box 3'],
  },
  {
    name:         'K2 By Kinaara',
    description:  'Modern box cricket turf in Bharthana with professional-grade pitch and facilities.',
    address:      'Bharthana, Surat',
    city:         'Surat',
    pincode:      '395007',
    amenities:    ['Floodlights', 'Parking', 'Changing Room', 'Water', 'First Aid'],
    imageFolder:  'k2-by-kinaara',
    pricePerHour: 900,
    openTime:     '06:00',
    closeTime:    '23:00',
    latitude:     21.1495,
    longitude:    72.7760,
    boxes:        ['Box 1', 'Box 2'],
  },
  {
    name:         'CB Patel Turf Vesu',
    description:  'Established cricket turf on Vesu Canal Road near Raj Mandir Plaza.',
    address:      'Vesu Canal Rd, nr. Raj Mandir Plaza, opp. Surya Residency, Surat',
    city:         'Surat',
    pincode:      '395007',
    amenities:    ['Floodlights', 'Parking', 'Changing Room', 'Water'],
    imageFolder:  'cb-patel-turf',
    pricePerHour: 900,
    openTime:     '06:00',
    closeTime:    '23:00',
    latitude:     21.1432,
    longitude:    72.7768,
    boxes:        ['Box 1', 'Box 2', 'Box 3'],
  },
]

const generateSlots = (turfId, boxId, pricePerHour, openTime, closeTime, daysAhead = 14) => {
  const slots    = []
  const today    = new Date()
  const openHour  = parseInt(openTime.split(':')[0], 10)
  const closeHour = parseInt(closeTime.split(':')[0], 10)

  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() + d)
    const dateStr = date.toISOString().split('T')[0]

    for (let hour = openHour; hour < closeHour; hour++) {
      slots.push({
        turfId,
        boxId,
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
  await prisma.box.deleteMany()
  await prisma.turf.deleteMany()
  await prisma.user.deleteMany()
  console.log('Cleared existing data.')

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

  console.log('Creating turfs, boxes, and slots...')
  for (const t of TURFS) {
    const { boxes: boxNames, imageFolder, ...turfData } = t
    const images = getImageUrls(imageFolder)

    const turf = await prisma.turf.create({ data: { ...turfData, images } })

    if (images.length === 0) {
      console.log(`  ⚠️  No images found for "${turf.name}" — add images to public/turf-images/${imageFolder}/`)
    }

    let totalSlots = 0
    for (const boxName of boxNames) {
      const box   = await prisma.box.create({ data: { turfId: turf.id, name: boxName } })
      const slots = generateSlots(turf.id, box.id, turf.pricePerHour, turf.openTime, turf.closeTime)
      await prisma.slot.createMany({ data: slots })
      totalSlots += slots.length
    }
    console.log(`  ✅ ${turf.name} -> ${boxNames.length} boxes, ${totalSlots} slots, ${images.length} images`)
  }

  console.log('\nSeeding complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
