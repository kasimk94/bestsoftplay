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
  'Coldharbour Adventure Play Centre',
  'The London Play Den',
  'Smart Play',
  'Little Crafters Cafe',
  'Minivalley Kids',
  'Whippersnappers',
  'Old Bank Coffee',
  'Enchanted Wood',
  "Mowglis Home",
  'Ollie Polly',
  'Mome London',
  'Kids n Joy Cafe',
  'Totstars The Club',
  'Mulligans Romford',
  'Purple Dragon',
  'Beans and Barley',
  'Triangle Children, Young People and Community Centre',
  'Gravity Max Wandsworth',
  'Ballpit',
  'Apple Tree Childrens Cafe',
  'Tenpin Croydon',
  'Jump&Play',
  'Wild Cubs Free Childrens Play Area',
  'Kinder Play Cafe',
]

async function main() {
  const london = await prisma.city.findUnique({ where: { slug: 'london' } })
  const allLondon = await prisma.venue.findMany({
    where: { cityId: london.id },
    select: { id: true, name: true, slug: true, address: true, googlePlaceId: true, isExcluded: true },
  })

  const results = { matched: [], ambiguous: [], notFound: [] }

  for (const name of REQUESTED) {
    let candidates = allLondon.filter(v => namesLikelyMatch(name, v.name))
    if (candidates.length === 0) {
      const anchor = name.replace(/[^a-z0-9\s]/gi, '').split(/\s+/).slice(0, 2).join(' ')
      candidates = allLondon.filter(v => v.name.toLowerCase().includes(anchor.toLowerCase()))
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
}

main().finally(() => prisma.$disconnect())
