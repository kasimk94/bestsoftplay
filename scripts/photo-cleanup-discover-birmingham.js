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
  'Playwrights Cafe Coventry',
  'Adventure Street Ltd',
  'Neverland Fun House',
  'Little Jungle Soft Play and Party Centre',
  'Superbowl UK Wolverhampton',
  'Go Kids Play Coventry',
  'Frankie and Lolas Walsall',
  'Yum Yum World',
  'Kidz 2 Play',
  'Krazy Krocs',
  'Flipout Coventry',
  'Bermuda Adventure Softplay World',
  'Monster Mayhem Redditch',
  'Just Play Soft Play',
  'Spacehoppas Playzone',
  'Coffee and Crepes (Caffe and Soft Play)',
  'Little Latte Land',
  'Kiddistop',
  'Monster Mayhem',
  'Family Fun Zone',
  'Berzerk Active Play Atherstone',
  'Go Kids Go',
  'Planet Playworld',
  'Kids Kingdom Soft Play',
  'Fuzzy Eds Fun House',
  'Treasure Island',
]

async function main() {
  const bham = await prisma.city.findUnique({ where: { slug: 'birmingham' } })
  const allBham = await prisma.venue.findMany({
    where: { cityId: bham.id },
    select: { id: true, name: true, slug: true, address: true, googlePlaceId: true, website: true, photoUrl: true, photoUrl2: true, photoUrl3: true },
  })

  const results = { matched: [], ambiguous: [], notFound: [] }

  for (const name of REQUESTED) {
    let candidates = allBham.filter(v => namesLikelyMatch(name, v.name))
    if (candidates.length === 0) {
      const anchor = name.replace(/[^a-z0-9\s]/gi, '').split(/\s+/).slice(0, 2).join(' ')
      candidates = allBham.filter(v => v.name.toLowerCase().includes(anchor.toLowerCase()))
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
