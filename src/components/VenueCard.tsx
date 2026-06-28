import Link from 'next/link'
import VenuePhoto from './VenuePhoto'

const CARD_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

interface VenueCardProps {
  venue: {
    name: string
    slug: string
    address: string
    googleRating?: number | null
    googleReviewCount?: number | null
    photoReference?: string | null
    photoUrl?: string | null
    photoUrl2?: string | null
    photoUrl3?: string | null
    features: string[]
    isFeatured?: boolean
    isNew?: boolean
    city?: { slug: string }
    area?: { slug: string; name?: string }
  }
  index?: number
}

export default function VenueCard({ venue, index = 0 }: VenueCardProps) {
  const color = CARD_COLORS[index % CARD_COLORS.length]
  const href = venue.city && venue.area ? `/${venue.city.slug}/${venue.area.slug}/${venue.slug}` : '#'
  const badge = venue.isFeatured ? 'Top pick' : venue.isNew ? 'New' : null

  return (
    <Link href={href} className="group block bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
      {/* Photo with gradient overlay */}
      <div className="relative h-[220px] overflow-hidden" style={{ backgroundColor: color }}>
        <VenuePhoto
          directUrls={[venue.photoUrl, venue.photoUrl2, venue.photoUrl3]}
          photoReference={venue.photoReference}
          name={venue.name}
          fallbackColor={color}
        />

        {/* Dark gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {badge && (
          <span className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {badge}
          </span>
        )}

        {/* Venue name on photo */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 z-10">
          <h3 className="font-bold text-white text-base leading-tight line-clamp-2 drop-shadow-sm group-hover:text-white/90 transition-colors">
            {venue.name}
          </h3>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-4 py-3">
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">
          {venue.area?.name ?? venue.address}
        </p>

        {venue.googleRating ? (
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-sm leading-none">★</span>
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
