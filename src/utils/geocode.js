'use strict'

const geocodeAddress = async (address, city, pincode) => {
  const query = [address, city, pincode, 'India'].filter(Boolean).join(', ')
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NotOutApp/1.0 (contact@notout.app)' },
    })
    const data = await res.json()
    if (data.length > 0) {
      return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }
    }
  } catch (_) {}

  return { latitude: null, longitude: null }
}

module.exports = { geocodeAddress }
