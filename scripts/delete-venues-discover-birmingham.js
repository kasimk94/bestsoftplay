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
  'Tickety Boo',
  'Bumble Bees Stay and Play',
  'The Square Play Cafe',
  'Sentastix',
  'Mini Mugs Funhouse',
  'Kids Rule Play Cafe',
  'Little Thinkers Birmingham',
  'LBS Coffee Shop',
  'Fun City',
  'Cafe Avenue',
  'Little Land of Play Cafe',
  'Air Ninja',
  'Pippatopia',
  'The Play Cafe Wombourne',
  'The Cube Coventry',
  'JR Playhouse',
  'Play Tropolis',
  'Gravity Birmingham',
  '2 Tone Cafe',
  'Underslade Adventure',
  'Tumble and Giggle',
  'Inflata Nation Theme Park Birmingham',
  'Tenpin Walsall',
  'Tenpin Dudley',
  'Pirates and Princesses Adventure Zone',
  'Jam Jam Boomerang Indoor Play',
  'Tenpin Coventry',
  'Scallywags Birmingham Ltd',
  'Little Play Barn',
  'Playland Walsall',
  'Tiny Tamworth Play Cafe',
]

async function main() {
  const bham = await prisma.city.findUnique({ where: { slug: 'birmingham' } })
  if (!bham) { console.error('Birmingham city not found'); process.exit(1) }

  const allBham = await prisma.venue.findMany({
    where: { cityId: bham.id },
    select: { id: true, name: true, slug: true, address: true, googlePlaceId: true, isExcluded: true },
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
    console.log(`"${m.requested}" -> DB: "${m.name}" | ${m.address} | slug=${m.slug} | excluded=${m.isExcluded}`)
  }

  console.log(`\n=== AMBIGUOUS (${results.ambiguous.length}) ===`)
  for (const a of results.ambiguous) {
    console.log(`"${a.requested}" -> ${a.candidates.length} candidates:`)
    for (const c of a.candidates) console.log(`  - ${c.name} | ${c.address} | ${c.slug}`)
  }

  console.log(`\n=== NOT FOUND (${results.notFound.length}) ===`)
  for (const n of results.notFound) console.log(`  - ${n}`)

  // Also do a DB-wide (all cities) duplicate name check for every requested name,
  // in case a venue with the same/similar name exists outside Birmingham too.
  console.log(`\n=== CROSS-CITY DUPLICATE CHECK (name appears in >1 city, or >1 row anywhere) ===`)
  for (const name of REQUESTED) {
    const all = await prisma.venue.findMany({
      where: { name: { contains: name.split(/\s+/).slice(0, 2).join(' '), mode: 'insensitive' } },
      select: { name: true, address: true, slug: true, city: { select: { name: true, slug: true } } },
    })
    const exactish = all.filter(v => namesLikelyMatch(name, v.name))
    if (exactish.length > 1) {
      console.log(`"${name}" — ${exactish.length} rows found across DB:`)
      exactish.forEach(v => console.log(`  - ${v.name} | ${v.address} | city=${v.city.name} | slug=${v.slug}`))
    }
  }
}

main().finally(() => prisma.$disconnect())
