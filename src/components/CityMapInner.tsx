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

type Bbox = { minLat: number; maxLat: number; minLng: number; maxLng: number }

const CITY_VIEW: Record<string, { center: [number, number]; zoom: number }> = {
  london:     { center: [51.505, -0.09],  zoom: 10 },
  birmingham: { center: [52.48,  -1.9],   zoom: 11 },
  manchester: { center: [53.48,  -2.24],  zoom: 11 },
}

// Per-city bounding boxes — only venues physically inside these bounds are
// rendered as pins or used in the fitBounds calculation. This prevents
// mismatched Google Places coordinates (foreign branches, data errors) from
// pulling the map view out to show all of England or beyond.
const CITY_BOUNDS: Record<string, Bbox> = {
  london:     { minLat: 51.2,  maxLat: 51.7,  minLng: -0.6,  maxLng: 0.4  },
  // Wide enough to include Wolverhampton, Dudley, Sandwell, Walsall on the west,
  // but excludes Coventry (lng > -1.70) to the east.
  birmingham: { minLat: 52.35, maxLat: 52.75, minLng: -2.3,  maxLng: -1.70 },
  manchester: { minLat: 53.35, maxLat: 53.65, minLng: -2.5,  maxLng: -1.9  },
}
const FALLBACK_BBOX: Bbox = { minLat: 49.5, maxLat: 61.0, minLng: -8.5, maxLng: 2.0 }

function inBbox(lat: number, lng: number, bbox: Bbox) {
  return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng
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
  const bbox = CITY_BOUNDS[citySlug] ?? FALLBACK_BBOX
  const mapped = useMemo(
    () => venues.filter((v) => v.lat != null && v.lng != null && inBbox(v.lat!, v.lng!, bbox)),
    [venues, bbox]
  )

  const view = CITY_VIEW[citySlug] ?? { center: [52.4, -1.5] as [number, number], zoom: 10 }

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
        center={view.center}
        zoom={view.zoom}
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
