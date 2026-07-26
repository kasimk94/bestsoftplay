#!/usr/bin/env node
/**
 * One-off Google Places lookups for two tasks:
 *
 * Part 1 - Add missing venues: for a list of venue names, search Google Places,
 *          verify the match is a genuine indoor soft play centre via the same
 *          Claude classifier used in classify-venues.js, and insert if confident.
 *
 * Part 2 - Fix missing images: for a list of existing venue names, re-query
 *          Google Places for photos and update photoReference/photoUrl fields.
 *
 * Usage:
 *   node scripts/google-places-fixups.js --part=1 [--dry-run]
 *   node scripts/google-places-fixups.js --part=2 [--dry-run]
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

const args = process.argv.slice(2)
const part = (args.find((a) => a.startsWith('--part=')) || '--part=both').split('=')[1]
const dryRun = args.includes('--dry-run')

// ─── HTTP helpers (same shape as scripts/sync-venues.js) ──────────────────

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

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body)
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...headers },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 300)}`)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')) })
    req.write(bodyStr)
    req.end()
  })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function namesLikelyMatch(target, candidate) {
  const a = normalize(target)
  const b = normalize(candidate)
  if (!a || !b) return false
  return a.includes(b) || b.includes(a)
}

// ─── Google Places ─────────────────────────────────────────────────────────

const CITY_SLUGS = ['london', 'birmingham', 'manchester']

// Mirrors the satellite-town lists in scripts/sync-venues.js — these towns are
// treated as part of the metro area for each supported city.
const CITY_SATELLITES = {
  london: [],
  birmingham: ['solihull', 'sutton coldfield', 'wolverhampton', 'coventry', 'walsall', 'dudley', 'sandwell', 'west midlands', 'tamworth', 'lichfield'],
  manchester: ['stockport', 'bolton', 'wigan', 'oldham', 'rochdale', 'bury', 'salford', 'trafford', 'altrincham', 'ashton', 'warrington'],
}

async function textSearch(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`
  try {
    const res = await fetchJson(url)
    if (res.status !== 'OK' && res.status !== 'ZERO_RESULTS') {
      console.warn(`    ⚠ Search status (${query}): ${res.status}`)
      return []
    }
    return res.results || []
  } catch (err) {
    console.warn(`    ⚠ Search error (${query}): ${err.message}`)
    return []
  }
}

async function getPlaceDetails(placeId) {
  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}` +
    `&fields=place_id,name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,geometry,photos,business_status,types` +
    `&key=${GOOGLE_PLACES_API_KEY}`
  try {
    const res = await fetchJson(url)
    return res.result ?? null
  } catch (err) {
    console.warn(`    ⚠ Details error: ${err.message}`)
    return null
  }
}

function extractAttribName(html) {
  const m = html.match(/>([^<]+)<\/a>/)
  return m ? m[1].trim() : ''
}

const PARKING_TRUE_KEYS = [
  'freeParkingLot', 'paidParkingLot', 'freeStreetParking', 'paidStreetParking',
  'valetParking', 'freeGarageParking', 'paidGarageParking',
]

/** Returns 'Yes' | 'No' | 'Unknown' via the New Places API (the legacy Details
 * endpoint used elsewhere in this file has no parking field). Google omits
 * parkingOptions entirely when it has no data — that's the only "unknown" signal. */
async function getParkingStatus(placeId) {
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

function resolvePhotoUrl(photoReference, maxWidth = 800) {
  return new Promise((resolve) => {
    const url =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=${maxWidth}&photo_reference=${encodeURIComponent(photoReference)}&key=${GOOGLE_PLACES_API_KEY}`
    const req = https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) resolve(res.headers.location ?? null)
      else resolve(null)
      res.destroy()
    })
    req.on('error', () => resolve(null))
    req.setTimeout(10000, () => { req.destroy(); resolve(null) })
  })
}

async function pickTopPhotoUrls(photos, venueName, count = 3) {
  if (!photos || photos.length === 0) return []
  const venueNameLower = venueName.toLowerCase()
  const scored = photos
    .slice(0, 10)
    .filter((p) => p.width <= p.height * 1.5)
    .map((p) => {
      const attrName = extractAttribName(p.html_attributions?.[0] ?? '').toLowerCase()
      let score = 0
      if (!attrName) score += 1
      else if (!attrName.includes(venueNameLower.slice(0, 6)) && !venueNameLower.includes(attrName.slice(0, 6))) score += 3
      const ratio = p.width / p.height
      if (ratio <= 1.0) score += 2
      else if (ratio <= 1.2) score += 1
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

function detectCitySlug(address) {
  const lower = address.toLowerCase()
  for (const slug of CITY_SLUGS) {
    if (lower.includes(slug)) return slug
    if (CITY_SATELLITES[slug].some((town) => lower.includes(town))) return slug
  }
  return null
}

// ─── Claude ─────────────────────────────────────────────────────────────

const CLASSIFY_SYSTEM_PROMPT = `You are building a directory for BestSoftPlay.co.uk. Identify ONLY genuine commercial indoor soft play centres — businesses whose primary purpose is children's indoor soft play with permanent equipment like climbing frames, ball pits, slides, tunnels, toddler zones, padded play areas.

Exclude: public parks, outdoor playgrounds, car parks, leisure centres (unless soft play is the main attraction), trampoline parks (unless primarily soft play), inflatable parks, adventure playgrounds, community centres, church halls, schools, nurseries, museums, farms, cafés with a small play corner, party venues without permanent soft play, gyms, activity centres where soft play is minor.

Based ONLY on the venue name, description and address provided (do not invent information), classify the venue and return a confidence score 0-100 for whether it's a genuine indoor soft play centre. Be conservative — if uncertain, score low.

Return ONLY valid JSON, no markdown:
{"confidence": 85, "reason": "short reason"}`

async function classifyVenue({ name, address, types }) {
  const content = types?.length
    ? `Name: ${name}\nAddress: ${address}\nGoogle Places categories: ${types.join(', ')}`
    : `Name: ${name}\nAddress: ${address}`
  const res = await postJson(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: CLASSIFY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    },
    { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }
  )
  if (res.error) throw new Error(`Anthropic API error: ${res.error.message ?? JSON.stringify(res.error)}`)
  const text = res.content?.[0]?.text ?? ''
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`No JSON object found: ${text.slice(0, 200)}`)
  return JSON.parse(text.slice(start, end + 1))
}

async function generateDescription(venueName, address) {
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
              `at ${address}. Be warm and factual for parents. Plain text only, no markdown headings or formatting.`,
          },
        ],
      },
      { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }
    )
    return res.content?.[0]?.text?.trim() ?? null
  } catch (err) {
    console.warn(`    ⚠ Claude description error: ${err.message}`)
    return null
  }
}

// ─── Area detection (mirrors sync-venues.js) ───────────────────────────────

async function findArea(cityRecord, address) {
  const areas = await prisma.area.findMany({ where: { cityId: cityRecord.id } })
  for (const area of areas) {
    if (address.toLowerCase().includes(area.name.toLowerCase()) || address.toLowerCase().includes(area.slug.replace(/-/g, ' '))) {
      return area
    }
  }
  return areas[0] ?? null
}

// ─── Part 1: add missing venues ────────────────────────────────────────────

const MISSING_VENUE_NAMES = [
  'Fefe Fanclub',
  'Rainforest Soft Play',
  'Kinder Island Soft Play',
  'Jungle Monkeyz Adventure Soft Play',
  'Monster Mayhem',
  'Amazonia',
  'Hiland Play',
  'Little Daisys Indoor Soft Play',
  'Funopolis',
  'Kidzplay Shirley',
  'Happy Hour Workshop Manchester',
  'Play Central',
]

// Checks the DB for an existing venue that plausibly already covers this name,
// before spending any Google/Claude calls on it.
async function findExistingDbMatch(name) {
  const anchor = name.split(/\s+/).slice(0, 2).join(' ')
  const candidates = await prisma.venue.findMany({
    where: { name: { contains: anchor, mode: 'insensitive' } },
    select: { name: true, city: { select: { name: true } } },
  })
  const exact = candidates.find((c) => normalize(c.name) === normalize(name))
  if (exact) return exact
  return candidates.find((c) => namesLikelyMatch(name, c.name)) ?? null
}

async function findBestCandidate(name) {
  const queries = [
    `${name} soft play London`,
    `${name} soft play Birmingham`,
    `${name} soft play Manchester`,
    `${name} soft play UK`,
  ]
  const seen = new Set()
  for (const query of queries) {
    await sleep(300)
    const results = await textSearch(query)
    for (const r of results) {
      if (seen.has(r.place_id)) continue
      seen.add(r.place_id)
      if (r.business_status === 'CLOSED_PERMANENTLY') continue
      if (namesLikelyMatch(name, r.name)) {
        return r
      }
    }
  }
  return null
}

async function addMissingVenues() {
  console.log(`\n📋 Part 1 — Add missing venues${dryRun ? ' (DRY RUN)' : ''}\n`)

  const added = []
  const skipped = []

  for (const name of MISSING_VENUE_NAMES) {
    console.log(`🔍 ${name}`)

    const dbMatch = await findExistingDbMatch(name)
    if (dbMatch) {
      console.log(`    ⚠ Already exists in DB as "${dbMatch.name}" (${dbMatch.city.name}), skipping`)
      skipped.push({ name, reason: `Already exists in DB as "${dbMatch.name}" (${dbMatch.city.name})` })
      continue
    }

    const candidate = await findBestCandidate(name)

    if (!candidate) {
      console.log(`    ❌ Not found on Google Places`)
      skipped.push({ name, reason: 'Not found on Google Places' })
      continue
    }

    const citySlug = detectCitySlug(candidate.formatted_address || '')
    if (!citySlug) {
      console.log(`    ❌ Found ("${candidate.name}", ${candidate.formatted_address}) but not in a supported city (London/Birmingham/Manchester)`)
      skipped.push({ name, reason: `Found but outside supported cities (${candidate.formatted_address})` })
      continue
    }

    const existing = await prisma.venue.findUnique({ where: { slug: slugify(candidate.name) } })
    if (existing) {
      console.log(`    ⚠ Already exists in DB as "${existing.name}", skipping`)
      skipped.push({ name, reason: `Already exists in DB (${existing.name})` })
      continue
    }

    await sleep(300)
    const details = (await getPlaceDetails(candidate.place_id)) ?? candidate

    let classification
    try {
      classification = await classifyVenue({ name: details.name, address: details.formatted_address, types: details.types })
    } catch (err) {
      console.log(`    ❌ Classifier error: ${err.message}`)
      skipped.push({ name, reason: `Classifier error: ${err.message}` })
      continue
    }

    console.log(`    → Found "${details.name}" (${details.formatted_address}) — confidence ${classification.confidence}% (${classification.reason})`)

    if (classification.confidence < 70) {
      skipped.push({ name, reason: `Low confidence (${classification.confidence}%): ${classification.reason}` })
      continue
    }

    const cityRecord = await prisma.city.findUnique({ where: { slug: citySlug } })
    const area = await findArea(cityRecord, details.formatted_address || '')
    if (!area) {
      console.log(`    ❌ No area found for ${cityRecord.name}`)
      skipped.push({ name, reason: `No area found for ${cityRecord.name}` })
      continue
    }

    const photoUrls = await pickTopPhotoUrls(details.photos, details.name)
    const [photoUrl = null, photoUrl2 = null, photoUrl3 = null] = photoUrls
    const photoReference = details.photos?.[0]?.photo_reference ?? null

    await sleep(200)
    const description = await generateDescription(details.name, details.formatted_address)
    const placeIdForData = details.place_id ?? candidate.place_id
    const parking = placeIdForData ? await getParkingStatus(placeIdForData) : 'Unknown'

    const data = {
      name: details.name,
      slug: slugify(details.name),
      cityId: cityRecord.id,
      areaId: area.id,
      address: details.formatted_address || `${details.name}, ${cityRecord.name}`,
      postcode: '',
      phone: details.formatted_phone_number ?? null,
      website: details.website ?? null,
      googlePlaceId: placeIdForData,
      googleRating: details.rating ?? null,
      googleReviewCount: details.user_ratings_total ?? null,
      photoReference,
      photoUrl,
      photoUrl2,
      photoUrl3,
      description,
      features: [],
      parking,
      openingHours: details.opening_hours?.weekday_text ? { weekdays: details.opening_hours.weekday_text } : undefined,
      qualityScore: classification.confidence,
      qualityReason: classification.reason,
    }

    if (dryRun) {
      console.log(`    ✅ [DRY RUN] Would insert into ${cityRecord.name} / ${area.name}`)
    } else {
      await prisma.venue.create({ data })
      console.log(`    ✅ Inserted into ${cityRecord.name} / ${area.name}`)
    }
    added.push({ name, matchedName: details.name, city: cityRecord.name, confidence: classification.confidence })
  }

  console.log(`\n─── Part 1 summary ───`)
  console.log(`Added: ${added.length}/${MISSING_VENUE_NAMES.length}`)
  for (const a of added) console.log(`  ✅ ${a.name} → "${a.matchedName}" (${a.city}, ${a.confidence}%)`)
  console.log(`Skipped: ${skipped.length}`)
  for (const s of skipped) console.log(`  ❌ ${s.name} — ${s.reason}`)

  return { added, skipped }
}

// ─── Part 2: fix missing images ────────────────────────────────────────────

// A few requested names are spelling/formatting variants of the real DB name
// (confirmed by manual lookup) — using the actual stored name so findFirst matches.
const MISSING_IMAGE_VENUE_NAMES = [
  'Berzerk Active Play',
  'Treasure Island',
  'Krazy Kidz Cafe Ltd', // requested as "Krazy Kids Cafe"
  'Kinder Play Café', // requested as "Kinder Play Cafe"
  'Kidsaurus Play Centre',
  'Bizzy Bouncers',
  'Kidspace Romford',
  'Smart Play',
  'Buzy Bees Playbarn', // requested as "Buzzy Bees Playbarn"
  'Coldharbour Adventure Play Centre',
  'RPCA Soft Play',
  'Bury Big Bounce', // requested as "Busy Big Bounce"
  'Gambado',
  'Play Lane Adventure Village', // requested as "Playlane Adventure Village"
  'The Barnyard Soft Play',
  'Bumble Bees Stay and Play',
  'Kidspace Adventure Park',
  'Jump&Play', // requested as "Jump and Play"
  'Flip Out Hounslow',
]

async function fixMissingImages() {
  console.log(`\n🖼  Part 2 — Fix missing images${dryRun ? ' (DRY RUN)' : ''}\n`)

  const fixed = []
  const noPhoto = []
  const notFound = []

  for (const name of MISSING_IMAGE_VENUE_NAMES) {
    console.log(`🔍 ${name}`)
    const venue = await prisma.venue.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      include: { city: true },
    })

    if (!venue) {
      console.log(`    ❌ Not found in database — check spelling`)
      notFound.push(name)
      continue
    }

    let details = null
    if (venue.googlePlaceId) {
      await sleep(300)
      details = await getPlaceDetails(venue.googlePlaceId)
    }
    if (!details) {
      await sleep(300)
      const results = await textSearch(`${venue.name} ${venue.city.name} soft play`)
      const candidate = results.find((r) => namesLikelyMatch(venue.name, r.name)) ?? results[0]
      if (candidate) {
        await sleep(300)
        details = await getPlaceDetails(candidate.place_id)
      }
    }

    if (!details) {
      console.log(`    ❌ No matching Google Places result found`)
      noPhoto.push(`${name} (no Google Places match)`)
      continue
    }

    if (!details.photos || details.photos.length === 0) {
      console.log(`    ❌ No photos available on Google Places`)
      noPhoto.push(name)
      continue
    }

    const photoUrls = await pickTopPhotoUrls(details.photos, venue.name)
    if (photoUrls.length === 0) {
      console.log(`    ❌ Photos existed but none resolved to a usable URL`)
      noPhoto.push(name)
      continue
    }

    const [photoUrl = null, photoUrl2 = null, photoUrl3 = null] = photoUrls
    const photoReference = details.photos[0]?.photo_reference ?? null

    if (dryRun) {
      console.log(`    ✅ [DRY RUN] Would set ${photoUrls.length} photo URL(s)`)
    } else {
      await prisma.venue.update({
        where: { id: venue.id },
        data: {
          photoReference,
          photoUrl,
          photoUrl2,
          photoUrl3,
          googlePlaceId: venue.googlePlaceId ?? details.place_id,
        },
      })
      console.log(`    ✅ Updated with ${photoUrls.length} photo URL(s)`)
    }
    fixed.push(name)
  }

  console.log(`\n─── Part 2 summary ───`)
  console.log(`Fixed: ${fixed.length}/${MISSING_IMAGE_VENUE_NAMES.length}`)
  for (const f of fixed) console.log(`  ✅ ${f}`)
  if (notFound.length) {
    console.log(`Not found in DB: ${notFound.length}`)
    for (const n of notFound) console.log(`  ❌ ${n}`)
  }
  if (noPhoto.length) {
    console.log(`No photo available: ${noPhoto.length}`)
    for (const n of noPhoto) console.log(`  ⚠ ${n}`)
  }

  return { fixed, notFound, noPhoto }
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  const results = {}
  if (part === '1' || part === 'both') results.part1 = await addMissingVenues()
  if (part === '2' || part === 'both') results.part2 = await fixMissingImages()
  console.log('\n✅ Done.')
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
