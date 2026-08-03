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

const REQUESTED = [
  'Bizzybees',
  'Z Stockton Heath',
  'Rock Up Manchester',
  'Kickair',
  'Bounce Central Oldham',
  'Oxygen at MediaCity',
  'Cheeky Cherubs Soft Play',
  'Let Loose Softplay and Cafe',
  'Jungle Mayhem',
  'Fun2B Play and Party Centre',
  'Jungle JS Play and Party Centre',
  'Legoland Discovery Centre',
  'Play2Diggle',
  'Run of the Mill Indoor Play Centre',
  'Playtime',
  'Move Altrincham',
  'Barlow Croft Wacky Warehouse',
]

async function main() {
  const mcr = await prisma.city.findUnique({ where: { slug: 'manchester' } })
  if (!mcr) { console.error('Manchester city not found'); process.exit(1) }

  const allMcr = await prisma.venue.findMany({
    where: { cityId: mcr.id },
    select: { id: true, name: true, slug: true, address: true, googlePlaceId: true, website: true, photoUrl: true, photoUrl2: true, photoUrl3: true },
  })

  const results = { matched: [], ambiguous: [], notFound: [] }

  for (const name of REQUESTED) {
    let candidates = allMcr.filter(v => namesLikelyMatch(name, v.name))
    if (candidates.length === 0) {
      const anchor = name.replace(/[^a-z0-9\s]/gi, '').split(/\s+/).slice(0, 2).join(' ')
      candidates = allMcr.filter(v => v.name.toLowerCase().includes(anchor.toLowerCase()))
    }
    if (candidates.length === 1) results.matched.push({ requested: name, ...candidates[0] })
    else if (candidates.length > 1) results.ambiguous.push({ requested: name, candidates })
    else results.notFound.push(name)
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
