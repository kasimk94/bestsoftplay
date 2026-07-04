'use client'

import { useState } from 'react'

interface VenuePhotoProps {
  directUrls?: (string | null | undefined)[]
  photoReference?: string | null
  name: string
  fallbackColor: string
  className?: string
}

function FallbackPlaceholder({ name, color }: { name: string; color: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 select-none"
      style={{ backgroundColor: color }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-inner"
        style={{ backgroundColor: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.25)' }}
      >
        <span className="text-2xl font-black text-white leading-none">{initial}</span>
      </div>
      <span className="text-white/70 text-[11px] font-semibold text-center px-4 line-clamp-2 leading-snug max-w-[90%]">
        {name}
      </span>
    </div>
  )
}

export default function VenuePhoto({
  directUrls = [],
  photoReference,
  name,
  fallbackColor,
  className = '',
}: VenuePhotoProps) {
  const validUrls = directUrls.filter((u): u is string => Boolean(u))
  const proxyUrl = photoReference
    ? `/api/place-photo?ref=${encodeURIComponent(photoReference)}&w=800`
    : null

  type Stage = number | 'proxy' | 'failed'
  const initialStage: Stage = validUrls.length > 0 ? 0 : proxyUrl ? 'proxy' : 'failed'
  const [stage, setStage] = useState<Stage>(initialStage)

  const handleError = () => {
    setStage((prev) => {
      if (typeof prev === 'number') {
        const next = prev + 1
        if (next < validUrls.length) return next
        return proxyUrl ? 'proxy' : 'failed'
      }
      return 'failed'
    })
  }

  if (stage === 'failed') {
    return <FallbackPlaceholder name={name} color={fallbackColor} />
  }

  const src = stage === 'proxy' ? proxyUrl! : validUrls[stage as number]

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
      onError={handleError}
    />
  )
}
