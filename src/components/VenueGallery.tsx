'use client'

import { useEffect, useRef, useState } from 'react'

interface VenueGalleryProps {
  photoRefs: string[]
  name: string
  fallbackColor: string
}

function photoSrc(ref: string) {
  return `/api/place-photo?ref=${encodeURIComponent(ref)}&w=1200`
}

const AUTO_ADVANCE_MS = 4000
const SWIPE_THRESHOLD = 50

export default function VenueGallery({ photoRefs, name, fallbackColor }: VenueGalleryProps) {
  const [refs, setRefs] = useState(photoRefs)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const total = refs.length

  const goTo = (i: number) => setIndex(((i % total) + total) % total)
  const next = () => goTo(index + 1)
  const prev = () => goTo(index - 1)

  const handleImgError = (failedIndex: number) => {
    setRefs((prevRefs) => prevRefs.filter((_, i) => i !== failedIndex))
    setIndex((i) => (i > 0 ? i - 1 : 0))
  }

  useEffect(() => {
    if (total <= 1 || paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % total), AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [total, paused, index])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > SWIPE_THRESHOLD) prev()
    else if (delta < -SWIPE_THRESHOLD) next()
    touchStartX.current = null
  }

  if (total === 0) {
    return (
      <div className="h-[340px] sm:h-[440px] flex items-center justify-center" style={{ backgroundColor: fallbackColor }}>
        <span className="text-white/70 text-lg font-semibold">{name}</span>
      </div>
    )
  }

  return (
    <div
      className="relative h-[340px] sm:h-[440px] bg-gray-200 overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {refs.map((ref, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={ref}
          src={photoSrc(ref)}
          alt={`${name} photo ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          onError={() => handleImgError(i)}
        />
      ))}

      {total > 1 && (
        <span className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
          📷 {index + 1}/{total}
        </span>
      )}

      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-2">
            {refs.map((ref, i) => (
              <button
                key={ref}
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={`rounded-full transition-all ${
                  i === index ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
