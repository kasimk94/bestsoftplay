'use client'

import { useState } from 'react'

interface VenuePhotoProps {
  src: string
  name: string
  fallbackColor: string
  fallbackEmoji: string
  badge: string | null
}

export default function VenuePhoto({ src, name, fallbackColor, fallbackEmoji, badge }: VenuePhotoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="relative h-44 flex items-center justify-center" style={{ backgroundColor: fallbackColor }}>
        {badge && (
          <span className="absolute top-3 left-3 bg-white text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {badge}
          </span>
        )}
        <span className="text-6xl select-none">{fallbackEmoji}</span>
      </div>
    )
  }

  return (
    <div className="relative h-44 overflow-hidden">
      {badge && (
        <span className="absolute top-3 left-3 z-10 bg-white text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
          {badge}
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
