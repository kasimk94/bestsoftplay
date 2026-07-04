const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const restore = await p.venue.findMany({
    where: {
      isExcluded: true,
      OR: [
        { name: { contains: 'Play', mode: 'insensitive' } },
        { name: { contains: 'Soft', mode: 'insensitive' } },
        { name: { contains: 'Inflat', mode: 'insensitive' } },
        { name: { contains: 'Bounce', mode: 'insensitive' } },
        { name: { contains: 'Spark', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, city: { select: { name: true } } },
    orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
  })

  console.log(`Restoring ${restore.length} venues with indoor-play signals:\n`)
  restore.forEach(v => console.log(`  [${v.city.name}] ${v.name}`))

  await p.venue.updateMany({
    where: { id: { in: restore.map(v => v.id) } },
    data: { isExcluded: false },
  })

  const totalExcluded = await p.venue.count({ where: { isExcluded: true } })
  const totalVenues = await p.venue.count()
  console.log(`\nDone. DB state: ${totalExcluded} of ${totalVenues} venues excluded.`)
}

main().finally(() => p.$disconnect())
