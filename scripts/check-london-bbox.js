#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const LONDON = { minLat: 51.2, maxLat: 51.7, minLng: -0.6, maxLng: 0.4 }

async function main() {
  const city = await prisma.city.findUnique({ where: { slug: 'london' } })
  const venues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: { name: true, lat: true, lng: true },
  })

  const outside = venues.filter(v =>
    v.lat != null && v.lng != null && (
      v.lat < LONDON.minLat || v.lat > LONDON.maxLat ||
      v.lng < LONDON.minLng || v.lng > LONDON.maxLng
    )
  )
  const inside = venues.filter(v =>
    v.lat != null && v.lng != null &&
    v.lat >= LONDON.minLat && v.lat <= LONDON.maxLat &&
    v.lng >= LONDON.minLng && v.lng <= LONDON.maxLng
  )

  console.log(`Total: ${venues.length}  |  Inside London bbox: ${inside.length}  |  Outside: ${outside.length}`)
  console.log('\nVenues outside London bbox:')
  outside.forEach(v => console.log(`  "${v.name}" → ${v.lat}, ${v.lng}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
