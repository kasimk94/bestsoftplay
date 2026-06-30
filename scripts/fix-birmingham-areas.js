#!/usr/bin/env node
/**
 * Creates new Birmingham/West Midlands area records and re-classifies all
 * Birmingham venues to the correct area based on lat/lng coordinates.
 *
 * New areas: Dudley, Wolverhampton, Sandwell, Walsall
 * Re-classifies existing: City Centre, Solihull, Sutton Coldfield
 */
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/**
 * Classify a West Midlands venue by lat/lng.
 * Returns the area slug, or null if coordinates are far outside the region
 * (e.g. Coventry, Tamworth) — those default to City Centre.
 */
function classifyBirminghamArea(lat, lng) {
  // Wolverhampton: northwest
  if (lat >= 52.57 && lng <= -2.05) return 'wolverhampton'
  // Walsall: north, east of Wolverhampton
  if (lat >= 52.57) return 'walsall'
  // Dudley: west/southwest, south of Sandwell/Wolverhampton line
  if (lat < 52.54 && lng <= -2.05) return 'dudley'
  // Sandwell: northwest of Birmingham centre (West Bromwich, Smethwick, Oldbury)
  if (lat >= 52.48 && lat < 52.57 && lng <= -1.97) return 'sandwell'
  // Sutton Coldfield: north of Birmingham, east side
  if (lat >= 52.53) return 'sutton-coldfield'
  // Solihull: southeast / south of Birmingham
  if (lat < 52.41 && lng > -1.84) return 'solihull'
  // Everything else → Birmingham City Centre
  return 'city-centre'
}

const AREA_NAMES = {
  'city-centre':     'City Centre',
  'solihull':        'Solihull',
  'sutton-coldfield':'Sutton Coldfield',
  'dudley':          'Dudley',
  'wolverhampton':   'Wolverhampton',
  'sandwell':        'Sandwell',
  'walsall':         'Walsall',
}

async function main() {
  const city = await prisma.city.findUnique({ where: { slug: 'birmingham' } })
  if (!city) throw new Error('Birmingham city not found')
  console.log('City:', city.name, '(id:', city.id + ')')

  // 1. Ensure all 7 areas exist
  const existingAreas = await prisma.area.findMany({ where: { cityId: city.id } })
  const areaBySlug = Object.fromEntries(existingAreas.map(a => [a.slug, a]))

  for (const [slug, name] of Object.entries(AREA_NAMES)) {
    if (!areaBySlug[slug]) {
      const created = await prisma.area.create({
        data: { slug, name, cityId: city.id },
      })
      areaBySlug[slug] = created
      console.log('  Created area:', name)
    } else {
      console.log('  Exists:', name)
    }
  }

  // 2. Load all Birmingham venues
  const venues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: { id: true, name: true, lat: true, lng: true, areaId: true },
  })
  console.log(`\nTotal Birmingham venues: ${venues.length}`)

  // 3. Classify
  const updates = {}
  for (const slug of Object.keys(AREA_NAMES)) updates[slug] = []
  const skipped = []

  for (const v of venues) {
    if (v.lat == null || v.lng == null) { skipped.push(v.name); continue }
    const slug = classifyBirminghamArea(v.lat, v.lng)
    updates[slug].push(v.id)
  }

  console.log('\nClassification:')
  for (const [slug, ids] of Object.entries(updates)) {
    console.log(`  ${AREA_NAMES[slug]}: ${ids.length}`)
  }
  if (skipped.length) console.log(`  (skipped ${skipped.length} with no lat/lng)`)

  // 4. Apply updates
  console.log('\nApplying...')
  for (const [slug, ids] of Object.entries(updates)) {
    if (!ids.length) continue
    const area = areaBySlug[slug]
    const result = await prisma.venue.updateMany({
      where: { id: { in: ids } },
      data: { areaId: area.id },
    })
    console.log(`  ${AREA_NAMES[slug]}: updated ${result.count}`)
  }

  // 5. Final counts
  console.log('\nFinal counts:')
  const finalAreas = await prisma.area.findMany({
    where: { cityId: city.id },
    include: { _count: { select: { venues: true } } },
    orderBy: { name: 'asc' },
  })
  let total = 0
  finalAreas.forEach(a => {
    console.log(`  ${a.name}: ${a._count.venues}`)
    total += a._count.venues
  })
  console.log(`  TOTAL: ${total}`)

  // 6. Sanity check
  console.log('\nSanity check (2 per area):')
  for (const area of finalAreas) {
    const sample = await prisma.venue.findMany({
      where: { areaId: area.id },
      take: 2,
      select: { name: true, lat: true, lng: true },
    })
    console.log(`  ${area.name}:`)
    sample.forEach(v => console.log(`    "${v.name}" (${v.lat?.toFixed(4)}, ${v.lng?.toFixed(4)})`))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
