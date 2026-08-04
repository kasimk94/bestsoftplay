require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const TERMS = ['frankie', 'lola', 'walsall', 'crepe', 'caffe', 'kiddistop', 'kiddi', 'kids stop', 'family fun', 'fun zone']

async function main() {
  const bham = await prisma.city.findUnique({ where: { slug: 'birmingham' } })
  for (const term of TERMS) {
    const matches = await prisma.venue.findMany({
      where: { cityId: bham.id, name: { contains: term, mode: 'insensitive' } },
      select: { name: true, address: true, slug: true, isExcluded: true },
    })
    console.log(`\n"${term}" -> ${matches.length}`)
    for (const m of matches) console.log(`  - ${m.name} | ${m.address} | excluded=${m.isExcluded}`)
  }
}
main().finally(() => prisma.$disconnect())
