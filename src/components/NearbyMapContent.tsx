'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { NearbyVenue } from './NearbyMapModal'

const CARD_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

const venueIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const youAreHereIcon = L.divIcon({
  html: `<div style="width:20px;height:20px;background:#3B82F6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.35)"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
})

function PopupPhoto({ venue, color }: { venue: NearbyVenue; color: string }) {
  const firstUrl =
    venue.photoUrl ||
    venue.photoUrl2 ||
    venue.photoUrl3 ||
    (venue.photoReference
      ? `/api/place-photo?ref=${encodeURIComponent(venue.photoReference)}&w=400`
      : null)

  const [src, setSrc] = useState<string | null>(firstUrl)

  if (!src) {
    return (
      <div
        style={{
          height: 80, background: color, borderRadius: 8, marginBottom: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 28 }}>🎪</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={venue.name}
      onError={() => setSrc(null)}
      style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8, display: 'block' }}
    />
  )
}

function FitBounds({
  venues,
  userLocation,
  maxZoom,
  padding,
}: {
  venues: NearbyVenue[]
  userLocation: { lat: number; lng: number }
  maxZoom: number
  padding: [number, number]
}) {
  const map = useMap()
  useEffect(() => {
    const points: [number, number][] = [
      [userLocation.lat, userLocation.lng],
      ...venues.map((v) => [v.lat, v.lng] as [number, number]),
    ]
    if (points.length > 1) {
      map.fitBounds(points, { padding, maxZoom })
    } else {
      map.setView([userLocation.lat, userLocation.lng], maxZoom)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function NearbyMapContent({
  venues,
  userLocation,
  compact = false,
}: {
  venues: NearbyVenue[]
  userLocation: { lat: number; lng: number }
  compact?: boolean
}) {
  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={!compact}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds
        venues={venues}
        userLocation={userLocation}
        maxZoom={compact ? 15 : 14}
        padding={compact ? [10, 10] : [52, 52]}
      />

      {/* You are here */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={youAreHereIcon} zIndexOffset={1000}>
        <Popup>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', padding: '2px 0' }}>
            📍 You are here
          </div>
        </Popup>
      </Marker>

      {/* Nearby venue pins */}
      {venues.map((venue, i) => {
        const color = CARD_COLORS[i % CARD_COLORS.length]
        const distLabel =
          venue.distance < 0.1 ? '< 0.1 mi' : `${venue.distance.toFixed(1)} mi away`

        return (
          <Marker key={venue.id} position={[venue.lat, venue.lng]} icon={venueIcon}>
            <Popup minWidth={200} maxWidth={220}>
              <div style={{ width: 200 }}>
                <PopupPhoto venue={venue} color={color} />
                <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 2px', lineHeight: 1.3, color: '#111827' }}>
                  {venue.name}
                </p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 6px' }}>{venue.area.name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  {venue.googleRating ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}>
                      ★ {venue.googleRating.toFixed(1)}
                      {venue.googleReviewCount ? (
                        <span style={{ color: '#9CA3AF', fontWeight: 400 }}>
                          {' '}({venue.googleReviewCount.toLocaleString()})
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span style={{ fontSize: 11, color: '#7F77DD', fontWeight: 600 }}>📍 {distLabel}</span>
                </div>
                <Link
                  href={`/${venue.city.slug}/${venue.area.slug}/${venue.slug}`}
                  style={{
                    display: 'block', textAlign: 'center', padding: '7px 12px',
                    background: '#7F77DD', color: '#fff', borderRadius: 8,
                    fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  View venue →
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
