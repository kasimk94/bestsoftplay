#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const city = await prisma.city.findUnique({ where: { slug: 'london' } })
  console.log('London city:', JSON.stringify(city))

  const areas = await prisma.area.findMany({
    where: { cityId: city.id },
    include: { _count: { select: { venues: true } } },
    orderBy: { name: 'asc' },
  })
  console.log('\nAreas and venue counts:')
  areas.forEach(a => console.log(`  ${a.name} (slug: ${a.slug}, id: ${a.id}) => ${a._count.venues} venues`))

  const sample = await prisma.venue.findMany({
    where: { cityId: city.id },
    include: { area: true },
    take: 20,
    orderBy: { name: 'asc' },
  })
  console.log('\nSample venues (name | area | postcode | lat | lng):')
  sample.forEach(v =>
    console.log(`  "${v.name}" | ${v.area.name} | ${v.postcode} | ${v.lat} | ${v.lng}`)
  )

  const total = await prisma.venue.count({ where: { cityId: city.id } })
  console.log(`\nTotal London venues: ${total}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
