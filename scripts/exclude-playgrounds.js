/**
 * Sweeps all currently-active venues (isExcluded=false) and excludes any whose
 * Google primaryType is "playground" (outdoor kids' playgrounds — e.g.
 * "Langthorne Park Kids Playground", "Woodland Play Area") unless the name
 * carries a genuine indoor-play signal.
 *
 * Unlike mark-excluded-venues.js, this does NOT reset existing isExcluded
 * flags first — it only adds new exclusions, so it's safe to run without
 * undoing exclude-by-name.js / fix-specific-exclusions.js.
 *
 * Run: node scripts/exclude-playgrounds.js         (dry run, no writes)
 *      node scripts/exclude-playgrounds.js --apply  (writes isExcluded=true)
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')
const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY

const APPLY = process.argv.includes('--apply')

const EXCLUDE_PRIMARY_TYPES = new Set(['playground'])

// Same indoor-play signal list as mark-excluded-venues.js, minus bare 'kids'.
const INDOOR_PLAY_SIGNALS = [
  'soft play', 'softplay', 'play centre', 'play center', 'play cafe',
  'play barn', 'play park', 'playzone', 'play zone', 'play world',
  'play town', 'play village', 'play house', 'playhouse', 'play land',
  'indoor play', 'adventure play', 'playland', 'funhouse', 'fun house',
  'bounce', 'inflat', 'jungle', 'wacky warehouse', 'toddler',
  'sensory', 'baby',
  'trampoline', 'flip out', 'flipout',
  'gymnastics', 'tumble',
]

// Real indoor venues confirmed by address/site (mall unit, shopfront) that Google
// mis-classifies as primaryType="playground" and whose name carries no matchable
// signal word — verified manually against address + website before adding here.
const MANUAL_KEEP = [
  'Cookie Island Ilford',   // 3rd floor of a shopping mall — indoor unit
  'The Magic Burrow',       // Market St shopfront address — indoor unit
  'Play and fun',           // no outdoor keyword in name, unlike every other flagged venue
]

// "play park" must keep its space: stripped to "playpark" it also matches the
// common British name for an outdoor council playground (e.g. "Apsley Road
// Playpark"), which would wrongly protect a real outdoor venue.
const SPACE_SENSITIVE_SIGNALS = new Set(['play park'])

function hasIndoorPlaySignal(name) {
  const lower = name.toLowerCase()
  const norm = lower.replace(/\s+/g, '')
  return INDOOR_PLAY_SIGNALS.some((s) =>
    SPACE_SENSITIVE_SIGNALS.has(s) ? lower.includes(s) : norm.includes(s.replace(/\s+/g, ''))
  )
}

function isManuallyKept(name) {
  return MANUAL_KEEP.some((m) => m.toLowerCase() === name.toLowerCase().trim())
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

function get(url, headers = {}) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { timeout: 10000, headers }, (res) => {
        let body = ''
        res.on('data', (d) => (body += d))
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

async function getPrimaryType(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?key=${API_KEY}&fields=primaryType`
  const r = await get(url, { 'X-Goog-FieldMask': 'primaryType' })
  if (r.status !== 200 || !r.data) return null
  return r.data.primaryType ?? null
}

async function main() {
  if (!API_KEY) { console.error('GOOGLE_PLACES_API_KEY not set'); process.exit(1) }

  console.log(APPLY ? 'APPLY mode — will write isExcluded=true\n' : 'DRY RUN — no writes (pass --apply to commit)\n')

  const venues = await prisma.venue.findMany({
    where: { isExcluded: false, googlePlaceId: { not: null } },
    select: { id: true, name: true, googlePlaceId: true, city: { select: { name: true } } },
    orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
  })

  console.log(`Checking ${venues.length} active venues...\n`)

  const toExclude = []
  let apiErrors = 0

  for (const v of venues) {
    const primaryType = await getPrimaryType(v.googlePlaceId)
    await sleep(100)

    if (!primaryType) { apiErrors++; continue }

    if (EXCLUDE_PRIMARY_TYPES.has(primaryType) && !hasIndoorPlaySignal(v.name) && !isManuallyKept(v.name)) {
      toExclude.push({ id: v.id, name: v.name, city: v.city.name, primaryType })
      console.log(`✗ [${primaryType}] ${v.city.name} — ${v.name}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`Found ${toExclude.length} outdoor playground(s) to exclude (${apiErrors} API errors)`)

  if (APPLY && toExclude.length > 0) {
    const result = await prisma.venue.updateMany({
      where: { id: { in: toExclude.map((v) => v.id) } },
      data: { isExcluded: true },
    })
    console.log(`✓ Marked ${result.count} venue(s) as excluded.`)
  } else if (toExclude.length > 0) {
    console.log('Dry run — re-run with --apply to write these changes.')
  }
}

main().finally(() => prisma.$disconnect())
