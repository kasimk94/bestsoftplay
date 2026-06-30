#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const BHAM = { minLat: 52.35, maxLat: 52.65, minLng: -2.1, maxLng: -1.65 }
function inBham(lat, lng) {
  return lat >= BHAM.minLat && lat <= BHAM.maxLat && lng >= BHAM.minLng && lng <= BHAM.maxLng
}

async function main() {
  const city = await prisma.city.findUnique({ where: { slug: 'birmingham' } })
  if (!city) { console.log('No birmingham city found'); return }
  console.log('City:', JSON.stringify(city))

  const areas = await prisma.area.findMany({
    where: { cityId: city.id },
    include: { _count: { select: { venues: true } } },
    orderBy: { name: 'asc' },
  })
  console.log('\nExisting areas:')
  areas.forEach(a => console.log(`  ${a.name} (${a.slug}) → ${a._count.venues} venues`))

  const venues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: { id: true, name: true, postcode: true, lat: true, lng: true, area: { select: { name: true } } },
    orderBy: { name: 'asc' },
  })
  console.log(`\nTotal Birmingham venues: ${venues.length}`)

  const outOfBbox = venues.filter(v =>
    v.lat != null && v.lng != null && !inBham(v.lat, v.lng)
  )
  console.log(`Outside Birmingham bbox: ${outOfBbox.length}`)
  outOfBbox.forEach(v => console.log(`  "${v.name}" → ${v.lat}, ${v.lng}`))

  // Sample postcodes to understand distribution
  console.log('\nSample venues (name | area | postcode | lat | lng):')
  venues.slice(0, 30).forEach(v =>
    console.log(`  "${v.name}" | ${v.area?.name} | ${v.postcode} | ${v.lat?.toFixed(4)} | ${v.lng?.toFixed(4)}`)
  )

  // Group by postcode prefix to suggest new areas
  const postcodeGroups = {}
  venues.forEach(v => {
    if (!v.postcode) return
    const prefix = v.postcode.match(/^([A-Z]{1,2}\d{1,2})/)?.[1] || 'unknown'
    postcodeGroups[prefix] = (postcodeGroups[prefix] || 0) + 1
  })
  console.log('\nPostcode prefix distribution:')
  Object.entries(postcodeGroups).sort((a,b) => b[1]-a[1]).forEach(([k,v]) =>
    console.log(`  ${k}: ${v}`)
  )
}

main().catch(console.error).finally(() => prisma.$disconnect())
