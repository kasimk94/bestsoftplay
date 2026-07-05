'use client'

import { useState } from 'react'

interface VenueGalleryProps {
  photoRefs: string[]
  name: string
  fallbackColor: string
}

function photoSrc(ref: string) {
  return `/api/place-photo?ref=${encodeURIComponent(ref)}&w=1200`
}

function thumbSrc(ref: string) {
  return `/api/place-photo?ref=${encodeURIComponent(ref)}&w=200`
}

export default function VenueGallery({ photoRefs, name, fallbackColor }: VenueGalleryProps) {
  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState<Set<number>>(new Set())

  const usable = photoRefs.filter((_, i) => !failed.has(i))
  const activeRef = photoRefs[active] && !failed.has(active) ? photoRefs[active] : usable.length > 0 ? photoRefs[photoRefs.indexOf(usable[0])] : null

  const markFailed = (i: number) => {
    setFailed((prev) => new Set(prev).add(i))
    if (i === active) {
      const next = photoRefs.findIndex((_, idx) => idx !== i && !failed.has(idx))
      if (next !== -1) setActive(next)
    }
  }

  if (photoRefs.length === 0 || !activeRef) {
    return (
      <div className="h-[340px] sm:h-[440px] flex items-center justify-center" style={{ backgroundColor: fallbackColor }}>
        <span className="text-white/70 text-lg font-semibold">{name}</span>
      </div>
    )
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[340px] sm:h-[440px] bg-gray-200 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={active}
          src={photoSrc(activeRef)}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => markFailed(active)}
        />
        {photoRefs.length > 1 && (
          <span className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            📷 {photoRefs.length} photo{photoRefs.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {photoRefs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 sm:px-6 lg:px-8 py-3 bg-white scrollbar-thin">
          {photoRefs.map((ref, i) =>
            failed.has(i) ? null : (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === active ? 'border-[#7F77DD]' : 'border-transparent hover:border-gray-200'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbSrc(ref)}
                  alt={`${name} photo ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={() => markFailed(i)}
                />
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
