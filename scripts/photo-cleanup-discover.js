#!/usr/bin/env node
/**
 * Discovery pass for the London soft-play-only photo cleanup task.
 * For each requested venue name, find the best DB match (London city only)
 * and print its stored name/address/googlePlaceId/website so matches can be
 * confirmed before any photo work starts. Flags ambiguous or missing ones.
 *
 * Run: node scripts/photo-cleanup-discover.js
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function normalize(str) {
  return str.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]/g, '')
}

function namesLikelyMatch(target, candidate) {
  const a = normalize(target)
  const b = normalize(candidate)
  if (!a || !b) return false
  return a.includes(b) || b.includes(a)
}

// requested name -> array of first-two-words anchors to search DB with (contains, insensitive)
const REQUESTED = [
  'RPCA Soft Play',
  'Clip n Climb Croydon',
  'Kinder Island Soft Play',
  'Under the Canopy Play Cafe',
  'Salaspark LTF',
  'Rainforest Soft Play',
  'Ladybird Soft Play and Cafe',
  'Ellans Corner',
  'Harmony Coffee House and Soft Play',
  'Another Planet',
  'Fratello Cafe',
  'Berties and Bro',
  'Alzo Cafe',
  'Globetrotters',
  'Full of Beans Wembley',
  'Softplay by Coffee House',
  'Ahoy! Play Area',
  'Bambino City',
  'Disco Bowl Lewisham',
  'Finnegans World',
  'Bella Boos',
  'The Sheriff Centre',
  'The Kids Space',
  "Hornsey Road Children's Centre",
  'Kubz Klub',
  'The Greenwich Centre',
  'Little Dinosaurs',
  'Kiddiewinks Softplay',
  'Our House Jesses',
  'The Colonnades',
  'Jungle Monkeyz',
  'Waltham Forest Feel Good Centre',
  'The Spa at Beckenham by MyTime Active',
  'Woolwich Waves',
  'The Eltham Centre',
  'Discovery Planet',
  'Avo Softplay and Kids Playroom',
  'The Barnyard Softplay',
  'Flip Out Hounslow',
  'Kidspace Romford',
  'Play Central',
  'Bonbon Kids Cafe',
  'Buzzy Bees Playbarn',
  'Gambado',
]

async function main() {
  const london = await prisma.city.findUnique({ where: { slug: 'london' } })
  if (!london) { console.error('London city not found'); process.exit(1) }

  const allLondon = await prisma.venue.findMany({
    where: { cityId: london.id },
    select: { id: true, name: true, slug: true, address: true, googlePlaceId: true, website: true, photoUrl: true, photoUrl2: true, photoUrl3: true },
  })

  const results = { matched: [], ambiguous: [], notFound: [] }

  for (const name of REQUESTED) {
    const anchor = name.replace(/[^a-z0-9\s]/gi, '').split(/\s+/).slice(0, 2).join(' ')
    let candidates = allLondon.filter(v => namesLikelyMatch(name, v.name))
    if (candidates.length === 0) {
      candidates = allLondon.filter(v => v.name.toLowerCase().includes(anchor.toLowerCase()))
    }

    if (candidates.length === 1) {
      results.matched.push({ requested: name, ...candidates[0] })
    } else if (candidates.length > 1) {
      results.ambiguous.push({ requested: name, candidates })
    } else {
      results.notFound.push(name)
    }
  }

  console.log(`\n=== MATCHED (${results.matched.length}) ===`)
  for (const m of results.matched) {
    console.log(`\n"${m.requested}"`)
    console.log(`  DB name: ${m.name}`)
    console.log(`  slug: ${m.slug}`)
    console.log(`  address: ${m.address}`)
    console.log(`  placeId: ${m.googlePlaceId ?? '(none)'}`)
    console.log(`  website: ${m.website ?? '(none)'}`)
    console.log(`  photos: ${[m.photoUrl, m.photoUrl2, m.photoUrl3].filter(Boolean).length}`)
  }

  console.log(`\n=== AMBIGUOUS (${results.ambiguous.length}) ===`)
  for (const a of results.ambiguous) {
    console.log(`\n"${a.requested}" -> ${a.candidates.length} candidates:`)
    for (const c of a.candidates) console.log(`  - ${c.name} | ${c.address} | ${c.slug}`)
  }

  console.log(`\n=== NOT FOUND (${results.notFound.length}) ===`)
  for (const n of results.notFound) console.log(`  - ${n}`)
}

main().finally(() => prisma.$disconnect())
