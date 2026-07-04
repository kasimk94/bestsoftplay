const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const city = await prisma.city.findUnique({ where: { slug: 'manchester' } })
  if (!city) { console.log('City not found'); return }

  const venues = await prisma.venue.findMany({
    where: { cityId: city.id },
    select: { id: true, name: true, photoUrl: true, photoUrl2: true, photoUrl3: true, photoReference: true },
  })

  const total = venues.length
  const hasPhotoUrl     = venues.filter(v => v.photoUrl).length
  const hasPhotoRef     = venues.filter(v => v.photoReference).length
  const hasAny          = venues.filter(v => v.photoUrl || v.photoReference).length
  const hasNone         = venues.filter(v => !v.photoUrl && !v.photoReference).length

  console.log(`\n=== Manchester photo audit ===`)
  console.log(`Total venues: ${total}`)
  console.log(`Have photoUrl:       ${hasPhotoUrl}`)
  console.log(`Have photoReference: ${hasPhotoRef}`)
  console.log(`Have any photo:      ${hasAny}`)
  console.log(`Have NO photo at all: ${hasNone}`)

  // Sample of venues with no photos
  const noPhoto = venues.filter(v => !v.photoUrl && !v.photoReference)
  console.log(`\nFirst 5 venues with no photos:`)
  noPhoto.slice(0, 5).forEach(v => console.log(`  - ${v.name}`))

  // Sample of venues with a photoUrl - check format
  const withUrl = venues.filter(v => v.photoUrl)
  if (withUrl.length > 0) {
    console.log(`\nSample photoUrls:`)
    withUrl.slice(0, 3).forEach(v => console.log(`  - ${v.name}: ${v.photoUrl?.substring(0, 80)}...`))
  }
}

main().finally(() => prisma.$disconnect())
