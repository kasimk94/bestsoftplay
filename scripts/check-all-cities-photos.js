const { PrismaClient } = require('@prisma/client')
const https = require('https')
const prisma = new PrismaClient()

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { timeout: 6000 }, (res) => {
        resolve(res.statusCode)
        res.resume()
      })
      req.on('error', () => resolve('ERR'))
      req.on('timeout', () => { req.destroy(); resolve('TIMEOUT') })
    } catch { resolve('ERR') }
  })
}

async function sampleCity(slug, n = 10) {
  const city = await prisma.city.findUnique({ where: { slug } })
  const venues = await prisma.venue.findMany({
    where: { cityId: city.id, photoUrl: { not: null } },
    select: { photoUrl: true },
    take: n,
  })
  let ok = 0
  for (const v of venues) {
    const status = await checkUrl(v.photoUrl)
    if (status === 200 || status === 301 || status === 302) ok++
  }
  return { total: venues.length, ok, broken: venues.length - ok }
}

async function testProxy(photoReference) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return 'NO_API_KEY'
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${encodeURIComponent(photoReference)}&key=${key}`
  const status = await checkUrl(url)
  return status
}

async function main() {
  console.log('Sampling 10 photoUrls per city...\n')
  for (const slug of ['london', 'birmingham', 'manchester']) {
    const r = await sampleCity(slug)
    console.log(`${slug.padEnd(12)}: ${r.ok} OK, ${r.broken} broken (of ${r.total} sampled)`)
  }

  // Test proxy fallback using a Manchester photoReference
  const city = await prisma.city.findUnique({ where: { slug: 'manchester' } })
  const sample = await prisma.venue.findFirst({
    where: { cityId: city.id, photoReference: { not: null } },
    select: { name: true, photoReference: true },
  })
  if (sample) {
    console.log(`\nTesting Places API proxy with a Manchester ref...`)
    const status = await testProxy(sample.photoReference)
    console.log(`  ${sample.name}: proxy status = ${status}`)
  }
}

main().finally(() => prisma.$disconnect())
