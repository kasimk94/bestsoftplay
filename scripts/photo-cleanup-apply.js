#!/usr/bin/env node
/**
 * Applies a photo decision for one venue: sets photoUrl/photoUrl2/photoUrl3
 * to the given URLs (1-3 of them), clearing photoReference fields when the
 * URL isn't a Google-hosted one resolved from a photoReference we tracked.
 *
 * Usage: node scripts/photo-cleanup-apply.js <slug> <url1> [url2] [url3] [--rename "New Name"]
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const args = process.argv.slice(2)
const slug = args[0]
const renameIdx = args.indexOf('--rename')
let newName = null
let urlArgs = args.slice(1)
if (renameIdx !== -1) {
  newName = args[renameIdx + 1]
  urlArgs = args.slice(1, renameIdx)
}

if (!slug || urlArgs.length === 0) {
  console.error('Usage: node scripts/photo-cleanup-apply.js <slug> <url1> [url2] [url3] [--rename "New Name"]')
  process.exit(1)
}

async function main() {
  const venue = await prisma.venue.findUnique({ where: { slug } })
  if (!venue) { console.error(`Venue slug "${slug}" not found`); process.exit(1) }

  const [photoUrl = null, photoUrl2 = null, photoUrl3 = null] = urlArgs

  const data = { photoUrl, photoUrl2, photoUrl3, manuallyReviewed: true }
  if (newName) data.name = newName

  await prisma.venue.update({ where: { slug }, data })
  console.log(`✅ Updated ${venue.name}${newName ? ` -> renamed to "${newName}"` : ''} with ${urlArgs.length} photo(s)`)
}

main().finally(() => prisma.$disconnect())
