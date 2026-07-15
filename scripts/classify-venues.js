#!/usr/bin/env node
/**
 * Batch-classify every venue as a genuine indoor soft play centre or not,
 * using Claude, and store a confidence score + reason on each venue.
 *
 * Usage:
 *   node scripts/classify-venues.js              classify all venues
 *   node scripts/classify-venues.js --limit=40    classify only the first N (testing)
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')

const prisma = new PrismaClient()

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY is not set')
  process.exit(1)
}

const BATCH_SIZE = 20
const DELAY_BETWEEN_BATCHES_MS = 1000
const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are building a directory for BestSoftPlay.co.uk. Identify ONLY genuine commercial indoor soft play centres — businesses whose primary purpose is children's indoor soft play with permanent equipment like climbing frames, ball pits, slides, tunnels, toddler zones, padded play areas.

Exclude: public parks, outdoor playgrounds, car parks, leisure centres (unless soft play is the main attraction), trampoline parks (unless primarily soft play), inflatable parks, adventure playgrounds, community centres, church halls, schools, nurseries, museums, farms, cafés with a small play corner, party venues without permanent soft play, gyms, activity centres where soft play is minor.

Based ONLY on the venue name, description and address provided (do not invent information), classify each venue and return a confidence score 0-100 for whether it's a genuine indoor soft play centre. Be conservative — if uncertain, score low.

Return ONLY valid JSON array, no markdown:
[{"id": "venue_id", "confidence": 85, "reason": "short reason"}]`

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body)
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers,
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 300)}`)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Request timeout')) })
    req.write(bodyStr)
    req.end()
  })
}

function extractJsonArray(text) {
  // Strip ```json ... ``` or ``` ... ``` fences if Claude adds them despite instructions
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON array found in response: ${text.slice(0, 300)}`)
  }
  return JSON.parse(candidate.slice(start, end + 1))
}

async function classifyBatch(venues) {
  const userContent = JSON.stringify(
    venues.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description ?? '',
      address: v.address ?? '',
    })),
    null,
    2
  )

  const res = await postJson(
    'https://api.anthropic.com/v1/messages',
    {
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Classify these venues:\n${userContent}` }],
    },
    {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    }
  )

  if (res.error) {
    throw new Error(`Anthropic API error: ${res.error.message ?? JSON.stringify(res.error)}`)
  }

  const text = res.content?.[0]?.text ?? ''
  return extractJsonArray(text)
}

async function classifyBatchWithRetry(venues, attempt = 1) {
  try {
    return await classifyBatch(venues)
  } catch (err) {
    if (attempt >= 3) throw err
    console.warn(`    ⚠ Batch failed (attempt ${attempt}): ${err.message} — retrying...`)
    await sleep(2000 * attempt)
    return classifyBatchWithRetry(venues, attempt + 1)
  }
}

// The Railway Postgres proxy occasionally drops idle/long-lived connections (P1017)
// or is briefly unreachable right after a reconnect (P1001). Retry the reconnect
// itself with backoff so a transient network blip can't kill the whole run.
async function reconnectWithRetry(attempt = 1) {
  try {
    await prisma.$disconnect()
    await prisma.$connect()
  } catch (err) {
    if (attempt >= 5) throw err
    const delay = 2000 * attempt
    console.warn(`    ⚠ Reconnect failed (attempt ${attempt}): ${err.message} — retrying in ${delay}ms...`)
    await sleep(delay)
    return reconnectWithRetry(attempt + 1)
  }
}

async function updateVenueWithRetry(data, attempt = 1) {
  try {
    await prisma.venue.update(data)
  } catch (err) {
    if (attempt >= 5) throw err
    console.warn(`    ⚠ DB update failed (attempt ${attempt}): ${err.message} — reconnecting...`)
    await reconnectWithRetry()
    await sleep(1000)
    return updateVenueWithRetry(data, attempt + 1)
  }
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined
  const reclassifyAll = process.argv.includes('--all')

  console.log('🔍  BestSoftPlay venue classification\n')

  const venues = await prisma.venue.findMany({
    where: reclassifyAll ? {} : { qualityScore: null },
    select: { id: true, name: true, description: true, address: true },
    orderBy: { name: 'asc' },
    ...(limit ? { take: limit } : {}),
  })

  const total = venues.length
  console.log(
    reclassifyAll
      ? `Found ${total} venue(s) to (re)classify\n`
      : `Found ${total} unclassified venue(s) to classify (use --all to reclassify everything)\n`
  )

  let processed = 0
  let updated = 0
  let belowThreshold = 0

  for (let i = 0; i < venues.length; i += BATCH_SIZE) {
    const batch = venues.slice(i, i + BATCH_SIZE)
    const byId = new Map(batch.map((v) => [v.id, v]))

    let results
    try {
      results = await classifyBatchWithRetry(batch)
    } catch (err) {
      console.error(`  ❌ Batch starting at venue ${i + 1} failed permanently: ${err.message}`)
      processed += batch.length
      console.log(`Processed ${processed}/${total} venues`)
      await sleep(DELAY_BETWEEN_BATCHES_MS)
      continue
    }

    for (const r of results) {
      const venue = byId.get(r.id)
      if (!venue) {
        console.warn(`    ⚠ Response referenced unknown venue id: ${r.id}`)
        continue
      }
      const confidence = Number(r.confidence)
      if (!Number.isFinite(confidence)) {
        console.warn(`    ⚠ Invalid confidence for ${venue.name}: ${r.confidence}`)
        continue
      }

      try {
        await updateVenueWithRetry({
          where: { id: venue.id },
          data: {
            qualityScore: Math.round(confidence),
            qualityReason: typeof r.reason === 'string' ? r.reason.slice(0, 500) : null,
          },
        })
        updated++
        if (confidence < 70) belowThreshold++
      } catch (err) {
        // Leave qualityScore null so this venue is picked up again on the next resume run
        console.error(`    ❌ Giving up on "${venue.name}" after repeated DB errors: ${err.message}`)
      }
    }

    processed += batch.length
    console.log(`Processed ${processed}/${total} venues`)

    // Refresh the DB connection periodically to avoid long-lived-connection drops (P1017)
    if (processed % 100 === 0) {
      try {
        await reconnectWithRetry()
      } catch (err) {
        console.warn(`    ⚠ Periodic reconnect failed, continuing on existing connection: ${err.message}`)
      }
    }

    if (i + BATCH_SIZE < venues.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS)
    }
  }

  console.log(`\n✅ Done. ${updated}/${total} venues classified.`)
  console.log(`   ${belowThreshold} venue(s) scored below 70% confidence.`)
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
