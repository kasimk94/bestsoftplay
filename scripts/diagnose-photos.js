const { PrismaClient } = require('@prisma/client')
const https = require('https')
const prisma = new PrismaClient()

function fetchFull(url) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { timeout: 8000 }, (res) => {
        let body = ''
        res.on('data', d => body += d)
        res.on('end', () => resolve({ status: res.statusCode, body: body.substring(0, 300), location: res.headers.location }))
      })
      req.on('error', e => resolve({ status: 'ERR', body: e.message }))
      req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT' }) })
    } catch(e) { resolve({ status: 'ERR', body: e.message }) }
  })
}

async function main() {
  const key = process.env.GOOGLE_PLACES_API_KEY
  console.log('API key present:', key ? `YES (${key.length} chars, starts ${key.substring(0,8)}...)` : 'NO')

  const city = await prisma.city.findUnique({ where: { slug: 'manchester' } })
  const venue = await prisma.venue.findFirst({
    where: { cityId: city.id, photoReference: { not: null } },
    select: { name: true, photoUrl: true, photoReference: true },
  })

  console.log('\nVenue:', venue.name)
  console.log('photoUrl:', venue.photoUrl?.substring(0, 80))
  console.log('photoRef:', venue.photoReference?.substring(0, 60))

  // Test old Places API endpoint
  if (key && venue.photoReference) {
    const oldUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${encodeURIComponent(venue.photoReference)}&key=${key}`
    console.log('\nOld Places API test:')
    const r1 = await fetchFull(oldUrl)
    console.log('  status:', r1.status)
    console.log('  location:', r1.location)
    console.log('  body:', r1.body.substring(0, 200))
  }

  // Test new Places API endpoint (photo resource names)
  // New format: https://places.googleapis.com/v1/{name}/media?maxHeightPx=400&key=...
  if (key && venue.photoReference) {
    const newUrl = `https://places.googleapis.com/v1/${venue.photoReference}/media?maxHeightPx=400&key=${key}`
    console.log('\nNew Places API test:')
    const r2 = await fetchFull(newUrl)
    console.log('  status:', r2.status)
    console.log('  location:', r2.location)
    console.log('  body:', r2.body.substring(0, 200))
  }
}

main().finally(() => prisma.$disconnect())
