'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import VenuePhoto from './VenuePhoto'
import { useCityLocation } from './CityLocationContext'

type Venue = {
  id: string
  name: string
  slug: string
  address: string
  lat: number | null
  lng: number | null
  googleRating: number | null
  googleReviewCount: number | null
  photoUrl: string | null
  photoUrl2: string | null
  photoUrl3: string | null
  photoReference: string | null
  features: string[]
  isFeatured: boolean
  isNew: boolean
  createdAt: string
  city: { slug: string }
  area: { slug: string; name: string }
}

const PAGE_SIZE = 12

const AGE_GROUPS = [
  { label: 'Under 2s', icon: '👶', bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B', keyword: 'under 2' },
  { label: '2–5 years', icon: '🧒', bg: '#D1FAE5', text: '#065F46', accent: '#10B981', keyword: '2–5' },
  { label: '5–12 years', icon: '🧗', bg: '#EDE9FE', text: '#4C1D95', accent: '#7C3AED', keyword: '5–12' },
  { label: 'All ages', icon: '🎉', bg: '#FCE7F3', text: '#831843', accent: '#EC4899', keyword: null },
]

const CATEGORIES = [
  { label: 'Ball Pit', icon: '🎱', bg: '#FFE4E1', text: '#9F1239', keyword: 'ball' },
  { label: 'Café', icon: '☕', bg: '#FEF3C7', text: '#92400E', keyword: 'caf' },
  { label: 'Climbing', icon: '🧗', bg: '#D1FAE5', text: '#065F46', keyword: 'climb' },
  { label: 'Sensory Play', icon: '🌈', bg: '#EDE9FE', text: '#4C1D95', keyword: 'sensor' },
  { label: 'Party Venue', icon: '🎉', bg: '#FCE7F3', text: '#831843', keyword: 'party' },
  { label: 'Toddler Only', icon: '👶', bg: '#E0F2FE', text: '#075985', keyword: 'toddler' },
]

const CARD_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function VenueCard({ venue, index, distance }: { venue: Venue; index: number; distance?: number }) {
  const color = CARD_COLORS[index % CARD_COLORS.length]
  const href = `/${venue.city.slug}/${venue.area.slug}/${venue.slug}`
  const badge = venue.isFeatured ? 'Top pick' : venue.isNew ? 'New' : null
  const hasPhoto = venue.photoUrl || venue.photoUrl2 || venue.photoUrl3 || venue.photoReference
  const distLabel =
    distance !== undefined
      ? distance < 0.1
        ? '< 0.1 mi'
        : `${distance.toFixed(1)} mi`
      : null

  return (
    <Link href={href} className="group block bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="relative h-[200px] overflow-hidden" style={{ backgroundColor: color }}>
        {hasPhoto && (
          <VenuePhoto
            directUrls={[venue.photoUrl, venue.photoUrl2, venue.photoUrl3]}
            photoReference={venue.photoReference}
            name={venue.name}
            fallbackColor={color}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {badge && !distLabel && (
          <span className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {badge}
          </span>
        )}
        {distLabel && (
          <span className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm">
            📍 {distLabel}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 z-10">
          <h3 className="font-bold text-white text-base leading-tight line-clamp-2">{venue.name}</h3>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{venue.area.name}</p>
        {venue.googleRating ? (
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-sm">★</span>
            <span className="text-sm font-bold text-gray-900">{venue.googleRating.toFixed(1)}</span>
            {venue.googleReviewCount && (
              <span className="text-xs text-gray-400">({venue.googleReviewCount.toLocaleString()} reviews)</span>
            )}
          </div>
        ) : (
          <div className="h-5" />
        )}
      </div>
    </Link>
  )
}

type Sort = 'rating' | 'reviews' | 'newest' | 'distance'

export default function CityPageInteractive({
  venues,
  city,
}: {
  venues: Venue[]
  city: { slug: string; name: string; colour: string }
}) {
  const { userLocation } = useCityLocation()
  const [ageFilter, setAgeFilter] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('rating')
  const [page, setPage] = useState(1)

  const venuesWithDistance = useMemo(() => {
    if (!userLocation) return venues.map((v) => ({ ...v, distance: undefined as number | undefined }))
    return venues.map((v) => ({
      ...v,
      distance:
        v.lat != null && v.lng != null
          ? haversine(userLocation.lat, userLocation.lng, v.lat, v.lng)
          : undefined,
    }))
  }, [venues, userLocation])

  const filtered = useMemo(() => {
    let result = [...venuesWithDistance]

    if (ageFilter) {
      result = result.filter((v) =>
        v.features.some((f) => f.toLowerCase().includes(ageFilter.toLowerCase()))
      )
    }
    if (catFilter) {
      result = result.filter((v) =>
        v.features.some((f) => f.toLowerCase().includes(catFilter.toLowerCase()))
      )
    }

    if (sort === 'rating') result.sort((a, b) => (b.googleRating ?? 0) - (a.googleRating ?? 0))
    else if (sort === 'reviews') result.sort((a, b) => (b.googleReviewCount ?? 0) - (a.googleReviewCount ?? 0))
    else if (sort === 'newest') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else if (sort === 'distance') result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

    return result
  }, [venuesWithDistance, ageFilter, catFilter, sort])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleAge(keyword: string | null) {
    setAgeFilter((prev) => (prev === keyword ? null : keyword))
    setPage(1)
  }
  function toggleCat(keyword: string) {
    setCatFilter((prev) => (prev === keyword ? null : keyword))
    setPage(1)
  }

  const hasFilters = ageFilter !== null || catFilter !== null

  return (
    <>
      {/* SECTION 3 — Browse by age */}
      <section className="py-14 px-4 relative" style={{ background: '#F3F1FF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Browse by age</h2>
            <span className="text-2xl">🎂</span>
          </div>
          <p className="text-gray-500 mb-8">Find the perfect venue for your child&apos;s age group</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {AGE_GROUPS.map((ag) => {
              const isActive = ageFilter === ag.keyword
              return (
                <button
                  key={ag.label}
                  onClick={() => toggleAge(ag.keyword)}
                  className="group rounded-3xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.03] border-2"
                  style={{
                    backgroundColor: isActive ? ag.accent : ag.bg,
                    borderColor: isActive ? ag.accent : 'transparent',
                  }}
                >
                  <div className="text-5xl mb-3 select-none">{ag.icon}</div>
                  <div
                    className="font-extrabold text-sm"
                    style={{ color: isActive ? '#fff' : ag.text }}
                  >
                    {ag.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Browse by category */}
      <section className="py-14 px-4 relative" style={{ background: '#EBE8FF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Browse by type</h2>
            <span className="text-2xl">🎪</span>
          </div>
          <p className="text-gray-500 mb-8">Filter venues by what they offer</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => {
              const isActive = catFilter === cat.keyword
              return (
                <button
                  key={cat.label}
                  onClick={() => toggleCat(cat.keyword)}
                  className="group rounded-2xl p-5 text-center shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.03] border-2"
                  style={{
                    backgroundColor: isActive ? cat.text : cat.bg,
                    borderColor: isActive ? cat.text : 'transparent',
                  }}
                >
                  <div className="text-4xl mb-2 select-none">{cat.icon}</div>
                  <div
                    className="font-bold text-xs leading-tight"
                    style={{ color: isActive ? '#fff' : cat.text }}
                  >
                    {cat.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7 — All venues with filters */}
      <section id="venue-grid" className="py-14 px-4 relative" style={{ background: '#F3F1FF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {hasFilters ? 'Filtered venues' : `All venues in ${city.name}`}
                </h2>
              </div>
              <p className="text-gray-500">
                {filtered.length} venue{filtered.length !== 1 ? 's' : ''}
                {hasFilters && ' match your filters'}
                {totalPages > 1 && ` — page ${page} of ${totalPages}`}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {hasFilters && (
                <button
                  onClick={() => { setAgeFilter(null); setCatFilter(null); setPage(1) }}
                  className="text-sm font-semibold text-[#7F77DD] hover:underline flex items-center gap-1"
                >
                  ✕ Clear filters
                </button>
              )}
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as Sort); setPage(1) }}
                className="text-sm border border-[#DDD9FF] rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#7F77DD] shadow-sm"
              >
                {userLocation && <option value="distance">Nearest first</option>}
                <option value="rating">Top rated</option>
                <option value="reviews">Most reviewed</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {paginated.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginated.map((venue, i) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    index={(page - 1) * PAGE_SIZE + i}
                    distance={sort === 'distance' ? venue.distance : undefined}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:border-gray-100 disabled:text-gray-300 border-[#DDD9FF] text-gray-600 hover:bg-[#EDE9FF] bg-white"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce<(number | '…')[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '…' ? (
                        <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium border transition-colors ${
                            p === page
                              ? 'bg-[#7F77DD] border-[#7F77DD] text-white'
                              : 'border-[#DDD9FF] text-gray-600 hover:bg-[#EDE9FF] bg-white'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:border-gray-100 disabled:text-gray-300 border-[#DDD9FF] text-gray-600 hover:bg-[#EDE9FF] bg-white"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-semibold text-gray-700 mb-1">No venues match your filters</p>
              <p className="text-sm text-gray-400 mb-6">Try removing a filter to see more results</p>
              <button
                onClick={() => { setAgeFilter(null); setCatFilter(null); setPage(1) }}
                className="inline-flex items-center gap-2 bg-[#7F77DD] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#6A62C8] transition-colors text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
