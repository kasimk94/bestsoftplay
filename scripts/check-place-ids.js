const { PrismaClient } = require('@prisma/client')
const https = require('https')
const prisma = new PrismaClient()

function fetchJson(url, headers = {}) {
  return new Promise((resolve) => {
    try {
      const opts = { timeout: 10000, headers }
      const req = https.get(url, opts, (res) => {
        let body = ''
        res.on('data', d => body += d)
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(body) }) }
          catch { resolve({ status: res.statusCode, data: body.substring(0, 200) }) }
        })
      })
      req.on('error', e => resolve({ status: 'ERR', data: e.message }))
      req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT' }) })
    } catch(e) { resolve({ status: 'ERR', data: e.message }) }
  })
}

async function main() {
  const key = process.env.GOOGLE_PLACES_API_KEY

  for (const slug of ['london', 'birmingham', 'manchester']) {
    const city = await prisma.city.findUnique({ where: { slug } })
    const total = await prisma.venue.count({ where: { cityId: city.id } })
    const hasPlaceId = await prisma.venue.count({ where: { cityId: city.id, googlePlaceId: { not: null } } })
    console.log(`${slug.padEnd(12)}: ${hasPlaceId}/${total} have googlePlaceId`)
  }

  // Test new Places API v2 with a Manchester venue
  const city = await prisma.city.findUnique({ where: { slug: 'manchester' } })
  const venue = await prisma.venue.findFirst({
    where: { cityId: city.id, googlePlaceId: { not: null } },
    select: { name: true, googlePlaceId: true },
  })

  if (!venue) { console.log('\nNo venue with googlePlaceId found'); return }
  console.log(`\nTesting new Places API v2 with: ${venue.name} (${venue.googlePlaceId})`)

  // New Places API - get place details including photos
  const placeUrl = `https://places.googleapis.com/v1/places/${venue.googlePlaceId}?key=${key}&fields=photos`
  const r = await fetchJson(placeUrl, { 'X-Goog-FieldMask': 'photos' })
  console.log('Status:', r.status)
  if (r.data && r.data.photos) {
    const photo = r.data.photos[0]
    console.log('First photo name:', photo.name)

    // Now fetch the actual media URL
    const mediaUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&key=${key}&skipHttpRedirect=true`
    const r2 = await fetchJson(mediaUrl)
    console.log('Media status:', r2.status)
    console.log('Photo URI:', r2.data?.photoUri?.substring(0, 80))
  } else {
    console.log('Response:', JSON.stringify(r.data).substring(0, 300))
  }
}

main().finally(() => prisma.$disconnect())
