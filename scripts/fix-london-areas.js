#!/usr/bin/env node
/**
 * Re-assigns all London venues to the correct area (Central/East/North/South/West)
 * based on lat/lng coordinates, since postcodes are blank and all venues were
 * incorrectly assigned to "South London".
 */
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Classify a London lat/lng into one of the 5 London area slugs.
 * Priority: East → West → South (outer) → South (inner south bank) → North → Central
 */
function classifyLondonArea(lat, lng) {
  // East London: E postcodes, Newham, Barking, Havering, Bexley, Hackney/Leyton corridor
  if (lng >= 0.00 && lat >= 51.46) return 'east-london'
  if (lng >= -0.05 && lat >= 51.50 && lat <= 51.62) return 'east-london'

  // West London: Hammersmith, Shepherd's Bush, Ealing, Hounslow, Richmond, Putney
  if (lng <= -0.21) return 'west-london'

  // South London (outer): Brixton, Streatham, Croydon, Bromley, Wimbledon etc.
  if (lat < 51.48) return 'south-london'

  // South London (inner south bank): SE1, SE11, Vauxhall, Bermondsey, Elephant & Castle
  // Thames south bank venues are above 51.48 but clearly south of the river
  if (lat < 51.505 && lng > -0.15 && lng < 0.10) return 'south-london'

  // North London: Islington, Camden, Hackney heights, Haringey, Barnet, Harrow
  if (lat >= 51.535) return 'north-london'

  // Central London: City, Westminster, Soho, Shoreditch, Kensington inner
  return 'central-london'
}

async function main() {
  // Load London city and its areas
  const city = await prisma.city.findUnique({ where: { slug: 'london' } })
  if (!city) throw new Error('London city not found')

  const areas = await prisma.area.findMany({ where: { cityId: city.id } })
  const areaBySlug = Object.fromEntries(areas.map(a => [a.slug, a]))

  console.log('Areas found:')
  areas.forEach(a => console.log(`  ${a.name} → ${a.slug} (${a.id})`))

  // Load all London venues
  const venues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: { id: true, name: true, lat: true, lng: true, areaId: true },
  })
  console.log(`\nTotal London venues: ${venues.length}`)

  // Classify and batch updates
  const updates = {}  // slug → [venueId, ...]
  const skipped = []
  areas.forEach(a => { updates[a.slug] = [] })

  for (const venue of venues) {
    if (venue.lat == null || venue.lng == null) {
      skipped.push(venue.name)
      continue
    }
    const slug = classifyLondonArea(venue.lat, venue.lng)
    updates[slug].push(venue.id)
  }

  console.log('\nClassification preview:')
  for (const [slug, ids] of Object.entries(updates)) {
    console.log(`  ${slug}: ${ids.length} venues`)
  }
  if (skipped.length > 0) {
    console.log(`  (skipped ${skipped.length} venues with no lat/lng)`)
  }

  // Apply updates
  console.log('\nApplying updates...')
  for (const [slug, ids] of Object.entries(updates)) {
    if (ids.length === 0) continue
    const area = areaBySlug[slug]
    if (!area) { console.warn(`  WARNING: no area found for slug ${slug}`); continue }
    const result = await prisma.venue.updateMany({
      where: { id: { in: ids } },
      data: { areaId: area.id },
    })
    console.log(`  Updated ${result.count} venues → ${area.name}`)
  }

  // Confirm final counts
  console.log('\nFinal venue counts per area:')
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

  // Sample from each area to sanity-check
  console.log('\nSanity check (3 venues per area):')
  for (const area of finalAreas) {
    const sample = await prisma.venue.findMany({
      where: { areaId: area.id },
      take: 3,
      select: { name: true, lat: true, lng: true },
    })
    console.log(`\n  ${area.name}:`)
    sample.forEach(v => console.log(`    "${v.name}" (${v.lat?.toFixed(4)}, ${v.lng?.toFixed(4)})`))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
