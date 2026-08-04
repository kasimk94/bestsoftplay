require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const TERMS = ['altrincham', 'move', 'fun2b', 'fun 2 b', 'fun2']

async function main() {
  const mcr = await prisma.city.findUnique({ where: { slug: 'manchester' } })
  for (const term of TERMS) {
    const matches = await prisma.venue.findMany({
      where: { cityId: mcr.id, name: { contains: term, mode: 'insensitive' } },
      select: { name: true, address: true, slug: true, isExcluded: true },
    })
    console.log(`\n"${term}" -> ${matches.length}`)
    for (const m of matches) console.log(`  - ${m.name} | ${m.address} | excluded=${m.isExcluded}`)
  }
}
main().finally(() => prisma.$disconnect())
