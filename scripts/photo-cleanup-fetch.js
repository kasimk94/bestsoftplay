#!/usr/bin/env node
/**
 * Fetches candidate photos for one venue (by slug) so a human/agent can visually
 * classify which show genuine soft play content. Downloads up to 9 photos to
 * <outDir>/<slug>/ as 01.jpg, 02.jpg, ... and writes manifest.json mapping
 * each file to its resolved Google-hosted URL (the same URL that would be
 * stored in the DB if selected).
 *
 * Usage: node scripts/photo-cleanup-fetch.js <slug> [outDir]
 *
 * If the venue has no googlePlaceId, does a text search using name + stored
 * address to find the place first (prints the match for confirmation).
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const https = require('https')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY

const slug = process.argv[2]
const outDir = process.argv[3] || path.join(__dirname, '..', '..', '_photo_cleanup')
if (!slug) { console.error('Usage: node scripts/photo-cleanup-fetch.js <slug> [outDir]'); process.exit(1) }

function get(url, headers = {}) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 15000, headers }, (res) => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, data: null, raw: body }) }
      })
    })
    req.on('error', (e) => resolve({ status: 'ERR', data: null, err: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', data: null }) })
  })
}

function downloadBinary(url, destPath) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 20000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.destroy()
        return downloadBinary(res.headers.location, destPath).then(resolve)
      }
      if (res.statusCode !== 200) { res.destroy(); return resolve(false) }
      const file = fs.createWriteStream(destPath)
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve(true)))
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function textSearchPlace(query) {
  const r = await get('https://places.googleapis.com/v1/places:searchText', {})
  // searchText requires POST; use a small inline POST helper instead.
  return null
}

function postJson(url, body, headers = {}) {
  return new Promise((resolve) => {
    const bodyStr = JSON.stringify(body)
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...headers },
      timeout: 15000,
    }, (res) => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, data: null, raw: data }) }
      })
    })
    req.on('error', (e) => resolve({ status: 'ERR', data: null, err: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', data: null }) })
    req.write(bodyStr)
    req.end()
  })
}

async function findPlaceByNameAddress(name, address) {
  const r = await postJson('https://places.googleapis.com/v1/places:searchText', { textQuery: `${name} ${address}` }, {
    'X-Goog-Api-Key': API_KEY,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.businessStatus',
  })
  if (r.status !== 200 || !r.data?.places?.length) return null
  return r.data.places[0]
}

async function getPlaceDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?key=${API_KEY}&fields=id,displayName,formattedAddress,businessStatus,websiteUri,photos`
  const r = await get(url, { 'X-Goog-FieldMask': 'id,displayName,formattedAddress,businessStatus,websiteUri,photos' })
  if (r.status !== 200) return null
  return r.data
}

async function resolvePhotoUrl(photoName, maxHeightPx = 1000) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeightPx}&key=${API_KEY}&skipHttpRedirect=true`
  const r = await get(url)
  if (r.status !== 200 || !r.data?.photoUri) return null
  return r.data.photoUri
}

async function main() {
  if (!API_KEY) { console.error('GOOGLE_PLACES_API_KEY not set'); process.exit(1) }

  const venue = await prisma.venue.findUnique({ where: { slug } })
  if (!venue) { console.error(`Venue slug "${slug}" not found`); process.exit(1) }

  console.log(`\n=== ${venue.name} ===`)
  console.log(`Stored address: ${venue.address}`)
  console.log(`Stored googlePlaceId: ${venue.googlePlaceId ?? '(none)'}`)
  console.log(`Stored website: ${venue.website ?? '(none)'}`)

  let placeId = venue.googlePlaceId

  if (!placeId) {
    console.log(`No googlePlaceId — searching by name + address...`)
    const found = await findPlaceByNameAddress(venue.name, venue.address)
    if (!found) { console.log('❌ No Places match found via text search'); process.exit(2) }
    console.log(`Found candidate: ${found.displayName?.text} | ${found.formattedAddress} | status=${found.businessStatus ?? 'unknown'}`)
    placeId = found.id
  }

  const details = await getPlaceDetails(placeId)
  if (!details) { console.error('❌ Failed to fetch place details'); process.exit(2) }

  console.log(`Google name: ${details.displayName?.text}`)
  console.log(`Google address: ${details.formattedAddress}`)
  console.log(`Business status: ${details.businessStatus ?? 'unknown'}`)
  console.log(`Website: ${details.websiteUri ?? '(none)'}`)
  console.log(`Photos available: ${details.photos?.length ?? 0}`)

  if (!details.photos || details.photos.length === 0) {
    console.log('❌ No photos on this place')
    fs.mkdirSync(path.join(outDir, slug), { recursive: true })
    fs.writeFileSync(path.join(outDir, slug, 'manifest.json'), JSON.stringify({
      venueSlug: slug, venueName: venue.name, placeId, googleName: details.displayName?.text,
      googleAddress: details.formattedAddress, businessStatus: details.businessStatus, website: details.websiteUri,
      photos: [],
    }, null, 2))
    process.exit(0)
  }

  const dir = path.join(outDir, slug)
  fs.mkdirSync(dir, { recursive: true })

  const photos = details.photos.slice(0, 9)
  const manifest = { venueSlug: slug, venueName: venue.name, placeId, googleName: details.displayName?.text, googleAddress: details.formattedAddress, businessStatus: details.businessStatus, website: details.websiteUri, photos: [] }

  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    await sleep(100)
    const url = await resolvePhotoUrl(p.name)
    if (!url) { console.log(`  [${i + 1}] media URL failed`); continue }
    const filename = `${String(i + 1).padStart(2, '0')}.jpg`
    const dest = path.join(dir, filename)
    const ok = await downloadBinary(url, dest)
    console.log(`  [${i + 1}] ${ok ? '✓' : '✗'} ${filename} (${p.widthPx}x${p.heightPx})`)
    if (ok) manifest.photos.push({ file: filename, url, widthPx: p.widthPx, heightPx: p.heightPx })
  }

  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`Saved manifest + ${manifest.photos.length} photos to ${dir}`)
}

main().finally(() => prisma.$disconnect())
