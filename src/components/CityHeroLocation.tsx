'use client'

import { useState } from 'react'
import SearchBar from './SearchBar'
import { useCityLocation } from './CityLocationContext'
import NearbyMapModal, { type NearbyVenue } from './NearbyMapModal'

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
  const [inlineLine, setInlineLine] = useState<string | null>(null)
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
      setInlineLine(`${withDistance.length} venue${withDistance.length !== 1 ? 's' : ''} within ${RADIUS} miles of you`)
    } else {
      const nearest = venues
        .filter((v): v is VenueFull & { lat: number; lng: number } => v.lat != null && v.lng != null)
        .map((v) => haversine(latitude, longitude, v.lat, v.lng))
        .sort((a, b) => a - b)[0]
      setInlineLine(nearest !== undefined ? `Nearest venue is ${nearest.toFixed(1)} miles away` : null)
    }
  }

  const nearbyCount = nearbyVenues.length
  const subtitle =
    nearbyCount > 0
      ? `${nearbyCount} venues near you · ${totalCount} across ${cityName}`
      : `${totalCount} soft play venues to explore`

  return (
    <>
      <p className="text-white/75 text-xl font-semibold mb-10">{subtitle}</p>
      <div className="flex justify-center">
        <SearchBar onLocation={handleLocation} />
      </div>
      {inlineLine && (
        <button
          onClick={() => nearbyVenues.length > 0 && setModalOpen(true)}
          className={`flex items-center justify-center gap-1.5 text-white/70 text-sm mt-4 mx-auto transition-colors ${
            nearbyVenues.length > 0
              ? 'hover:text-white underline decoration-white/30 underline-offset-2 cursor-pointer'
              : 'cursor-default'
          }`}
        >
          <span>📍</span>
          {inlineLine}
          {nearbyVenues.length > 0 && <span className="text-white/50">— view on map ↗</span>}
        </button>
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
