import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
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

const CITY_BBOXES = [
  { slug: 'london',     minLat: 51.2,  maxLat: 51.7,  minLng: -0.6,  maxLng: 0.4   },
  { slug: 'birmingham', minLat: 52.35, maxLat: 52.75, minLng: -2.3,  maxLng: -1.70 },
  { slug: 'manchester', minLat: 53.35, maxLat: 53.65, minLng: -2.5,  maxLng: -1.9  },
]

function detectCity(lat: number, lng: number): string | null {
  return CITY_BBOXES.find(
    c => lat >= c.minLat && lat <= c.maxLat && lng >= c.minLng && lng <= c.maxLng
  )?.slug ?? null
}

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
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`, { next: { revalidate: 86400 } })
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

const CITY_LINKS = [
  { name: 'London',     slug: 'london',     emoji: '🎡', gradient: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' },
  { name: 'Birmingham', slug: 'birmingham', emoji: '🎠', gradient: 'linear-gradient(135deg, #EA580C 0%, #FDE047 100%)' },
  { name: 'Manchester', slug: 'manchester', emoji: '🎉', gradient: 'linear-gradient(135deg, #059669 0%, #22D3EE 100%)' },
]

interface Props {
  searchParams: { q?: string; lat?: string; lng?: string }
}

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q?.trim() ?? ''
  const latParam = searchParams.lat != null ? parseFloat(searchParams.lat) : null
  const lngParam = searchParams.lng != null ? parseFloat(searchParams.lng) : null

  type Mode = 'location' | 'postcode' | 'outofarea' | 'text' | 'empty'
  let mode: Mode = 'empty'
  let results: (VenueRow | NearbyRow)[] = []
  let heading = ''
  let subheading = ''
  let postcodeDisplay = ''

  if (latParam != null && lngParam != null && !isNaN(latParam) && !isNaN(lngParam)) {
    // Location-based search (from "Use my location" on homepage)
    // Check if within a covered city → redirect to city page
    const city = detectCity(latParam, lngParam)
    if (city) {
      redirect(`/${city}`)
    }
    mode = 'location'
    results = await nearbyVenues(latParam, lngParam)
    heading = `${results.length} venue${results.length !== 1 ? 's' : ''} near you`
    subheading = 'Sorted by distance from your location'

  } else if (q) {
    if (UK_POSTCODE_RE.test(q)) {
      const geo = await geocodePostcode(q)
      if (geo) {
        const city = detectCity(geo.lat, geo.lng)
        if (city) {
          // Covered city postcode → redirect to the city page with inline search
          redirect(`/${city}?postcode=${encodeURIComponent(q.toUpperCase())}`)
        }
        // Outside our coverage
        mode = 'outofarea'
        postcodeDisplay = q.toUpperCase()
        heading = `${postcodeDisplay} is outside our coverage area`
        subheading = 'We currently cover London, Birmingham, and Manchester'
      } else {
        mode = 'outofarea'
        postcodeDisplay = q.toUpperCase()
        heading = `Postcode not found: ${postcodeDisplay}`
        subheading = 'Check the postcode and try again, or browse a city below'
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
          ? `Soft play venues matching your search`
          : 'Try a different spelling, or browse a city below'
    }
  }

  const showDistance = mode === 'location'
  const hasResults = results.length > 0

  return (
    <>
      <Navbar />

      {/* Hero — lavender gradient matching the site palette */}
      <section
        className="relative overflow-hidden pt-16 pb-24 px-4 text-center"
        style={{ background: 'linear-gradient(160deg, #2D1B69 0%, #7F77DD 55%, #A78BFA 100%)' }}
      >
        {/* Subtle scatter emojis */}
        {['✨','⭐','💫','🌟','✨','⭐'].map((e, i) => (
          <span key={i} className="absolute text-white/15 pointer-events-none select-none"
            style={{
              fontSize: `${[2.2,1.6,2.6,1.4,2.0,1.8][i]}rem`,
              top: `${[10,35,8,55,20,70][i]}%`,
              left: i % 2 === 0 ? `${[4,10,18][Math.floor(i/2)]}%` : undefined,
              right: i % 2 === 1 ? `${[5,9,15][Math.floor(i/2)]}%` : undefined,
            }}
          >{e}</span>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#F3F1FF] to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-6xl mb-4 select-none">🔍</div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3 drop-shadow-lg">
            Find soft play near you
          </h1>
          <p className="text-white/75 text-lg font-medium mb-8">
            Search by postcode, venue name, or use your location
          </p>
          <SearchBar initialQuery={q || undefined} />
        </div>
      </section>

      {/* Results */}
      <section className="min-h-[50vh] py-14 px-4" style={{ background: '#F3F1FF' }}>
        <div className="max-w-7xl mx-auto">

          {/* Out of area */}
          {mode === 'outofarea' && (
            <div className="max-w-xl mx-auto text-center py-12">
              <div className="text-6xl mb-5 select-none">📍</div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{heading}</h2>
              <p className="text-gray-500 mb-8 text-base">{subheading}</p>
              <p className="text-sm text-gray-400 mb-6">
                Your postcode appears to be outside London, Birmingham, and Manchester —
                the three cities we currently cover.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {CITY_LINKS.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="group relative overflow-hidden rounded-2xl p-5 text-center text-white font-bold shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.03]"
                    style={{ background: c.gradient }}
                  >
                    <div className="text-3xl mb-2 select-none">{c.emoji}</div>
                    <div className="text-base font-extrabold">{c.name}</div>
                    <div className="text-xs opacity-70 mt-0.5">Browse venues →</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No-query state */}
          {mode === 'empty' && (
            <div className="max-w-xl mx-auto text-center py-12">
              <p className="text-gray-500 text-base mb-8">
                Enter a postcode or venue name above, or browse a city:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {CITY_LINKS.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="group relative overflow-hidden rounded-2xl p-5 text-center text-white font-bold shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.03]"
                    style={{ background: c.gradient }}
                  >
                    <div className="text-3xl mb-2 select-none">{c.emoji}</div>
                    <div className="text-base font-extrabold">{c.name}</div>
                    <div className="text-xs opacity-70 mt-0.5">Browse venues →</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Result heading */}
          {(mode === 'text' || mode === 'location') && (
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{heading}</h2>
              {subheading && <p className="text-gray-500 mt-1">{subheading}</p>}
            </div>
          )}

          {/* No results */}
          {(mode === 'text' || mode === 'location') && !hasResults && (
            <div className="max-w-xl mx-auto text-center py-12">
              <div className="text-6xl mb-4 select-none">😕</div>
              <p className="text-gray-500 mb-8">{subheading}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {CITY_LINKS.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="group relative overflow-hidden rounded-2xl p-5 text-center text-white font-bold shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.03]"
                    style={{ background: c.gradient }}
                  >
                    <div className="text-3xl mb-2 select-none">{c.emoji}</div>
                    <div className="text-base font-extrabold">{c.name}</div>
                    <div className="text-xs opacity-70 mt-0.5">Browse venues →</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Results grid */}
          {hasResults && (
            <>
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

              {/* City browse links (footer) */}
              <div className="mt-12 pt-10 border-t border-[#DDD9FF]">
                <p className="text-center text-gray-500 mb-5 text-sm">Browse all venues by city</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {CITY_LINKS.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/${c.slug}`}
                      className="group relative overflow-hidden rounded-2xl p-5 text-center text-white font-bold shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.03]"
                      style={{ background: c.gradient }}
                    >
                      <div className="text-3xl mb-2 select-none">{c.emoji}</div>
                      <div className="text-base font-extrabold">{c.name}</div>
                      <div className="text-xs opacity-70 mt-0.5">Browse venues →</div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      </section>

      <Footer />
    </>
  )
}
