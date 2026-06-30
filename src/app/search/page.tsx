import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import VenueCard from '@/components/VenueCard'
import SearchBar from '@/components/SearchBar'
import { prisma } from '@/lib/prisma'
import { excludeNonSoftPlay } from '@/lib/venueFilters'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Search Soft Play Venues – BestSoftPlay',
  description: 'Search for soft play venues near you by postcode, location, or name.',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const clean = postcode.replace(/\s+/g, '').toUpperCase()
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 200 || !data.result) return null
    return { lat: data.result.latitude, lng: data.result.longitude }
  } catch {
    return null
  }
}

// ── DB queries ────────────────────────────────────────────────────────────────

const VENUE_SELECT = {
  id: true, name: true, slug: true, address: true,
  lat: true, lng: true,
  googleRating: true, googleReviewCount: true,
  photoUrl: true, photoUrl2: true, photoUrl3: true, photoReference: true,
  features: true, isFeatured: true, isNew: true,
  city: { select: { slug: true, name: true } },
  area: { select: { slug: true, name: true } },
} as const

async function nearbyVenues(lat: number, lng: number, limit = 24) {
  const all = await prisma.venue.findMany({
    where: { AND: excludeNonSoftPlay() },
    select: VENUE_SELECT,
  })
  return all
    .filter((v) => v.lat != null && v.lng != null)
    .map((v) => ({ ...v, distance: haversine(lat, lng, v.lat!, v.lng!) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
}

async function textSearch(q: string) {
  return prisma.venue.findMany({
    where: {
      AND: [
        ...excludeNonSoftPlay(),
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { address: { contains: q, mode: 'insensitive' } },
            { area: { name: { contains: q, mode: 'insensitive' } } },
            { city: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ],
    },
    select: VENUE_SELECT,
    orderBy: [{ isFeatured: 'desc' }, { googleRating: 'desc' }],
    take: 48,
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────

type VenueRow = Awaited<ReturnType<typeof textSearch>>[number]
type NearbyRow = VenueRow & { distance: number }

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: { q?: string; lat?: string; lng?: string }
}

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q?.trim() ?? ''
  const latParam = searchParams.lat != null ? parseFloat(searchParams.lat) : null
  const lngParam = searchParams.lng != null ? parseFloat(searchParams.lng) : null

  // Determine mode and run the right query
  type Mode = 'location' | 'postcode' | 'text' | 'empty'
  let mode: Mode = 'empty'
  let results: (VenueRow | NearbyRow)[] = []
  let heading = 'Search results'
  let subheading = ''
  let postcodeInvalid = false

  if (latParam != null && lngParam != null && !isNaN(latParam) && !isNaN(lngParam)) {
    mode = 'location'
    results = await nearbyVenues(latParam, lngParam)
    heading = `${results.length} venue${results.length !== 1 ? 's' : ''} near you`
    subheading = 'Sorted by distance from your location'

  } else if (q) {
    if (UK_POSTCODE_RE.test(q)) {
      const geo = await geocodePostcode(q)
      if (geo) {
        mode = 'postcode'
        results = await nearbyVenues(geo.lat, geo.lng)
        heading = `${results.length} venue${results.length !== 1 ? 's' : ''} near ${q.toUpperCase()}`
        subheading = 'Sorted by distance from this postcode'
      } else {
        postcodeInvalid = true
        mode = 'text'
        results = []
        heading = `Postcode not found: "${q.toUpperCase()}"`
        subheading = 'Check the postcode and try again, or search for a venue name'
      }
    } else {
      mode = 'text'
      results = await textSearch(q)
      heading =
        results.length > 0
          ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`
          : `No results for "${q}"`
      subheading =
        results.length > 0
          ? `Soft play venues matching "${q}"`
          : 'Try a different spelling, a postcode, or browse a city below'
    }
  }

  const showDistance = mode === 'location' || mode === 'postcode'
  const hasResults = results.length > 0

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="bg-[#7F77DD] pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 tracking-tight">
            Find soft play near you
          </h1>
          <SearchBar />
        </div>
      </section>

      {/* Results */}
      <section className="bg-[#F3F1FF] min-h-[50vh] py-12 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Heading */}
          {mode !== 'empty' && (
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{heading}</h2>
              {subheading && <p className="text-gray-500 mt-1">{subheading}</p>}
            </div>
          )}

          {/* No-query state */}
          {mode === 'empty' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Search for soft play</h2>
              <p className="text-gray-500 mb-8">
                Enter a postcode, venue name, or use your location to find soft play venues near you
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {['London', 'Birmingham', 'Manchester'].map((city) => (
                  <Link
                    key={city}
                    href={`/${city.toLowerCase()}`}
                    className="px-6 py-3 bg-white rounded-2xl font-semibold text-[#7F77DD] shadow-sm hover:shadow-md transition-all"
                  >
                    Browse {city} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No-results state */}
          {mode !== 'empty' && !hasResults && !postcodeInvalid && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😕</div>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">{subheading}</p>
              <div className="flex flex-wrap justify-center gap-4">
                {['London', 'Birmingham', 'Manchester'].map((city) => (
                  <Link
                    key={city}
                    href={`/${city.toLowerCase()}`}
                    className="px-6 py-3 bg-white rounded-2xl font-semibold text-[#7F77DD] shadow-sm hover:shadow-md transition-all"
                  >
                    Browse {city} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Invalid postcode */}
          {postcodeInvalid && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📮</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{heading}</h2>
              <p className="text-gray-500 mb-8">{subheading}</p>
            </div>
          )}

          {/* Results grid */}
          {hasResults && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {results.map((venue, i) => (
                <div key={venue.id} className="relative">
                  {showDistance && 'distance' in venue && (
                    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      📍 {venue.distance < 0.1 ? '< 0.1' : venue.distance.toFixed(1)} mi
                    </div>
                  )}
                  <VenueCard venue={venue} index={i} />
                </div>
              ))}
            </div>
          )}

          {/* City browse links (after results) */}
          {hasResults && (
            <div className="mt-12 text-center">
              <p className="text-gray-500 mb-4">Browse all venues by city</p>
              <div className="flex flex-wrap justify-center gap-4">
                {['London', 'Birmingham', 'Manchester'].map((city) => (
                  <Link
                    key={city}
                    href={`/${city.toLowerCase()}`}
                    className="px-6 py-3 bg-white rounded-2xl font-semibold text-[#7F77DD] shadow-sm hover:shadow-md transition-all"
                  >
                    {city} →
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </>
  )
}
