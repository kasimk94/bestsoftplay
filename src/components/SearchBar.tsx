'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i
const POSTCODE_PARTIAL_RE = /^[A-Z]{1,2}[0-9]/i

type Props = {
  /** City-page mode: called with geolocation result instead of navigating */
  onLocation?: (pos: GeolocationPosition) => void
  /** City-page mode: called with geocoded postcode instead of navigating to /search */
  onPostcodeSearch?: (postcode: string, lat: number, lng: number) => void
}

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const clean = postcode.replace(/\s+/g, '').toUpperCase()
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 200 || !data.result) return null
    return { lat: data.result.latitude, lng: data.result.longitude }
  } catch {
    return null
  }
}

async function fetchSuggestions(partial: string): Promise<string[]> {
  try {
    const clean = partial.replace(/\s+/g, '').toUpperCase()
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}/autocomplete`)
    if (!res.ok) return []
    const data = await res.json()
    if (data.status !== 200 || !Array.isArray(data.result)) return []
    return data.result.slice(0, 5)
  } catch {
    return []
  }
}

export default function SearchBar({ onLocation, onPostcodeSearch }: Props) {
  const [query, setQuery] = useState('')
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Autocomplete: only when on a city page (onPostcodeSearch provided) and input looks postcode-like
  const runAutocomplete = useCallback(async (q: string) => {
    if (!onPostcodeSearch || q.length < 2 || !POSTCODE_PARTIAL_RE.test(q)) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const results = await fetchSuggestions(q)
    setSuggestions(results)
    setShowSuggestions(results.length > 0)
    setActiveIdx(-1)
  }, [onPostcodeSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setSearchStatus('idle')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runAutocomplete(val), 300)
  }

  const selectSuggestion = (s: string) => {
    setQuery(s)
    setSuggestions([])
    setShowSuggestions(false)
    setActiveIdx(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || !suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIdx])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setShowSuggestions(false)

    // City-page inline postcode search
    if (onPostcodeSearch && UK_POSTCODE_RE.test(q)) {
      setSearchStatus('loading')
      const geo = await geocodePostcode(q)
      setSearchStatus('idle')
      if (geo) {
        onPostcodeSearch(q, geo.lat, geo.lng)
      } else {
        setSearchStatus('error')
      }
      return
    }

    // Fallback: navigate to /search page (homepage or non-postcode query)
    router.push(`/search?q=${encodeURIComponent(q)}`)
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
        {/* Input + autocomplete */}
        <div className="flex-1 relative" ref={containerRef}>
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Postcode or venue name..."
            autoComplete="off"
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-white text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#7F77DD] focus:border-transparent shadow-[0_4px_24px_rgba(127,119,221,0.18)]"
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <ul
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  role="option"
                  aria-selected={activeIdx === i}
                  onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s) }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm font-medium transition-colors ${
                    activeIdx === i ? 'bg-[#EDE9FF] text-[#7F77DD]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base select-none">📮</span>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLocation}
            disabled={locStatus === 'loading'}
            className="flex items-center gap-2 px-4 py-4 rounded-2xl border border-gray-100 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-[0_4px_24px_rgba(127,119,221,0.18)] whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-[#7F77DD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {locStatus === 'loading' ? 'Locating…' : 'Use my location'}
          </button>
          <button
            type="submit"
            disabled={searchStatus === 'loading'}
            className="px-6 py-4 bg-[#7F77DD] text-white font-semibold rounded-2xl hover:bg-[#6A62C8] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
          >
            {searchStatus === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {locStatus === 'error' && (
        <p className={`text-sm text-center mt-3 ${onLocation ? 'text-white/70' : 'text-red-500'}`}>
          📍 Location access denied — please enable it in your browser settings
        </p>
      )}
      {searchStatus === 'error' && (
        <p className={`text-sm text-center mt-3 ${onPostcodeSearch ? 'text-white/70' : 'text-red-500'}`}>
          📮 Postcode not found — please check and try again
        </p>
      )}
    </form>
  )
}
