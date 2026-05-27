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

// ─── Venue filtering ───────────────────────────────────────────────────────

// Venues whose names contain these strings are not soft plays and should be excluded
const EXCLUDED_KEYWORDS = [
  'Crystal Maze', 'King Pins', 'Treetop Golf', 'Sandbox VR',
  'Bowling', 'Trampoline', 'Escape Room', 'Gamebox', 'Rock Over Climbing',
  'Cinema', 'Golf', 'Laser', 'Arcade',
]

function isExcludedVenue(name) {
  const lower = name.toLowerCase()
  return EXCLUDED_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))
}

async function cleanupExcludedVenues() {
  console.log('\n🧹 Removing non-soft-play venues...')
  let total = 0
  for (const kw of EXCLUDED_KEYWORDS) {
    const r = await prisma.venue.deleteMany({
      where: { name: { contains: kw, mode: 'insensitive' } },
    })
    if (r.count > 0) {
      console.log(`  🗑 Deleted ${r.count} venue(s) matching "${kw}"`)
      total += r.count
    }
  }
  console.log(`  Done — ${total} venue(s) removed`)
}

// ─── Google Places text search ─────────────────────────────────────────────

const CITY_NAMES = {
  london: 'London',
  birmingham: 'Birmingham',
  manchester: 'Manchester',
}

const SEARCH_TERMS = [
  'soft play',
  'soft play centre',
  'indoor play centre',
  "children's play centre",
  'kids play area',
  'toddler play centre',
  'baby play centre',
  'play cafe',
  'sensory play',
  'ball pit',
]

// Search terms used for per-area expansion (beyond the city-wide SEARCH_TERMS)
const AREA_EXTRA_TERMS = [
  'indoor play centre',
  "children's play centre",
  'play cafe',
  'kids play area',
  'sensory play',
]

function buildAreaQueries(areas) {
  const queries = []
  for (const area of areas) {
    queries.push(`soft play ${area}`)
    for (const term of AREA_EXTRA_TERMS) {
      queries.push(`${term} ${area}`)
    }
  }
  return queries
}

const LONDON_AREAS = [
  'North London', 'South London', 'East London', 'West London',
  'Croydon', 'Bromley', 'Hackney', 'Islington', 'Wandsworth', 'Greenwich',
  'Lewisham', 'Southwark', 'Lambeth', 'Tower Hamlets', 'Newham',
  'Barnet', 'Enfield', 'Haringey', 'Walthamstow', 'Romford',
  'Ilford', 'Stratford', 'Woolwich', 'Eltham', 'Sidcup',
]

const BIRMINGHAM_AREAS = [
  'Solihull', 'Sutton Coldfield', 'Wolverhampton', 'Coventry',
  'Walsall', 'Dudley', 'Sandwell', 'West Midlands', 'Tamworth', 'Lichfield',
]

const MANCHESTER_AREAS = [
  'Stockport', 'Bolton', 'Wigan', 'Oldham', 'Rochdale',
  'Bury', 'Salford', 'Trafford', 'Altrincham', 'Ashton', 'Warrington',
]

async function runTextSearch(query, seen, results) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`
  let res
  try {
    res = await fetchJson(url)
  } catch (err) {
    console.warn(`  ⚠ Search error (${query}): ${err.message}`)
    return
  }
  if (res.status !== 'OK' && res.status !== 'ZERO_RESULTS') {
    console.warn(`  ⚠ Search status (${query}): ${res.status}`)
    return
  }
  const batch = res.results || []
  let newCount = 0
  for (const r of batch) {
    if (!seen.has(r.place_id) && !isExcludedVenue(r.name)) {
      seen.add(r.place_id)
      results.push(r)
      newCount++
    }
  }
  console.log(`  → "${query}": ${batch.length} results, ${newCount} new`)
  await sleep(500)
}

async function searchGooglePlacesVenues(cityName, citySlug) {
  const seen = new Set()
  const results = []

  // Standard search terms × city name
  for (const term of SEARCH_TERMS) {
    await runTextSearch(`${term} ${cityName}`, seen, results)
  }

  // City-specific area searches
  if (citySlug === 'london') {
    for (const query of buildAreaQueries(LONDON_AREAS)) {
      await runTextSearch(query, seen, results)
    }
  }
  if (citySlug === 'birmingham') {
    for (const query of buildAreaQueries(BIRMINGHAM_AREAS)) {
      await runTextSearch(query, seen, results)
    }
  }
  if (citySlug === 'manchester') {
    for (const query of buildAreaQueries(MANCHESTER_AREAS)) {
      await runTextSearch(query, seen, results)
    }
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

function extractAttribName(html) {
  const m = html.match(/>([^<]+)<\/a>/)
  return m ? m[1].trim() : ''
}

/**
 * Score, sort, then resolve CDN URLs for the top 3 photos.
 * Scoring:
 *   +3  attribution name doesn't match venue (user-submitted = real interior)
 *   +1  no attribution (neutral)
 *    0  attribution matches venue name (business owner promo photo)
 *   +2  aspect ratio ≤ 1:1 (portrait) — interior shots are usually portrait/square
 *   skip  width > height * 1.5 (obvious banner/flyer/wide landscape)
 *
 * We score without HTTP calls first, then only resolve URLs for the best candidates.
 */
async function pickTopPhotoUrls(photos, venueName, count = 3) {
  if (!photos || photos.length === 0) return []

  const venueNameLower = venueName.toLowerCase()

  const scored = photos
    .slice(0, 10)
    .filter(p => p.width <= p.height * 1.5) // skip wide banners/flyers
    .map(p => {
      const attrName = extractAttribName(p.html_attributions?.[0] ?? '').toLowerCase()
      let score = 0

      if (!attrName) {
        score += 1 // unknown attribution — neutral
      } else if (
        !attrName.includes(venueNameLower.slice(0, 6)) &&
        !venueNameLower.includes(attrName.slice(0, 6))
      ) {
        score += 3 // user-submitted, not the business owner
      }
      // else: attribution matches venue → score stays 0 (deprioritised)

      // Prefer portrait/square — interior shots tend to be taller than wide
      const ratio = p.width / p.height
      if (ratio <= 1.0) score += 2        // portrait or square
      else if (ratio <= 1.2) score += 1   // slightly landscape but still ok

      return { photo: p, score }
    })
    .sort((a, b) => b.score - a.score)

  const urls = []
  for (const { photo } of scored) {
    if (urls.length >= count) break
    await sleep(80)
    const url = await resolvePhotoUrl(photo.photo_reference)
    if (url) urls.push(url)
  }

  return urls
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
  const allPhotos = place?.photos?.slice(0, 5) ?? []
  // Keep the first reference for proxy fallback (in case CDN URLs expire)
  const photoReference = allPhotos[0]?.photo_reference ?? null
  const photoReference2 = null
  const photoReference3 = null

  const photoUrls = await pickTopPhotoUrls(allPhotos, name)
  const [photoUrl = null, photoUrl2 = null, photoUrl3 = null] = photoUrls

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

  // Re-use existing description — only generate if the venue is new or has none
  const existing = await prisma.venue.findUnique({ where: { slug }, select: { description: true } })
  let description = existing?.description ?? null
  if (!description && address) {
    await sleep(150)
    description = await generateDescription(name, address, features)
    if (description) console.log(`    ✅ Description generated`)
  }
  if (googleRating) console.log(`    ⭐ ${googleRating} (${googleReviewCount} reviews)`)
  if (photoUrls.length > 0) {
    console.log(`    📷 ${photoUrls.length} photo URL(s) resolved from ${allPhotos.length} candidates`)
  } else if (photoReference) {
    console.log(`    📷 Photo reference stored (CDN resolve failed)`)
  } else {
    console.log(`    ⚠ No photos found`)
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
    photoUrl2,
    photoUrl3,
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

  // 2. Fetch from Google Places text search
  const googleResults = await searchGooglePlacesVenues(CITY_NAMES[citySlug], citySlug)
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
  let processed = 0

  // Reconnect every 40 venues to prevent P1017 connection drops on long runs
  async function maybeReconnect() {
    processed++
    if (processed % 40 === 0) {
      console.log(`  🔄 Refreshing DB connection (${processed} processed)...`)
      await prisma.$disconnect()
      await prisma.$connect()
    }
  }

  // 5. Process Google Places venues
  for (const r of googleResults) {
    const name = r.name
    if (isExcludedVenue(name)) {
      console.log(`  ⛔ Skipping excluded: ${name}`)
      skipped++
      continue
    }
    const lat = r.geometry.location.lat
    const lng = r.geometry.location.lng
    console.log(`  🎪 ${name}`)

    // Get full details (website, phone, hours) — fall back to search data on failure
    await sleep(100)
    const place = await getGooglePlaceById(r.place_id) ?? {
      place_id: r.place_id,
      rating: r.rating,
      user_ratings_total: r.user_ratings_total,
      formatted_address: r.formatted_address,
      photos: r.photos,
    }

    const ok = await processVenue({ name, lat, lng, place, osmTags: {}, cityRecord })
    ok ? synced++ : skipped++
    await maybeReconnect()
  }

  // 6. Process OSM-only venues
  for (const v of osmOnlyVenues) {
    if (isExcludedVenue(v.name)) {
      console.log(`  ⛔ Skipping excluded: ${v.name} (OSM-only)`)
      skipped++
      continue
    }
    console.log(`  🎪 ${v.name} (OSM-only)`)
    const ok = await processVenue({ name: v.name, lat: v.lat, lng: v.lng, place: v.place, osmTags: v.osmTags, cityRecord })
    ok ? synced++ : skipped++
    await maybeReconnect()
  }

  console.log(`\n  ✅ ${citySlug}: ${synced} synced, ${skipped} skipped`)
}

async function main() {
  const VALID_CITIES = ['london', 'birmingham', 'manchester']
  const args = process.argv.slice(2).filter(a => VALID_CITIES.includes(a))
  const cities = args.length > 0 ? args : VALID_CITIES

  console.log('🎊  BestSoftPlay venue sync\n')
  console.log('─'.repeat(50))

  try {
    await cleanupExcludedVenues()

    for (const city of cities) {
      await syncCity(city)
    }

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
