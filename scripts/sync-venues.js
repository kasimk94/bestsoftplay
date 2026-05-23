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

// ─── HTTP helpers ──────────────────────────────────────────────────────────

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'BestSoftPlay/1.0 (bestsoftplay.co.uk)' } }, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')) })
  })
}

function postForm(url, params) {
  return new Promise((resolve, reject) => {
    const bodyStr = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Accept': 'application/json',
        'User-Agent': 'BestSoftPlay/1.0 (bestsoftplay.co.uk)',
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Request timeout')) })
    req.write(bodyStr)
    req.end()
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
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')) })
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
  london:     { south: 51.28, west: -0.51, north: 51.69, east:  0.33 },
  birmingham: { south: 52.38, west: -2.10, north: 52.60, east: -1.60 },
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

  console.log(`  → Querying Overpass...`)
  const data = await postForm('https://overpass-api.de/api/interpreter', { data: query })
  return (data.elements || []).filter(
    (el) => el.tags && el.tags.name && el.tags.name.trim().length > 2
  )
}

// ─── Google Places text search ─────────────────────────────────────────────

const CITY_NAMES = {
  london: 'London',
  birmingham: 'Birmingham',
  manchester: 'Manchester',
}

const SEARCH_TERMS = [
  'soft play',
  'indoor play centre',
  'kids play area',
  'children soft play',
]

async function searchGooglePlacesVenues(cityName) {
  const seen = new Set()
  const results = []

  for (const term of SEARCH_TERMS) {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${term} ${cityName}`)}&key=${GOOGLE_PLACES_API_KEY}`

    let res
    try {
      res = await fetchJson(url)
    } catch (err) {
      console.warn(`  ⚠ Google text search error (${term}): ${err.message}`)
      continue
    }

    if (res.status !== 'OK' && res.status !== 'ZERO_RESULTS') {
      console.warn(`  ⚠ Google text search (${term}): ${res.status}`)
      continue
    }

    const batch = res.results || []
    let newCount = 0
    for (const r of batch) {
      if (!seen.has(r.place_id)) {
        seen.add(r.place_id)
        results.push(r)
        newCount++
      }
    }
    console.log(`  → "${term} ${cityName}": ${batch.length} results, ${newCount} new`)
    await sleep(500)
  }

  return results
}

// ─── Google Places detail lookup ───────────────────────────────────────────

async function getGooglePlaceDetails(name, lat, lng) {
  try {
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

async function getGooglePlaceById(placeId) {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=place_id,name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,geometry,photos` +
      `&key=${GOOGLE_PLACES_API_KEY}`
    const res = await fetchJson(url)
    return res.result ?? null
  } catch (err) {
    console.warn(`    ⚠ Google Place Details error: ${err.message}`)
    return null
  }
}

// ─── Photo selection ───────────────────────────────────────────────────────

/**
 * Pick the best photo reference from a Google Places photos array.
 * Filters out obvious banners/flyers (width > height * 1.5 = very landscape),
 * then picks the photo with aspect ratio closest to 1:1 (most likely an interior shot).
 */
function pickBestPhotoRef(photos) {
  if (!photos || photos.length === 0) return null

  // Skip very-wide landscape images (flyers, banners, menu boards)
  const notBanner = photos.filter(p => p.width <= p.height * 1.5)
  const pool = notBanner.length > 0 ? notBanner : photos // fall back to all if everything is landscape

  // Sort by closeness to 1:1 aspect ratio — interior shots tend to be squarish
  const sorted = [...pool].sort((a, b) => {
    const aScore = Math.abs(a.width / a.height - 1)
    const bScore = Math.abs(b.width / b.height - 1)
    return aScore - bScore
  })

  return sorted[0]?.photo_reference ?? null
}

// ─── Google Places photo URL ───────────────────────────────────────────────

function resolvePhotoUrl(photoReference, maxWidth = 800) {
  return new Promise((resolve) => {
    const url =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=${maxWidth}&photo_reference=${encodeURIComponent(photoReference)}&key=${GOOGLE_PLACES_API_KEY}`

    const req = https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        resolve(res.headers.location ?? null)
      } else {
        resolve(null)
      }
      res.destroy()
    })
    req.on('error', () => resolve(null))
    req.setTimeout(10000, () => { req.destroy(); resolve(null) })
  })
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
              `Write a 2-sentence description for a UK soft play venue called "${venueName}" ` +
              `at ${address}. Features: ${features.join(', ') || 'indoor play area'}. ` +
              `Be warm and factual for parents. Plain text only, no markdown headings or formatting.`,
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
  const areas = await prisma.area.findMany({ where: { cityId: cityRecord.id } })
  for (const area of areas) {
    if (
      address.toLowerCase().includes(area.name.toLowerCase()) ||
      address.toLowerCase().includes(area.slug.replace(/-/g, ' '))
    ) {
      return area
    }
  }
  return areas[0] ?? null
}

// ─── Process a single venue ────────────────────────────────────────────────

async function processVenue({ name, lat, lng, place, osmTags, cityRecord }) {
  const slug = slugify(name)
  const address = place?.formatted_address ?? osmTags?.['addr:street'] ?? osmTags?.address ?? ''
  const postcode = osmTags?.['addr:postcode'] ?? ''
  const phone = place?.formatted_phone_number ?? osmTags?.phone ?? null
  const website = place?.website ?? osmTags?.website ?? null
  const googleRating = place?.rating ?? null
  const googleReviewCount = place?.user_ratings_total ?? null
  const googlePlaceId = place?.place_id ?? null
  const openingHours = place?.opening_hours?.weekday_text ?? null
  const allPhotos = place?.photos?.slice(0, 10) ?? []
  const photoReference = pickBestPhotoRef(allPhotos)
  // Keep runner-up refs as fallback in case CDN URL expires
  const usedRef = photoReference
  const remaining = allPhotos.filter(p => p.photo_reference !== usedRef)
  const photoReference2 = pickBestPhotoRef(remaining) ?? null
  const photoReference3 = null

  let photoUrl = null
  if (photoReference) {
    await sleep(100)
    photoUrl = await resolvePhotoUrl(photoReference)
  }

  const features = []
  if (osmTags?.['toilets'] === 'yes') features.push('Toilets')
  if (osmTags?.['cafe'] === 'yes') features.push('Café')
  if (osmTags?.['parking'] === 'yes') features.push('Parking')
  if (osmTags?.['wheelchair'] === 'yes') features.push('Accessible')

  const area = await findOrCreateArea(cityRecord, address, postcode)
  if (!area) {
    console.warn(`    ⚠ No area found, skipping`)
    return false
  }

  let description = null
  if (address) {
    await sleep(300)
    description = await generateDescription(name, address, features)
  }

  if (description) console.log(`    ✅ Description generated`)
  if (googleRating) console.log(`    ⭐ ${googleRating} (${googleReviewCount} reviews)`)
  if (photoUrl) {
    const chosen = allPhotos.find(p => p.photo_reference === photoReference)
    const dims = chosen ? ` [${chosen.width}×${chosen.height}, ${allPhotos.length} photos]` : ''
    console.log(`    📷 Photo resolved${dims}`)
  } else if (photoReference) {
    console.log(`    📷 Photo reference stored (no URL resolved)`)
  } else {
    console.log(`    ⚠ No usable photo found`)
  }

  const data = {
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
    photoReference2,
    photoReference3,
    photoUrl,
    description,
    features,
    openingHours: openingHours ? { weekdays: openingHours } : undefined,
    areaId: area.id,
    cityId: cityRecord.id,
  }

  await prisma.venue.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  })

  return true
}

// ─── Main sync ─────────────────────────────────────────────────────────────

async function syncCity(citySlug) {
  console.log(`\n📍 Syncing ${citySlug}...`)

  const cityRecord = await prisma.city.findUnique({ where: { slug: citySlug } })
  if (!cityRecord) {
    console.error(`  ❌ City "${citySlug}" not found. Run prisma seed first.`)
    return
  }

  // 1. Fetch from Overpass
  const osmElements = await fetchOverpassVenues(citySlug)
  console.log(`  Found ${osmElements.length} Overpass elements`)

  // 2. Fetch from Google Places text search (up to 60 results)
  const googleResults = await searchGooglePlacesVenues(CITY_NAMES[citySlug])
  console.log(`  Found ${googleResults.length} Google Places results`)

  // 3. Track seen place IDs to deduplicate
  const seenPlaceIds = new Set(googleResults.map((r) => r.place_id))

  // 4. For OSM venues, look up Google details and filter out duplicates
  const osmOnlyVenues = []
  for (const el of osmElements) {
    const name = el.tags.name
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!lat || !lng) continue

    await sleep(250)
    const place = await getGooglePlaceDetails(name, lat, lng)

    if (place && seenPlaceIds.has(place.place_id)) {
      console.log(`  → Skipping OSM duplicate: ${name}`)
      continue
    }

    osmOnlyVenues.push({ name, lat, lng, osmTags: el.tags, place })
    if (place?.place_id) seenPlaceIds.add(place.place_id)
  }

  const totalUnique = googleResults.length + osmOnlyVenues.length
  console.log(`  → ${osmOnlyVenues.length} unique OSM-only venues`)
  console.log(`  → ${totalUnique} total unique venues to process\n`)

  let synced = 0
  let skipped = 0

  // 5. Process Google Places venues
  for (const r of googleResults) {
    const name = r.name
    const lat = r.geometry.location.lat
    const lng = r.geometry.location.lng
    console.log(`  🎪 ${name}`)

    // Get full details (website, phone, hours) — fall back to search data on failure
    await sleep(200)
    const place = await getGooglePlaceById(r.place_id) ?? {
      place_id: r.place_id,
      rating: r.rating,
      user_ratings_total: r.user_ratings_total,
      formatted_address: r.formatted_address,
      photos: r.photos,
    }

    const ok = await processVenue({ name, lat, lng, place, osmTags: {}, cityRecord })
    ok ? synced++ : skipped++
  }

  // 6. Process OSM-only venues
  for (const v of osmOnlyVenues) {
    console.log(`  🎪 ${v.name} (OSM-only)`)
    const ok = await processVenue({ name: v.name, lat: v.lat, lng: v.lng, place: v.place, osmTags: v.osmTags, cityRecord })
    ok ? synced++ : skipped++
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
