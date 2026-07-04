const { PrismaClient } = require('@prisma/client')
const https = require('https')
const prisma = new PrismaClient()

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { timeout: 8000 }, (res) => {
        resolve({ status: res.statusCode, ct: res.headers['content-type'] })
        res.resume()
      })
      req.on('error', () => resolve({ status: 'ERR' }))
      req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT' }) })
    } catch {
      resolve({ status: 'ERR' })
    }
  })
}

async function main() {
  const city = await prisma.city.findUnique({ where: { slug: 'manchester' } })
  const venues = await prisma.venue.findMany({
    where: { cityId: city.id, photoUrl: { not: null } },
    select: { id: true, name: true, photoUrl: true, photoReference: true },
    take: 20,
  })

  console.log(`\nTesting ${venues.length} Manchester photoUrls...\n`)
  let ok = 0, broken = 0
  for (const v of venues) {
    const result = await checkUrl(v.photoUrl)
    const isOk = result.status === 200 || result.status === 301 || result.status === 302
    if (isOk) ok++; else broken++
    const ref = v.photoReference ? v.photoReference.substring(0, 40) + '…' : 'none'
    console.log(`[${result.status}] ${v.name.substring(0, 40).padEnd(40)} ref: ${ref}`)
  }
  console.log(`\nResult: ${ok} OK, ${broken} broken out of ${venues.length} sampled`)
  console.log('\nphotoReference format sample:')
  venues.filter(v => v.photoReference).slice(0, 3).forEach(v => {
    console.log(`  ${v.photoReference}`)
  })
}

main().finally(() => prisma.$disconnect())
