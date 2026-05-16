import Link from 'next/link'

const CARD_COLORS = [
  { bg: '#7F77DD', emoji: '🎪' },
  { bg: '#1D9E75', emoji: '🧸' },
  { bg: '#D85A30', emoji: '🎡' },
  { bg: '#F59E0B', emoji: '🎠' },
]

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)

  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
    </span>
  )
}

interface VenueCardProps {
  venue: {
    name: string
    slug: string
    address: string
    googleRating?: number | null
    googleReviewCount?: number | null
    features: string[]
    isFeatured?: boolean
    isNew?: boolean
    city?: { slug: string }
    area?: { slug: string }
  }
  index?: number
}

export default function VenueCard({ venue, index = 0 }: VenueCardProps) {
  const color = CARD_COLORS[index % CARD_COLORS.length]
  const badge = venue.isFeatured ? 'Top pick' : venue.isNew ? 'New' : null

  const href = venue.city && venue.area
    ? `/${venue.city.slug}/${venue.area.slug}/${venue.slug}`
    : `#`

  return (
    <Link href={href} className="venue-card group block">
      {/* Coloured image placeholder */}
      <div
        className="relative h-44 flex items-center justify-center"
        style={{ backgroundColor: color.bg }}
      >
        {badge && (
          <span className="absolute top-3 left-3 bg-white text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {badge}
          </span>
        )}
        <span className="text-6xl select-none">{color.emoji}</span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#7F77DD] transition-colors mb-1.5">
          {venue.name}
        </h3>

        <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {venue.address}
        </p>

        {venue.googleRating && (
          <div className="flex items-center gap-1.5 mb-3">
            <StarRating rating={venue.googleRating} />
            <span className="text-sm font-semibold text-gray-900">{venue.googleRating.toFixed(1)}</span>
            {venue.googleReviewCount && (
              <span className="text-xs text-gray-400">{venue.googleReviewCount.toLocaleString()} Google reviews</span>
            )}
          </div>
        )}

        {venue.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {venue.features.slice(0, 4).map((f) => (
              <span key={f} className="chip bg-gray-100 text-gray-600 text-xs px-2 py-0.5">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
