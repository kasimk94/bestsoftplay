'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import VenuePhoto from './VenuePhoto'

type Venue = {
  id: string
  name: string
  slug: string
  address: string
  lat: number | null
  lng: number | null
  googleRating: number | null
  googleReviewCount: number | null
  photoUrl: string | null
  photoUrl2: string | null
  photoUrl3: string | null
  photoReference: string | null
  features: string[]
  isFeatured: boolean
  isNew: boolean
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

const CARD_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

export default function NearestVenues({ venues }: { venues: Venue[]; citySlug: string }) {
  const [nearest, setNearest] = useState<(Venue & { distance: number })[] | null>(null)
  const [status, setStatus] = useState<'loading' | 'done' | 'hidden'>('loading')

  useEffect(() => {
    if (!navigator.geolocation) { setStatus('hidden'); return }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const results = venues
          .filter((v) => v.lat != null && v.lng != null)
          .map((v) => ({ ...v, distance: haversine(latitude, longitude, v.lat!, v.lng!) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 4)

        if (results.length === 0) { setStatus('hidden'); return }
        setNearest(results)
        setStatus('done')
      },
      () => setStatus('hidden'),
      { timeout: 8000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Loading: slim strip so the page doesn't jump when results appear
  if (status === 'loading') {
    return (
      <div className="px-4 pt-6 pb-2" style={{ background: '#F3F1FF' }}>
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-gray-400">
          <div className="w-3.5 h-3.5 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          Finding soft plays near you…
        </div>
      </div>
    )
  }

  if (status === 'hidden' || !nearest) return null

  return (
    <section className="py-14 px-4" style={{ background: '#F3F1FF' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Closest to you</h2>
          <span className="text-2xl">📍</span>
        </div>
        <p className="text-gray-500 mb-8">Soft plays nearest to your current location</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {nearest.map((venue, i) => {
            const href = `/${venue.city.slug}/${venue.area.slug}/${venue.slug}`
            const color = CARD_COLORS[i % CARD_COLORS.length]
            return (
              <Link
                key={venue.id}
                href={href}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 block"
              >
                <div className="relative h-[200px] overflow-hidden" style={{ backgroundColor: color }}>
                  <VenuePhoto
                    directUrls={[venue.photoUrl, venue.photoUrl2, venue.photoUrl3]}
                    photoReference={venue.photoReference}
                    name={venue.name}
                    fallbackColor={color}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-2.5 py-1.5 rounded-full shadow-sm">
                    {venue.distance < 0.1 ? '< 0.1 mi' : `${venue.distance.toFixed(1)} mi`}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 z-10">
                    <h3 className="font-bold text-white text-base leading-tight line-clamp-2">{venue.name}</h3>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1.5 line-clamp-1">{venue.area.name}</p>
                  {venue.googleRating ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 text-sm">★</span>
                      <span className="text-sm font-bold text-gray-900">{venue.googleRating.toFixed(1)}</span>
                      {venue.googleReviewCount && (
                        <span className="text-xs text-gray-400">({venue.googleReviewCount.toLocaleString()})</span>
                      )}
                    </div>
                  ) : (
                    <div className="h-5" />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
