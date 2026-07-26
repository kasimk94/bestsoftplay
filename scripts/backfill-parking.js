#!/usr/bin/env node
/**
 * Backfill the `parking` field (Yes/No/Unknown) for every existing venue with
 * a googlePlaceId, using the New Places API's parkingOptions field. Venues
 * without a googlePlaceId are left as "Unknown" (the column default) since
 * there's no reliable way to look them up.
 *
 * Usage:
 *   node scripts/backfill-parking.js              backfill all venues
 *   node scripts/backfill-parking.js --limit=20   test on the first 20 only
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')

const prisma = new PrismaClient()

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!GOOGLE_PLACES_API_KEY) {
  console.error('❌  GOOGLE_PLACES_API_KEY is not set')
  process.exit(1)
}

const BATCH_SIZE = 20
const DELAY_BETWEEN_BATCHES_MS = 500

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const PARKING_TRUE_KEYS = [
  'freeParkingLot', 'paidParkingLot', 'freeStreetParking', 'paidStreetParking',
  'valetParking', 'freeGarageParking', 'paidGarageParking',
]

/** Returns 'Yes' | 'No' | 'Unknown'. Google omits parkingOptions entirely when
 * it has no data for a place — that's the only reliable "unknown" signal. */
function getParkingStatus(placeId) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'places.googleapis.com',
      path: `/v1/places/${placeId}`,
      method: 'GET',
      headers: { 'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': 'id,parkingOptions' },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (!json.parkingOptions) return resolve('Unknown')
          resolve(PARKING_TRUE_KEYS.some((k) => json.parkingOptions[k] === true) ? 'Yes' : 'No')
        } catch {
          resolve('Unknown')
        }
      })
    })
    req.on('error', () => resolve('Unknown'))
    req.setTimeout(10000, () => { req.destroy(); resolve('Unknown') })
    req.end()
  })
}

// The Railway Postgres proxy occasionally drops long-lived connections (P1017).
async function reconnectWithRetry(attempt = 1) {
  try {
    await prisma.$disconnect()
    await prisma.$connect()
  } catch (err) {
    if (attempt >= 5) throw err
    const delay = 2000 * attempt
    console.warn(`    ⚠ Reconnect failed (attempt ${attempt}): ${err.message} — retrying in ${delay}ms...`)
    await sleep(delay)
    return reconnectWithRetry(attempt + 1)
  }
}

async function updateVenueWithRetry(id, parking, attempt = 1) {
  try {
    await prisma.venue.update({ where: { id }, data: { parking } })
  } catch (err) {
    if (attempt >= 5) throw err
    console.warn(`    ⚠ DB update failed (attempt ${attempt}): ${err.message} — reconnecting...`)
    await reconnectWithRetry()
    await sleep(1000)
    return updateVenueWithRetry(id, parking, attempt + 1)
  }
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined

  console.log('🅿️  Backfilling venue parking data\n')

  const withPlaceId = await prisma.venue.findMany({
    where: { googlePlaceId: { not: null } },
    select: { id: true, name: true, googlePlaceId: true },
    orderBy: { name: 'asc' },
    ...(limit ? { take: limit } : {}),
  })
  const withoutPlaceId = await prisma.venue.count({ where: { googlePlaceId: null } })

  console.log(`${withPlaceId.length} venue(s) with a Google Place ID to check`)
  console.log(`${withoutPlaceId} venue(s) without one — left as "Unknown"\n`)

  const counts = { Yes: 0, No: 0, Unknown: 0 }
  let processed = 0

  for (let i = 0; i < withPlaceId.length; i += BATCH_SIZE) {
    const batch = withPlaceId.slice(i, i + BATCH_SIZE)

    for (const venue of batch) {
      const parking = await getParkingStatus(venue.googlePlaceId)
      try {
        await updateVenueWithRetry(venue.id, parking)
        counts[parking]++
      } catch (err) {
        console.error(`    ❌ Giving up on "${venue.name}" after repeated DB errors: ${err.message}`)
      }
      processed++
    }

    console.log(`Processed ${processed}/${withPlaceId.length} venues`)

    if (processed % 100 === 0) {
      try {
        await reconnectWithRetry()
      } catch (err) {
        console.warn(`    ⚠ Periodic reconnect failed, continuing on existing connection: ${err.message}`)
      }
    }

    if (i + BATCH_SIZE < withPlaceId.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS)
    }
  }

  console.log(`\n✅ Done.`)
  console.log(`   Yes: ${counts.Yes}`)
  console.log(`   No: ${counts.No}`)
  console.log(`   Unknown (checked, no data): ${counts.Unknown}`)
  console.log(`   Unknown (no Place ID to check): ${withoutPlaceId}`)
  console.log(`   Total Unknown: ${counts.Unknown + withoutPlaceId}`)
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
