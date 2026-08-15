'use client'

import { useRef, useState } from 'react'
import { bulkDeleteByName, deleteVenueById, markReviewed, searchVenuesByName } from './actions'

export interface ReviewVenue {
  id: string
  name: string
  address: string
  qualityScore: number | null
  qualityReason: string | null
  flagged: boolean
  flagNote: string | null
  photoUrl: string | null
  photoUrl2: string | null
  photoUrl3: string | null
  photoReference: string | null
  localPhotos: string[]
  city: { name: string }
}

interface PendingDelete {
  toastId: string
  venue: ReviewVenue
}

type NameMatch = {
  id: string
  name: string
  qualityScore: number | null
  city: { name: string }
}

const btnBase: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  padding: '10px 20px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
}

function imageSrcFor(v: Pick<ReviewVenue, 'photoUrl' | 'photoUrl2' | 'photoUrl3' | 'photoReference' | 'localPhotos'>) {
  return (
    v.localPhotos[0] ??
    v.photoUrl ??
    v.photoUrl2 ??
    v.photoUrl3 ??
    (v.photoReference ? `/api/place-photo?ref=${encodeURIComponent(v.photoReference)}&w=500` : null)
  )
}

function BulkDeleteByName({ onDeleted }: { onDeleted: (query: string) => void }) {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<NameMatch[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const results = await searchVenuesByName(query)
      setMatches(results)
    } finally {
      setSearching(false)
    }
  }

  async function handleDeleteAll() {
    if (!query.trim() || !matches || matches.length === 0) return
    if (!window.confirm(`Permanently delete all ${matches.length} venue(s) matching "${query}"? This cannot be undone.`)) {
      return
    }
    setDeleting(true)
    try {
      const count = await bulkDeleteByName(query)
      onDeleted(query)
      setMatches(null)
      setQuery('')
      alert(`Deleted ${count} venue(s).`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 20, background: '#fafafa' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Bulk delete by name match
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder='e.g. "Baby Sensory"'
          style={{ flex: 1, fontSize: 13, padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          style={{ ...btnBase, fontSize: 13, padding: '6px 14px', background: '#111', color: '#fff' }}
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {matches !== null && (
        <div style={{ marginTop: 10 }}>
          {matches.length === 0 ? (
            <p style={{ fontSize: 13, color: '#666' }}>No venues match &quot;{query}&quot;.</p>
          ) : (
            <>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4, marginBottom: 8 }}>
                {matches.map((m) => (
                  <div key={m.id} style={{ fontSize: 12, padding: '4px 8px', borderBottom: '1px solid #f0f0f0' }}>
                    {m.name} — {m.city.name}
                    {m.qualityScore !== null && <span style={{ color: '#999' }}> ({m.qualityScore}%)</span>}
                  </div>
                ))}
              </div>
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                style={{ ...btnBase, fontSize: 13, padding: '6px 14px', background: '#dc2626', color: '#fff' }}
              >
                {deleting ? 'Deleting...' : `Delete all ${matches.length} matching`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ToastStack({ pending, onUndo }: { pending: PendingDelete[]; onUndo: (toastId: string) => void }) {
  if (pending.length === 0) return null
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50 }}>
      {pending.map((p) => (
        <div
          key={p.toastId}
          style={{
            background: '#222',
            color: '#fff',
            borderRadius: 6,
            padding: '10px 14px',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <span>Deleted &quot;{p.venue.name}&quot;</span>
          <button
            onClick={() => onUndo(p.toastId)}
            style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Undo
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 2,
              background: '#60a5fa',
              animation: 'venue-review-toast-shrink 5s linear forwards',
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes venue-review-toast-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

function VenueCard({
  venue,
  onDelete,
  onKeep,
}: {
  venue: ReviewVenue
  onDelete: (venue: ReviewVenue) => void
  onKeep: (venue: ReviewVenue) => void
}) {
  const imageSrc = imageSrcFor(venue)

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 130, background: '#eee' }}>
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#999' }}>
            No image
          </div>
        )}
      </div>

      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{venue.name}</div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
          {venue.city.name} — {venue.address}
        </div>

        {venue.qualityScore !== null ? (
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: venue.qualityScore < 70 ? '#dc2626' : '#16a34a' }}>
              Quality: {venue.qualityScore}%
            </span>
            {venue.qualityReason && <span style={{ color: '#666' }}> — {venue.qualityReason}</span>}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Not yet classified</div>
        )}

        {venue.flagged && (
          <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 6 }}>
            🚩 Previously flagged{venue.flagNote ? `: ${venue.flagNote}` : ''}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
          <button onClick={() => onDelete(venue)} style={{ ...btnBase, flex: 1, fontSize: 13, padding: '8px 0', background: '#dc2626', color: '#fff' }}>
            Delete
          </button>
          <button onClick={() => onKeep(venue)} style={{ ...btnBase, flex: 1, fontSize: 13, padding: '8px 0', background: '#16a34a', color: '#fff' }}>
            Keep
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VenueReviewClient({
  initialVenues,
  filterLabel,
}: {
  initialVenues: ReviewVenue[]
  filterLabel: string
}) {
  const [queue, setQueue] = useState<ReviewVenue[]>(initialVenues)
  const [pending, setPending] = useState<PendingDelete[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const visible = queue

  function handleKeep(venue: ReviewVenue) {
    markReviewed(venue.id).catch((err) => console.error('markReviewed failed', err))
    setQueue((q) => q.filter((v) => v.id !== venue.id))
  }

  function handleDelete(venue: ReviewVenue) {
    const toastId = `${venue.id}-${Date.now()}`

    setQueue((q) => q.filter((v) => v.id !== venue.id))
    setPending((p) => [...p, { toastId, venue }])

    const timer = setTimeout(async () => {
      timersRef.current.delete(toastId)
      setPending((p) => p.filter((x) => x.toastId !== toastId))
      try {
        await deleteVenueById(venue.id)
      } catch (err) {
        console.error('deleteVenueById failed', err)
      }
    }, 5000)

    timersRef.current.set(toastId, timer)
  }

  function handleUndo(toastId: string) {
    const timer = timersRef.current.get(toastId)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(toastId)
    }
    setPending((p) => {
      const item = p.find((x) => x.toastId === toastId)
      if (item) {
        setQueue((q) => [item.venue, ...q])
      }
      return p.filter((x) => x.toastId !== toastId)
    })
  }

  function handleBulkDeleted(query: string) {
    const lower = query.toLowerCase()
    setQueue((q) => q.filter((v) => !v.name.toLowerCase().includes(lower)))
  }

  return (
    <div>
      <BulkDeleteByName onDeleted={handleBulkDeleted} />

      {initialVenues.length === 0 ? (
        <p style={{ fontSize: 14, color: '#666' }}>No venues match this filter.</p>
      ) : queue.length === 0 ? (
        <p style={{ fontSize: 15, fontWeight: 600 }}>All venues in this list reviewed.</p>
      ) : (
        <>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            {queue.length} remaining <span style={{ fontWeight: 400, color: '#666', fontSize: 13 }}>({filterLabel})</span>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
            {visible.map((venue) => (
              <VenueCard key={venue.id} venue={venue} onDelete={handleDelete} onKeep={handleKeep} />
            ))}
          </div>
        </>
      )}

      <ToastStack pending={pending} onUndo={handleUndo} />
    </div>
  )
}
