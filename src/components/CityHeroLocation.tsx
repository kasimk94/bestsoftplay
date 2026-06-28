'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import SearchBar from './SearchBar'
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

export default function CityHeroLocation({
  venues,
  totalCount,
  cityName,
}: {
  venues: VenueFull[]
  totalCount: number
  cityName: string
}) {
  const { setUserLocation } = useCityLocation()
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

  const nearbyCount = nearbyVenues.length
  // Closest N for the inline map; all nearby go to the full-screen modal
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
          <p className="text-white/70 text-sm mb-2 flex items-center justify-center gap-1.5">
            <span>📍</span>
            {caption}
          </p>
          {/* Inline map — only closest pins so the view is tight and clean */}
          <div
            className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl"
            style={{ height: 280 }}
          >
            <InlineMap venues={closestVenues} userLocation={userLocation} compact />

            {/* Expand button — floats over the map */}
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
