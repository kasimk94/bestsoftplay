#!/usr/bin/env node
/**
 * Sync soft play venues from Overpass + Google Places + Claude AI descriptions.
 * Usage: node scripts/sync-venues.js
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')

const prisma = new PrismaClient()

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!GOOGLE_PLACES_API_KEY) {
  console.error('❌  GOOGLE_PLACES_API_KEY is not set')
  process.exit(1)
}
if (!ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY is not set')
  process.exit(1)
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: options.headers || {} }, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error(`JSON parse error: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body)
    const urlObj = new URL(url)

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers,
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error(`JSON parse error: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    req.write(bodyStr)
    req.end()
  })
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Overpass ──────────────────────────────────────────────────────────────

const CITY_BBOXES = {
  london: { south: 51.28, west: -0.51, north: 51.69, east: 0.33 },
  birmingham: { south: 52.38, west: -2.1, north: 52.6, east: -1.6 },
  manchester: { south: 53.35, west: -2.45, north: 53.65, east: -1.95 },
}

async function fetchOverpassVenues(citySlug) {
  const bb = CITY_BBOXES[citySlug]
  const bbox = `${bb.south},${bb.west},${bb.north},${bb.east}`

  const query = `
    [out:json][timeout:30];
    (
      node["leisure"="playground"]["indoor"="yes"](${bbox});
      node["leisure"="soft_play"](${bbox});
      way["leisure"="playground"]["indoor"="yes"](${bbox});
      way["leisure"="soft_play"](${bbox});
      node["amenity"="soft_play"](${bbox});
      way["amenity"="soft_play"](${bbox});
    );
    out center;
  `

  const encoded = encodeURIComponent(query)
  console.log(`  → Querying Overpass for ${citySlug}...`)

  const data = await fetchJson(`https://overpass-api.de/api/interpreter?data=${encoded}`)
  return (data.elements || []).filter(
    (el) => el.tags && el.tags.name && el.tags.name.trim().length > 2
  )
}

// ─── Google Places ─────────────────────────────────────────────────────────

async function getGooglePlaceDetails(name, lat, lng) {
  try {
    // Find place by text search
    const searchUrl =
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
      `?input=${encodeURIComponent(name + ' soft play')}` +
      `&inputtype=textquery` +
      `&locationbias=circle:1000@${lat},${lng}` +
      `&fields=place_id,name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,geometry,photos` +
      `&key=${GOOGLE_PLACES_API_KEY}`

    const searchRes = await fetchJson(searchUrl)
    const candidate = searchRes.candidates?.[0]
    if (!candidate) return null

    // Get full details
    const detailUrl =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${candidate.place_id}` +
      `&fields=place_id,name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,geometry,photos` +
      `&key=${GOOGLE_PLACES_API_KEY}`

    const detailRes = await fetchJson(detailUrl)
    return detailRes.result ?? null
  } catch (err) {
    console.warn(`    ⚠ Google Places error: ${err.message}`)
    return null
  }
}

// ─── Claude description ────────────────────────────────────────────────────

async function generateDescription(venueName, address, features) {
  try {
    const res = await postJson(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [
          {
            role: 'user',
            content:
              `Write a clean 2-sentence description for a UK soft play venue called "${venueName}" ` +
              `located at ${address}. Features: ${features.join(', ')}. ` +
              `Be warm, factual, and helpful for parents. No marketing fluff.`,
          },
        ],
      },
      {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      }
    )

    return res.content?.[0]?.text?.trim() ?? null
  } catch (err) {
    console.warn(`    ⚠ Claude error: ${err.message}`)
    return null
  }
}

// ─── Area detection ────────────────────────────────────────────────────────

async function findOrCreateArea(cityRecord, address, postcode) {
  // Simple heuristic: find a matching area name in the address string
  const areas = await prisma.area.findMany({ where: { cityId: cityRecord.id } })

  for (const area of areas) {
    if (
      address.toLowerCase().includes(area.name.toLowerCase()) ||
      address.toLowerCase().includes(area.slug.replace(/-/g, ' '))
    ) {
      return area
    }
  }

  // Default to first area
  return areas[0] ?? null
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function syncCity(citySlug) {
  console.log(`\n📍 Syncing ${citySlug}...`)

  const cityRecord = await prisma.city.findUnique({ where: { slug: citySlug } })
  if (!cityRecord) {
    console.error(`  ❌ City "${citySlug}" not found in database. Run prisma seed first.`)
    return
  }

  const elements = await fetchOverpassVenues(citySlug)
  console.log(`  Found ${elements.length} raw elements from Overpass`)

  let synced = 0
  let skipped = 0

  for (const el of elements) {
    const name = el.tags.name
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon

    if (!lat || !lng) {
      skipped++
      continue
    }

    const slug = slugify(name)
    console.log(`\n  🎪 ${name}`)

    // Google Places
    await sleep(200) // rate limit
    const place = await getGooglePlaceDetails(name, lat, lng)

    const address = place?.formatted_address ?? el.tags['addr:street'] ?? el.tags.address ?? ''
    const postcode = el.tags['addr:postcode'] ?? ''
    const phone = place?.formatted_phone_number ?? el.tags.phone ?? null
    const website = place?.website ?? el.tags.website ?? null
    const googleRating = place?.rating ?? null
    const googleReviewCount = place?.user_ratings_total ?? null
    const googlePlaceId = place?.place_id ?? null
    const openingHours = place?.opening_hours?.weekday_text ?? null
    const photoReference = place?.photos?.[0]?.photo_reference ?? null

    // Features
    const features = []
    if (el.tags['playground:equipment']) features.push('Play equipment')
    if (el.tags['toilets'] === 'yes' || el.tags['toilets:wheelchair'] === 'yes') features.push('Toilets')
    if (el.tags['cafe'] === 'yes' || el.tags['restaurant'] === 'yes') features.push('Café')
    if (el.tags['parking'] === 'yes') features.push('Parking')
    if (el.tags['wheelchair'] === 'yes') features.push('Accessible')

    // Area
    const area = await findOrCreateArea(cityRecord, address, postcode)
    if (!area) {
      console.warn(`    ⚠ No area found for ${name}, skipping`)
      skipped++
      continue
    }

    // Claude description
    let description = null
    if (address) {
      await sleep(300)
      description = await generateDescription(name, address, features)
    }

    if (description) console.log(`    ✅ Description: ${description.slice(0, 60)}...`)
    if (googleRating) console.log(`    ⭐ Rating: ${googleRating} (${googleReviewCount} reviews)`)
    if (photoReference) console.log(`    📷 Photo reference found`)

    // Upsert
    await prisma.venue.upsert({
      where: { slug },
      update: {
        name,
        address: address || `${name}, ${cityRecord.name}`,
        postcode,
        lat,
        lng,
        phone,
        website,
        googlePlaceId,
        googleRating,
        googleReviewCount,
        photoReference,
        description,
        features,
        openingHours: openingHours ? { weekdays: openingHours } : undefined,
        areaId: area.id,
        cityId: cityRecord.id,
      },
      create: {
        slug,
        name,
        address: address || `${name}, ${cityRecord.name}`,
        postcode,
        lat,
        lng,
        phone,
        website,
        googlePlaceId,
        googleRating,
        googleReviewCount,
        photoReference,
        description,
        features,
        openingHours: openingHours ? { weekdays: openingHours } : undefined,
        areaId: area.id,
        cityId: cityRecord.id,
      },
    })

    synced++
  }

  console.log(`\n  ✅ ${citySlug}: ${synced} synced, ${skipped} skipped`)
}

async function main() {
  console.log('🎊  BestSoftPlay venue sync\n')
  console.log('─'.repeat(50))

  try {
    await syncCity('london')
    await syncCity('birmingham')
    await syncCity('manchester')

    const total = await prisma.venue.count()
    console.log(`\n✅ Sync complete. Total venues in DB: ${total}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  prisma.$disconnect()
  process.exit(1)
})
