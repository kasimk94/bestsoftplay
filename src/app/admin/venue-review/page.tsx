import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { flagVenue, unflagVenue } from './actions'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

type Filter = 'all' | 'flagged' | 'noimage'

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
  return {}
}

function buildHref(filter: Filter, page: number) {
  const params = new URLSearchParams()
  if (filter !== 'all') params.set('filter', filter)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return `/admin/venue-review${qs ? `?${qs}` : ''}`
}

export default async function VenueReviewPage({
  searchParams,
}: {
  searchParams: { filter?: string; page?: string }
}) {
  const filter: Filter =
    searchParams.filter === 'flagged' || searchParams.filter === 'noimage'
      ? searchParams.filter
      : 'all'

  const requestedPage = Number(searchParams.page ?? '1')
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1

  const where = buildWhere(filter)

  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      include: { city: true },
      orderBy: { name: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.venue.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Venue Review</h1>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        {total} venue{total === 1 ? '' : 's'} — page {page} of {totalPages}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'flagged', 'noimage'] as Filter[]).map((f) => (
          <Link
            key={f}
            href={buildHref(f, 1)}
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
            {f === 'all' ? 'All venues' : f === 'flagged' ? 'Flagged only' : 'No image only'}
          </Link>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {venues.map((venue) => {
          const imageSrc =
            venue.photoUrl ??
            venue.photoUrl2 ??
            venue.photoUrl3 ??
            (venue.photoReference
              ? `/api/place-photo?ref=${encodeURIComponent(venue.photoReference)}&w=400`
              : null)

          return (
            <div
              key={venue.id}
              style={{
                border: venue.flagged ? '2px solid #dc2626' : '1px solid #ddd',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <div style={{ height: 120, background: '#eee', position: 'relative' }}>
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt={venue.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: '#999',
                    }}
                  >
                    No image
                  </div>
                )}
                {venue.flagged && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      background: '#dc2626',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    FLAGGED
                  </span>
                )}
              </div>

              <div style={{ padding: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{venue.name}</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{venue.city.name}</div>

                {venue.flagged && venue.flagNote && (
                  <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 6 }}>
                    Note: {venue.flagNote}
                  </div>
                )}

                {venue.flagged ? (
                  <form action={unflagVenue}>
                    <input type="hidden" name="id" value={venue.id} />
                    <button
                      type="submit"
                      style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: '1px solid #ccc',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      Unflag
                    </button>
                  </form>
                ) : (
                  <form action={flagVenue} style={{ display: 'flex', gap: 6 }}>
                    <input type="hidden" name="id" value={venue.id} />
                    <input
                      type="text"
                      name="note"
                      placeholder="e.g. blurry"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 11,
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: '1px solid #ccc',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: 'none',
                        background: '#dc2626',
                        color: '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Flag
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {venues.length === 0 && (
        <p style={{ fontSize: 13, color: '#666', marginTop: 24 }}>No venues match this filter.</p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 24, alignItems: 'center' }}>
        {page > 1 ? (
          <Link href={buildHref(filter, page - 1)} style={{ fontSize: 13, padding: '6px 12px', border: '1px solid #ccc', borderRadius: 6, textDecoration: 'none', color: '#111' }}>
            ← Previous
          </Link>
        ) : (
          <span style={{ fontSize: 13, padding: '6px 12px', color: '#aaa' }}>← Previous</span>
        )}

        <span style={{ fontSize: 13, color: '#666' }}>
          Page {page} of {totalPages}
        </span>

        {page < totalPages ? (
          <Link href={buildHref(filter, page + 1)} style={{ fontSize: 13, padding: '6px 12px', border: '1px solid #ccc', borderRadius: 6, textDecoration: 'none', color: '#111' }}>
            Next →
          </Link>
        ) : (
          <span style={{ fontSize: 13, padding: '6px 12px', color: '#aaa' }}>Next →</span>
        )}
      </div>
    </div>
  )
}
