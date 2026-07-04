/**
 * Refresh venue photos for a given city using the Google Places API v2.
 *
 * Usage: node scripts/refresh-city-photos.js <city-slug>
 * e.g.   node scripts/refresh-city-photos.js london
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')
const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY

const slug = process.argv[2]
if (!slug) { console.error('Usage: node scripts/refresh-city-photos.js <city-slug>'); process.exit(1) }

function get(url, headers = {}) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { timeout: 12000, headers }, (res) => {
        let body = ''
        res.on('data', d => body += d)
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(body) }) }
          catch { resolve({ status: res.statusCode, data: null }) }
        })
      })
      req.on('error', () => resolve({ status: 'ERR', data: null }))
      req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', data: null }) })
    } catch { resolve({ status: 'ERR', data: null }) }
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function getPhotoNames(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?key=${API_KEY}&fields=photos`
  const r = await get(url, { 'X-Goog-FieldMask': 'photos' })
  if (r.status !== 200 || !r.data?.photos) return []
  return r.data.photos.slice(0, 3).map(p => p.name)
}

async function getPhotoUrl(photoName) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&key=${API_KEY}&skipHttpRedirect=true`
  const r = await get(url)
  if (r.status !== 200 || !r.data?.photoUri) return null
  return r.data.photoUri
}

async function main() {
  if (!API_KEY) { console.error('GOOGLE_PLACES_API_KEY not set'); process.exit(1) }

  const city = await prisma.city.findUnique({ where: { slug } })
  if (!city) { console.error(`City "${slug}" not found`); process.exit(1) }

  const venues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: { id: true, name: true, googlePlaceId: true, photoUrl: true },
  })

  const withPlaceId = venues.filter(v => v.googlePlaceId)
  const beforeMissing = venues.filter(v => !v.photoUrl).length

  console.log(`\n=== ${city.name} photo refresh ===`)
  console.log(`Total venues: ${venues.length}`)
  console.log(`With googlePlaceId: ${withPlaceId.length}`)
  console.log(`Missing photoUrl before: ${beforeMissing}\n`)

  let updated = 0, noApiPhotos = 0, failed = 0

  for (let i = 0; i < withPlaceId.length; i++) {
    const v = withPlaceId[i]
    process.stdout.write(`[${i + 1}/${withPlaceId.length}] ${v.name.substring(0, 45).padEnd(45)} `)

    const photoNames = await getPhotoNames(v.googlePlaceId)
    if (photoNames.length === 0) {
      console.log('— no photos in Google')
      noApiPhotos++
      await sleep(120)
      continue
    }

    const urls = await Promise.all(photoNames.map(getPhotoUrl))
    const [url1, url2, url3] = urls

    if (!url1) {
      console.log('— media URL failed')
      failed++
      await sleep(120)
      continue
    }

    await prisma.venue.update({
      where: { id: v.id },
      data: {
        photoUrl: url1 ?? null,
        photoUrl2: url2 ?? null,
        photoUrl3: url3 ?? null,
        photoReference: photoNames[0] ?? null,
        photoReference2: photoNames[1] ?? null,
        photoReference3: photoNames[2] ?? null,
      },
    })
    const count = urls.filter(Boolean).length
    console.log(`✓ ${count} photo${count !== 1 ? 's' : ''}`)
    updated++
    await sleep(120)
  }

  const afterVenues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: { photoUrl: true },
  })
  const afterMissing = afterVenues.filter(v => !v.photoUrl).length

  console.log(`\n=== ${city.name} done ===`)
  console.log(`  Updated:          ${updated}`)
  console.log(`  No Google photos: ${noApiPhotos}`)
  console.log(`  Failed:           ${failed}`)
  console.log(`  Missing photoUrl: ${beforeMissing} → ${afterMissing} (fixed ${beforeMissing - afterMissing})`)
}

main().finally(() => prisma.$disconnect())
