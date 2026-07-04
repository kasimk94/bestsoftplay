const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

// These were explicitly requested for exclusion. Re-exclude them even if
// the restore-play-venues script un-excluded them for having "Play" in the name.
const FORCE_EXCLUDE = [
  'Stratford Park',
  'Stratford Park Play Area',
  'Forest Lane Play Area',
  'Plashet Park Play Area',
  "Priory Park Children's Play Area",
  'East Ham Leisure Centre',
  'Atherton Leisure Centre',
]

async function main() {
  const r = await p.venue.updateMany({
    where: { name: { in: FORCE_EXCLUDE } },
    data: { isExcluded: true },
  })
  console.log(`Re-excluded ${r.count} specifically listed venues.`)

  const total = await p.venue.count({ where: { isExcluded: true } })
  const all = await p.venue.count()
  console.log(`DB state: ${total} of ${all} venues excluded.`)
}

main().finally(() => p.$disconnect())
