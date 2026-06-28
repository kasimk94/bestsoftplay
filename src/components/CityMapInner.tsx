'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { useMemo, useEffect } from 'react'
import { useCityLocation } from './CityLocationContext'

type Venue = {
  id: string
  name: string
  slug: string
  googleRating: number | null
  lat: number | null
  lng: number | null
  city: { slug: string }
  area: { slug: string; name: string }
}

// Standard venue pin via CDN (avoids webpack asset issues)
const venueIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// "You are here" — blue pulsing dot
const youAreHereIcon = L.divIcon({
  html: `<div style="
    width:18px;height:18px;background:#3B82F6;border-radius:50%;
    border:3px solid white;box-shadow:0 0 0 2px #3B82F6,0 2px 8px rgba(59,130,246,0.5);
  "></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
})

const CITY_CENTERS: Record<string, [number, number]> = {
  london: [51.5074, -0.1278],
  birmingham: [52.4862, -1.8904],
  manchester: [53.4808, -2.2426],
}

function MapController({ userLocation }: { userLocation: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 1.5 })
    }
  }, [userLocation, map])
  return null
}

export default function CityMapInner({ venues, citySlug }: { venues: Venue[]; citySlug: string }) {
  const { userLocation } = useCityLocation()
  const mapped = useMemo(() => venues.filter((v) => v.lat != null && v.lng != null), [venues])

  const center = useMemo<[number, number]>(() => {
    if (mapped.length === 0) return CITY_CENTERS[citySlug] ?? [52.4, -1.5]
    const avgLat = mapped.reduce((s, v) => s + v.lat!, 0) / mapped.length
    const avgLng = mapped.reduce((s, v) => s + v.lng!, 0) / mapped.length
    return [avgLat, avgLng]
  }, [mapped, citySlug])

  if (mapped.length === 0) {
    return (
      <div className="h-[500px] rounded-3xl bg-[#EDE9FF] flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-medium">Map coming soon</p>
          <p className="text-sm mt-1">Venue coordinates are being added</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[500px] rounded-3xl overflow-hidden shadow-lg border border-[#DDD9FF]">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController userLocation={userLocation} />

        {mapped.map((v) => (
          <Marker key={v.id} position={[v.lat!, v.lng!]} icon={venueIcon}>
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-bold text-gray-900 text-sm leading-snug mb-1">{v.name}</p>
                <p className="text-xs text-gray-500 mb-1">{v.area.name}</p>
                {v.googleRating && (
                  <p className="text-xs text-amber-500 font-semibold mb-2">★ {v.googleRating.toFixed(1)}</p>
                )}
                <Link
                  href={`/${v.city.slug}/${v.area.slug}/${v.slug}`}
                  className="text-xs font-bold text-[#7F77DD] hover:underline"
                >
                  View venue →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={youAreHereIcon}>
            <Popup>
              <div className="font-semibold text-sm text-gray-900">📍 You are here</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
