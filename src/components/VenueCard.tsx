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
  const stars = venue.googleRating ? Math.round(venue.googleRating) : 0
  const badge = venue.isFeatured ? 'Top pick' : venue.isNew ? 'New' : null

  return (
    <Link href={href} className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      {/* Full-bleed photo */}
      <div className="relative h-[200px] overflow-hidden" style={{ backgroundColor: color }}>
        {venue.photoReference && (
          <VenuePhoto
            photoReference={venue.photoReference}
            name={venue.name}
            fallbackColor={color}
          />
        )}
        {badge && (
          <span className="absolute top-3 left-3 z-10 bg-white text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {badge}
          </span>
        )}
      </div>

      {/* Card content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-[#7F77DD] transition-colors mb-1 line-clamp-1">
          {venue.name}
        </h3>

        <p className="text-xs text-gray-500 mb-3 line-clamp-1">
          {venue.area?.name ?? venue.address}
        </p>

        {venue.googleRating ? (
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-sm leading-none">
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
            </span>
            <span className="text-sm font-bold text-gray-900">{venue.googleRating.toFixed(1)}</span>
            {venue.googleReviewCount && (
              <span className="text-xs text-gray-400">({venue.googleReviewCount.toLocaleString()})</span>
            )}
          </div>
        ) : null}
      </div>
    </Link>
  )
}
