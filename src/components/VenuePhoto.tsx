'use client'

import { useState } from 'react'

type Stage = 'direct' | 'proxy' | 'failed'

interface VenuePhotoProps {
  directUrl?: string | null
  photoReference?: string | null
  name: string
  fallbackColor: string
  className?: string
}

export default function VenuePhoto({ directUrl, photoReference, name, fallbackColor, className = '' }: VenuePhotoProps) {
  const proxyUrl = photoReference ? `/api/place-photo?ref=${encodeURIComponent(photoReference)}&w=800` : null
  const initialStage: Stage = directUrl ? 'direct' : proxyUrl ? 'proxy' : 'failed'
  const [stage, setStage] = useState<Stage>(initialStage)

  const handleError = () => {
    if (stage === 'direct' && proxyUrl) {
      setStage('proxy')
    } else {
      setStage('failed')
    }
  }

  if (stage === 'failed') {
    return <div className={`absolute inset-0 ${className}`} style={{ backgroundColor: fallbackColor }} />
  }

  const src = stage === 'direct' ? directUrl! : proxyUrl!

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
