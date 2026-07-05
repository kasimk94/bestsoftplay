import Link from 'next/link'
import VenuePhoto from './VenuePhoto'

const CARD_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

interface NearbyVenue {
  name: string
  slug: string
  googleRating: number | null
  googleReviewCount: number | null
  photoReference: string | null
  photoUrl: string | null
  photoUrl2: string | null
  photoUrl3: string | null
  distance: number
  city: { slug: string }
  area: { slug: string }
}

export default function NearbyVenues({ venues }: { venues: NearbyVenue[] }) {
  if (venues.length === 0) return null

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-5">More soft plays nearby</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {venues.map((venue, i) => {
          const color = CARD_COLORS[i % CARD_COLORS.length]
          const distLabel = venue.distance < 0.1 ? '< 0.1 mi' : `${venue.distance.toFixed(1)} mi`
          return (
            <Link
              key={venue.slug}
              href={`/${venue.city.slug}/${venue.area.slug}/${venue.slug}`}
              className="group block bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-[140px] overflow-hidden" style={{ backgroundColor: color }}>
                <VenuePhoto
                  directUrls={[venue.photoUrl, venue.photoUrl2, venue.photoUrl3]}
                  photoReference={venue.photoReference}
                  name={venue.name}
                  fallbackColor={color}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-gray-900 text-[11px] font-bold px-2 py-1 rounded-full shadow-sm">
                  📍 {distLabel}
                </span>
              </div>
              <div className="px-4 py-3">
                <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1.5">{venue.name}</h3>
                {venue.googleRating ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-sm leading-none">★</span>
                    <span className="text-sm font-bold text-gray-900">{venue.googleRating.toFixed(1)}</span>
                    {venue.googleReviewCount && (
                      <span className="text-xs text-gray-400">({venue.googleReviewCount.toLocaleString()})</span>
                    )}
                  </div>
                ) : (
                  <div className="h-5" />
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
