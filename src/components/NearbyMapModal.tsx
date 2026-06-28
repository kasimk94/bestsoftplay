'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

export type NearbyVenue = {
  id: string
  name: string
  slug: string
  lat: number
  lng: number
  distance: number
  googleRating: number | null
  googleReviewCount: number | null
  photoUrl: string | null
  photoUrl2: string | null
  photoUrl3: string | null
  photoReference: string | null
  city: { slug: string }
  area: { slug: string; name: string }
}

const NearbyMapContent = dynamic(() => import('./NearbyMapContent'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#EDE9FF]">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">🗺️</div>
        <p className="font-medium text-gray-500">Loading map…</p>
      </div>
    </div>
  ),
})

type Props = {
  isOpen: boolean
  onClose: () => void
  venues: NearbyVenue[]
  userLocation: { lat: number; lng: number }
}

export default function NearbyMapModal({ isOpen, onClose, venues, userLocation }: Props) {
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
      {/* Header */}
      <div className="flex-none h-14 flex items-center justify-between px-4 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-lg select-none">📍</span>
          <span className="font-semibold text-gray-900">
            {venues.length} venue{venues.length !== 1 ? 's' : ''} near you
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline">· Click a pin for details</span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors text-base font-bold"
          aria-label="Close map"
        >
          ✕
        </button>
      </div>

      {/* Map fills remaining height */}
      <div className="flex-1 relative">
        <NearbyMapContent venues={venues} userLocation={userLocation} />
      </div>
    </div>
  )
}
