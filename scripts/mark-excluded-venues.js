/**
 * Identifies and marks non-soft-play venues in the database.
 *
 * Strategy:
 *  1. Fetch primaryType from the Google Places API v2 for every venue.
 *  2. Auto-exclude venues whose primary Google type is a clear non-play category
 *     (park, gym, swimming pool, etc.) AND whose name contains no soft-play
 *     indicator — erring on the side of keeping venues when unsure.
 *  3. Always exclude the manually-specified venue list regardless of type.
 *  4. Print a full summary of what was excluded and why.
 *
 * Run: node scripts/mark-excluded-venues.js
 * Re-run to refresh — idempotent, it resets all flags first.
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')
const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY

// ── Google Places primary types that indicate clearly non-soft-play venues ────
// If a venue's primaryType is in this set AND its name has no soft-play signals,
// it will be excluded.
const EXCLUDE_PRIMARY_TYPES = new Set([
  'park',
  'national_park',
  'state_park',
  'nature_reserve',
  'playground',
  'gym',
  'fitness_center',
  'sports_complex',
  'stadium',
  'swimming_pool',
  'golf_course',
  'tennis_court',
  'athletic_field',
  'sports_club',
])

// ── Name keywords that OVERRIDE a bad primaryType — keep the venue ─────────
// If any of these appear in the venue name, it's probably an indoor play venue
// even if Google mis-categorised it.
const INDOOR_PLAY_SIGNALS = [
  'soft play', 'softplay', 'play centre', 'play center', 'play cafe',
  'play barn', 'play park', 'playzone', 'play zone', 'play world',
  'play town', 'play village', 'play house', 'playhouse', 'play land',
  'indoor play', 'adventure play', 'playland', 'funhouse', 'fun house',
  'bounce', 'inflat', 'jungle', 'wacky warehouse', 'toddler',
  'sensory', 'baby',
  // NOTE: bare 'kids' was removed — it wrongly protected outdoor venues like
  // "Langthorne Park Kids Playground" from primaryType-based exclusion.
  // "Kids" alone signals an audience, not an indoor venue.
  // Trampoline parks — indoor venues often with soft play areas
  'trampoline', 'flip out', 'flipout',
  // Gymnastics / activity centres that host soft play
  'gymnastics', 'tumble',
]

// ── Hard-coded exclusions — always excluded regardless of type ─────────────
// Add any venue names here that are definitely not soft play.
const MANUAL_EXCLUSIONS = [
  // Outdoor parks with no indoor soft play
  'Stratford Park',
  'Stratford Park Play Area',
  'Forest Lane Play Area',
  // Leisure centres / gyms
  'East Ham Leisure Centre',
  // Escape rooms / laser tag / activity centres — no soft play
  'Activate Islington Square',
  'Activate Vauxhall',
  // Specific mismatched venues to hide
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function get(url, headers = {}) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { timeout: 10000, headers }, (res) => {
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

// "play park" must keep its space: stripped to "playpark" it also matches the
// common British name for an outdoor council playground (e.g. "Apsley Road
// Playpark"), which would wrongly protect a real outdoor venue.
const SPACE_SENSITIVE_SIGNALS = new Set(['play park'])

function hasIndoorPlaySignal(name) {
  const lower = name.toLowerCase()
  const norm = lower.replace(/\s+/g, '')
  return INDOOR_PLAY_SIGNALS.some(s =>
    SPACE_SENSITIVE_SIGNALS.has(s) ? lower.includes(s) : norm.includes(s.replace(/\s+/g, ''))
  )
}

function isManualExclusion(name) {
  const lower = name.toLowerCase().trim()
  return MANUAL_EXCLUSIONS.some(m => lower === m.toLowerCase().trim())
}

async function getVenueType(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?key=${API_KEY}&fields=primaryType,types`
  const r = await get(url, { 'X-Goog-FieldMask': 'primaryType,types' })
  if (r.status !== 200 || !r.data) return null
  return {
    primaryType: r.data.primaryType ?? null,
    types: r.data.types ?? [],
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) { console.error('GOOGLE_PLACES_API_KEY not set'); process.exit(1) }

  // Reset all exclusions so this script is idempotent
  await prisma.venue.updateMany({ data: { isExcluded: false } })
  console.log('Reset all isExcluded flags to false.\n')

  const venues = await prisma.venue.findMany({
    select: { id: true, name: true, googlePlaceId: true },
    orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
  })

  console.log(`Checking ${venues.length} venues...\n`)

  const excluded = []    // { name, reason, primaryType }
  const noPlaceId = []
  let apiErrors = 0

  for (let i = 0; i < venues.length; i++) {
    const v = venues[i]

    // 1. Manual hard-coded exclusion
    if (isManualExclusion(v.name)) {
      await prisma.venue.update({ where: { id: v.id }, data: { isExcluded: true } })
      excluded.push({ name: v.name, reason: 'manual exclusion list', primaryType: '—' })
      process.stdout.write(`✗ [manual]   ${v.name}\n`)
      continue
    }

    if (!v.googlePlaceId) {
      noPlaceId.push(v.name)
      continue
    }

    // 2. Fetch Google Places type
    const typeInfo = await getVenueType(v.googlePlaceId)
    await sleep(80) // ~12 req/s, well within quota

    if (!typeInfo) {
      apiErrors++
      continue
    }

    const { primaryType } = typeInfo

    // 3. Apply type-based exclusion — but only if no indoor play signal in name
    if (primaryType && EXCLUDE_PRIMARY_TYPES.has(primaryType) && !hasIndoorPlaySignal(v.name)) {
      await prisma.venue.update({ where: { id: v.id }, data: { isExcluded: true } })
      excluded.push({ name: v.name, reason: `primaryType="${primaryType}"`, primaryType })
      process.stdout.write(`✗ [${primaryType.padEnd(16)}] ${v.name}\n`)
    }
    // Uncomment to see kept venues:
    // else { process.stdout.write(`  [${(primaryType ?? 'unknown').padEnd(16)}] ${v.name}\n`) }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`SUMMARY`)
  console.log('='.repeat(60))
  console.log(`Total venues checked:  ${venues.length}`)
  console.log(`Excluded:              ${excluded.length}`)
  console.log(`  — Manual list:       ${excluded.filter(e => e.reason.startsWith('manual')).length}`)
  console.log(`  — By Google type:    ${excluded.filter(e => !e.reason.startsWith('manual')).length}`)
  console.log(`No Place ID (skipped): ${noPlaceId.length}`)
  console.log(`API errors:            ${apiErrors}`)

  console.log('\n── Excluded venues ──────────────────────────────────')
  excluded.forEach(e => console.log(`  ${e.name} (${e.reason})`))

  const byType = {}
  excluded.filter(e => !e.reason.startsWith('manual')).forEach(e => {
    byType[e.primaryType] = (byType[e.primaryType] || 0) + 1
  })
  if (Object.keys(byType).length > 0) {
    console.log('\n── By Google type ───────────────────────────────────')
    Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => {
      console.log(`  ${t.padEnd(24)} ${n} venue${n !== 1 ? 's' : ''}`)
    })
  }
}

main().finally(() => prisma.$disconnect())
