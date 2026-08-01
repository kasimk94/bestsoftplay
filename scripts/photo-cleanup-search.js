require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const TERMS = ['salaspark', 'salsa', 'ellan', 'ellen', 'fratell', 'bertie', 'bro', 'sheriff', 'buzzy', 'buzy', 'bees', 'playbarn', 'barn']

async function main() {
  const london = await prisma.city.findUnique({ where: { slug: 'london' } })
  for (const term of TERMS) {
    const matches = await prisma.venue.findMany({
      where: { cityId: london.id, name: { contains: term, mode: 'insensitive' } },
      select: { name: true, address: true, slug: true, isExcluded: true },
    })
    console.log(`\n"${term}" -> ${matches.length}`)
    for (const m of matches) console.log(`  - ${m.name} | ${m.address} | excluded=${m.isExcluded}`)
  }
}
main().finally(() => prisma.$disconnect())
