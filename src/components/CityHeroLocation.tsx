'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import SearchBar from './SearchBar'
import VenuePhoto from './VenuePhoto'
import { useCityLocation } from './CityLocationContext'
import NearbyMapModal, { type NearbyVenue } from './NearbyMapModal'

const InlineMap = dynamic(() => import('./NearbyMapContent'), {
  ssr: false,
  loading: () => <div className="h-full bg-black/10 animate-pulse" />,
})

type VenueFull = {
  id: string
  name: string
  slug: string
  lat: number | null
  lng: number | null
  googleRating: number | null
  googleReviewCount: number | null
  photoUrl: string | null
  photoUrl2: string | null
  photoUrl3: string | null
  photoReference: string | null
  city: { slug: string }
  area: { slug: string; name: string }
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

const RADIUS = 5
const MAX_INLINE_PINS = 8
const CARD_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

function ClosestVenueCard({ venue, index }: { venue: NearbyVenue; index: number }) {
  const href = `/${venue.city.slug}/${venue.area.slug}/${venue.slug}`
  const color = CARD_COLORS[index % CARD_COLORS.length]
  const distLabel = venue.distance < 0.1 ? '< 0.1 mi' : `${venue.distance.toFixed(1)} mi`

  return (
    <Link
      href={href}
      className="flex-none w-40 bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] block text-left"
    >
      <div className="relative h-[100px] overflow-hidden" style={{ backgroundColor: color }}>
        <VenuePhoto
          directUrls={[venue.photoUrl, venue.photoUrl2, venue.photoUrl3]}
          photoReference={venue.photoReference}
          name={venue.name}
          fallbackColor={color}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          📍 {distLabel}
        </span>
      </div>
      <div className="px-2.5 py-2">
        <p className="font-bold text-gray-900 text-xs leading-tight line-clamp-2 mb-1">{venue.name}</p>
        <p className="text-[10px] text-gray-400 truncate mb-1">{venue.area.name}</p>
        {venue.googleRating ? (
          <div className="flex items-center gap-0.5">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-xs font-semibold text-gray-700">{venue.googleRating.toFixed(1)}</span>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </Link>
  )
}

export default function CityHeroLocation({
  venues,
  totalCount,
  cityName,
}: {
  venues: VenueFull[]
  totalCount: number
  cityName: string
}) {
  const { setUserLocation, triggerNearestSort } = useCityLocation()
  const [nearbyVenues, setNearbyVenues] = useState<NearbyVenue[]>([])
  const [userLocation, setLocalUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [caption, setCaption] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleLocation = (pos: GeolocationPosition) => {
    const { latitude, longitude } = pos.coords
    const loc = { lat: latitude, lng: longitude }
    setLocalUserLocation(loc)
    setUserLocation(loc)

    const withDistance: NearbyVenue[] = venues
      .filter((v): v is VenueFull & { lat: number; lng: number } => v.lat != null && v.lng != null)
      .map((v) => ({ ...v, distance: haversine(latitude, longitude, v.lat, v.lng) }))
      .filter((v) => v.distance <= RADIUS)
      .sort((a, b) => a.distance - b.distance)

    setNearbyVenues(withDistance)

    if (withDistance.length > 0) {
      const n = Math.min(withDistance.length, MAX_INLINE_PINS)
      setCaption(`${n} closest venue${n !== 1 ? 's' : ''} to you`)
    } else {
      const nearest = venues
        .filter((v): v is VenueFull & { lat: number; lng: number } => v.lat != null && v.lng != null)
        .map((v) => haversine(latitude, longitude, v.lat, v.lng))
        .sort((a, b) => a - b)[0]
      setCaption(nearest !== undefined ? `Nearest venue is ${nearest.toFixed(1)} miles away` : null)
    }
  }

  const handleViewAll = () => {
    triggerNearestSort()
    document.getElementById('venue-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  const nearbyCount = nearbyVenues.length
  const closestVenues = nearbyVenues.slice(0, MAX_INLINE_PINS)

  const subtitle =
    nearbyCount > 0
      ? `${nearbyCount} venues near you · ${totalCount} across ${cityName}`
      : `${totalCount} soft play venues to explore`

  const showMap = nearbyCount > 0 && userLocation !== null

  return (
    <>
      <p className="text-white/75 text-xl font-semibold mb-10">{subtitle}</p>
      <div className="flex justify-center">
        <SearchBar onLocation={handleLocation} />
      </div>

      {caption && !showMap && (
        <p className="flex items-center justify-center gap-1.5 text-white/70 text-sm mt-4">
          <span>📍</span>
          {caption}
        </p>
      )}

      {showMap && (
        <div className="mt-5">
          {/* Caption */}
          <p className="text-white/70 text-sm mb-2 flex items-center justify-center gap-1.5">
            <span>📍</span>
            {caption}
          </p>

          {/* Compact inline map */}
          <div
            className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
            style={{ height: 280 }}
          >
            <InlineMap venues={closestVenues} userLocation={userLocation} compact />
            <button
              onClick={() => setModalOpen(true)}
              className="absolute top-2 right-2 z-[500] flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md hover:bg-white transition-colors"
              aria-label="Expand map"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Expand
            </button>
          </div>

          {/* Closest venues card row */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3 text-left">
              <h3 className="text-white font-bold text-base">Closest venues</h3>
              <button
                onClick={handleViewAll}
                className="text-white/70 text-xs font-semibold hover:text-white transition-colors"
              >
                View all {nearbyCount} nearby →
              </button>
            </div>
            <div
              className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              {closestVenues.map((venue, i) => (
                <ClosestVenueCard key={venue.id} venue={venue} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}

      {userLocation && (
        <NearbyMapModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          venues={nearbyVenues}
          userLocation={userLocation}
        />
      )}
    </>
  )
}
