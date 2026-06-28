#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Rough UK bounding box
const UK = { minLat: 49.5, maxLat: 61.0, minLng: -8.5, maxLng: 2.0 }

function inUK(lat, lng) {
  return lat >= UK.minLat && lat <= UK.maxLat && lng >= UK.minLng && lng <= UK.maxLng
}

async function main() {
  const city = await prisma.city.findUnique({ where: { slug: 'london' } })

  const venues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: { id: true, name: true, lat: true, lng: true },
  })

  const nullCoords   = venues.filter(v => v.lat == null || v.lng == null)
  const zeroCoords   = venues.filter(v => v.lat === 0 && v.lng === 0)
  const outOfUK      = venues.filter(v => v.lat != null && v.lng != null && !inUK(v.lat, v.lng))
  const valid        = venues.filter(v => v.lat != null && v.lng != null && inUK(v.lat, v.lng))

  console.log(`Total London venues : ${venues.length}`)
  console.log(`Null lat or lng     : ${nullCoords.length}`)
  console.log(`Zero (0,0)          : ${zeroCoords.length}`)
  console.log(`Outside UK bbox     : ${outOfUK.length}`)
  console.log(`Valid (in UK bbox)  : ${valid.length}`)

  if (outOfUK.length > 0) {
    console.log('\nOut-of-UK venues:')
    outOfUK.forEach(v => console.log(`  "${v.name}" → ${v.lat}, ${v.lng}`))
  }

  if (zeroCoords.length > 0) {
    console.log('\nZero-coord venues:')
    zeroCoords.slice(0, 10).forEach(v => console.log(`  "${v.name}"`))
  }

  // Lat/lng distribution of valid venues
  if (valid.length > 0) {
    const lats = valid.map(v => v.lat)
    const lngs = valid.map(v => v.lng)
    console.log(`\nValid venue bounds:`)
    console.log(`  lat: ${Math.min(...lats).toFixed(4)} → ${Math.max(...lats).toFixed(4)}`)
    console.log(`  lng: ${Math.min(...lngs).toFixed(4)} → ${Math.max(...lngs).toFixed(4)}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
