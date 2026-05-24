'use client'

import { useState } from 'react'

interface VenuePhotoProps {
  // Ordered list of direct CDN URLs to try (photoUrl, photoUrl2, photoUrl3)
  directUrls?: (string | null | undefined)[]
  // Proxy fallback using the stored photo_reference — always works even when CDN URLs expire
  photoReference?: string | null
  name: string
  fallbackColor: string
  className?: string
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

  // Stage: index into validUrls, then 'proxy', then 'failed'
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
    return <div className={`absolute inset-0 ${className}`} style={{ backgroundColor: fallbackColor }} />
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
