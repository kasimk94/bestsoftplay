const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
p.venue.findMany({
  where: { isExcluded: true },
  select: { name: true, city: { select: { name: true } } },
  orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
}).then(vs => {
  vs.forEach(v => console.log(`[${v.city.name}] ${v.name}`))
  console.log('\nTotal excluded:', vs.length)
}).finally(() => p.$disconnect())
