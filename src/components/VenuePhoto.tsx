'use client'

import { useState } from 'react'

interface VenuePhotoProps {
  photoReference: string
  name: string
  fallbackColor: string
  className?: string
}

export default function VenuePhoto({ photoReference, name, fallbackColor, className = '' }: VenuePhotoProps) {
  const [failed, setFailed] = useState(false)
  const src = `/api/place-photo?ref=${encodeURIComponent(photoReference)}&w=800`

  if (failed) {
    return <div className={`absolute inset-0 ${className}`} style={{ backgroundColor: fallbackColor }} />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  )
}
