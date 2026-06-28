'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  /** If provided, called with the position on success instead of navigating to /search */
  onLocation?: (pos: GeolocationPosition) => void
}

export default function SearchBar({ onLocation }: Props) {
  const [query, setQuery] = useState('')
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleLocation = () => {
    if (!('geolocation' in navigator)) return
    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocStatus('idle')
        if (onLocation) {
          onLocation(pos)
        } else {
          router.push(`/search?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
        }
      },
      () => setLocStatus('error'),
      { timeout: 8000 },
    )
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Postcode or venue name..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-white text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent shadow-[0_4px_24px_rgba(127,119,221,0.18)]"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLocation}
            disabled={locStatus === 'loading'}
            className="flex items-center gap-2 px-4 py-4 rounded-2xl border border-gray-100 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-[0_4px_24px_rgba(127,119,221,0.18)] whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-[#7F77DD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {locStatus === 'loading' ? 'Locating…' : 'Use my location'}
          </button>
          <button
            type="submit"
            className="px-6 py-4 bg-[#7F77DD] text-white font-semibold rounded-2xl hover:bg-[#6A62C8] transition-colors shadow-sm whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {locStatus === 'error' && (
        <p className={`text-sm text-center mt-3 ${onLocation ? 'text-white/70' : 'text-red-500'}`}>
          📍 Location access denied — please enable it in your browser settings
        </p>
      )}
    </form>
  )
}
