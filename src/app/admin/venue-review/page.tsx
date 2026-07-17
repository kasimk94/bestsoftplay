import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import VenueReviewClient from './VenueReviewClient'

export const dynamic = 'force-dynamic'

type Filter = 'lowconfidence' | 'all' | 'flagged' | 'noimage'

const FILTER_LABELS: Record<Filter, string> = {
  lowconfidence: 'Low confidence (<70%)',
  all: 'All venues',
  flagged: 'Flagged only',
  noimage: 'No image only',
}

function buildWhere(filter: Filter): Prisma.VenueWhereInput {
  if (filter === 'flagged') return { flagged: true }
  if (filter === 'noimage') {
    return {
      photoUrl: null,
      photoUrl2: null,
      photoUrl3: null,
      photoReference: null,
    }
  }
  if (filter === 'lowconfidence') return { qualityScore: { lt: 70 }, manuallyReviewed: false }
  return {}
}

function buildHref(filter: Filter) {
  return filter === 'lowconfidence' ? '/admin/venue-review' : `/admin/venue-review?filter=${filter}`
}

export default async function VenueReviewPage({
  searchParams,
}: {
  searchParams: { filter?: string }
}) {
  const filter: Filter =
    searchParams.filter === 'all' || searchParams.filter === 'flagged' || searchParams.filter === 'noimage'
      ? searchParams.filter
      : 'lowconfidence'

  const venues = await prisma.venue.findMany({
    where: buildWhere(filter),
    select: {
      id: true,
      name: true,
      address: true,
      qualityScore: true,
      qualityReason: true,
      flagged: true,
      flagNote: true,
      photoUrl: true,
      photoUrl2: true,
      photoUrl3: true,
      photoReference: true,
      city: { select: { name: true } },
    },
    // Postgres sorts NULLs last on ASC by default, so unclassified venues fall to the end.
    orderBy: [{ qualityScore: 'asc' }, { name: 'asc' }],
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Venue Review</h1>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{venues.length} venue(s) in this view</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <Link
            key={f}
            href={buildHref(f)}
            style={{
              fontSize: 13,
              padding: '6px 12px',
              borderRadius: 6,
              textDecoration: 'none',
              border: '1px solid #ccc',
              background: filter === f ? '#111' : '#fff',
              color: filter === f ? '#fff' : '#111',
            }}
          >
            {FILTER_LABELS[f]}
          </Link>
        ))}
      </div>

      <VenueReviewClient key={filter} initialVenues={venues} filterLabel={FILTER_LABELS[filter]} />
    </div>
  )
}
