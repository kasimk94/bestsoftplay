'use client'

import { useState, useEffect } from 'react'

type VenueLite = { lat: number | null; lng: number | null }

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
  children,
}: {
  venues: VenueLite[]
  totalCount: number
  cityName: string
  children: React.ReactNode
}) {
  const [nearbyCount, setNearbyCount] = useState<number | null>(null)
  const [inlineLine, setInlineLine] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        const distances = venues
          .filter((v): v is { lat: number; lng: number } => v.lat != null && v.lng != null)
          .map((v) => haversine(latitude, longitude, v.lat, v.lng))
          .sort((a, b) => a - b)

        if (distances.length === 0) return

        const nearby = distances.filter((d) => d <= RADIUS).length
        setNearbyCount(nearby)

        if (nearby > 0) {
          setInlineLine(`${nearby} venue${nearby !== 1 ? 's' : ''} within ${RADIUS} miles of you`)
        } else {
          setInlineLine(`Nearest venue is ${distances[0].toFixed(1)} miles away`)
        }
      },
      () => {},
      { timeout: 8000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subtitle =
    nearbyCount !== null && nearbyCount > 0
      ? `${nearbyCount} venues near you · ${totalCount} across ${cityName}`
      : `${totalCount} soft play venues to explore`

  return (
    <>
      <p className="text-white/75 text-xl font-semibold mb-10">{subtitle}</p>
      {children}
      {inlineLine && (
        <p className="flex items-center justify-center gap-1.5 text-white/70 text-sm mt-4">
          <span>📍</span>
          {inlineLine}
        </p>
      )}
    </>
  )
}
