/**
 * Refresh Manchester venue photos using the Google Places API v2.
 *
 * For each venue with a googlePlaceId:
 *   1. Fetch up to 3 photo names from places.googleapis.com/v1/places/{id}
 *   2. Resolve each photo name to a fresh CDN URL via the /media endpoint
 *   3. Update photoUrl/2/3 (CDN URLs) and photoReference/2/3 (stable names)
 *
 * Run: node scripts/refresh-manchester-photos.js
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')
const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY

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

  const city = await prisma.city.findUnique({ where: { slug: 'manchester' } })
  const venues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: {
      id: true, name: true, googlePlaceId: true,
      photoUrl: true, photoUrl2: true, photoUrl3: true,
    },
  })

  const total = venues.length
  const withPlaceId = venues.filter(v => v.googlePlaceId)
  const beforeMissingAll = venues.filter(v => !v.photoUrl && !v.photoUrl2 && !v.photoUrl3).length
  console.log(`\nManchester: ${total} total venues`)
  console.log(`  With googlePlaceId: ${withPlaceId.length}`)
  console.log(`  Missing ALL photos before: ${beforeMissingAll}\n`)

  let updated = 0, skipped = 0, failed = 0

  for (let i = 0; i < withPlaceId.length; i++) {
    const v = withPlaceId[i]
    process.stdout.write(`[${i + 1}/${withPlaceId.length}] ${v.name.substring(0, 45).padEnd(45)} `)

    const photoNames = await getPhotoNames(v.googlePlaceId)
    if (photoNames.length === 0) {
      console.log('— no photos from API')
      skipped++
      await sleep(150)
      continue
    }

    // Resolve up to 3 CDN URLs concurrently
    const urls = await Promise.all(photoNames.map(getPhotoUrl))
    const [url1, url2, url3] = urls
    const ref1 = photoNames[0] ?? null
    const ref2 = photoNames[1] ?? null
    const ref3 = photoNames[2] ?? null

    if (!url1) {
      console.log('— media URL failed')
      failed++
      await sleep(150)
      continue
    }

    await prisma.venue.update({
      where: { id: v.id },
      data: {
        photoUrl: url1 ?? null,
        photoUrl2: url2 ?? null,
        photoUrl3: url3 ?? null,
        photoReference: ref1,
        photoReference2: ref2,
        photoReference3: ref3,
      },
    })
    const count = urls.filter(Boolean).length
    console.log(`✓ ${count} photo${count !== 1 ? 's' : ''} updated`)
    updated++
    await sleep(120) // ~8 req/s — well within quota
  }

  // After stats
  const afterVenues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: { photoUrl: true },
  })
  const afterMissingAll = afterVenues.filter(v => !v.photoUrl).length

  console.log(`\n=== Done ===`)
  console.log(`  Updated:  ${updated}`)
  console.log(`  Skipped (no API photos): ${skipped}`)
  console.log(`  Failed:   ${failed}`)
  console.log(`\n  Missing ALL photos before: ${beforeMissingAll}`)
  console.log(`  Missing ALL photos after:  ${afterMissingAll}`)
  console.log(`  Improvement: ${beforeMissingAll - afterMissingAll} venues now have photos`)
}

main().finally(() => prisma.$disconnect())
