const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // First, show all venues that will be affected BEFORE making changes
  const toExclude = await prisma.venue.findMany({
    where: {
      OR: [
        { name: { contains: 'Park', mode: 'insensitive' } },
        { name: { contains: 'Leisure Centre', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, isExcluded: true, city: { select: { name: true } } },
    orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
  })

  console.log(`\nVenues matching "Park" or "Leisure Centre" (${toExclude.length} total):\n`)
  const alreadyExcluded = toExclude.filter(v => v.isExcluded)
  const toBeExcluded = toExclude.filter(v => !v.isExcluded)

  toBeExcluded.forEach(v => console.log(`  NEW  [${v.city.name}] ${v.name}`))
  if (alreadyExcluded.length) {
    console.log()
    alreadyExcluded.forEach(v => console.log(`  SKIP [${v.city.name}] ${v.name} (already excluded)`))
  }

  // Mark all as excluded
  const result = await prisma.venue.updateMany({
    where: {
      OR: [
        { name: { contains: 'Park', mode: 'insensitive' } },
        { name: { contains: 'Leisure Centre', mode: 'insensitive' } },
      ],
    },
    data: { isExcluded: true },
  })

  console.log(`\n✓ Marked ${result.count} venues as excluded.`)
  console.log(`  (${toBeExcluded.length} newly excluded, ${alreadyExcluded.length} already were)`)

  // Verify total excluded count
  const totalExcluded = await prisma.venue.count({ where: { isExcluded: true } })
  const totalVenues = await prisma.venue.count()
  console.log(`\nDB state: ${totalExcluded} of ${totalVenues} venues excluded.`)
}

main().finally(() => prisma.$disconnect())
