interface StickyMobileCTAProps {
  website: string | null
  lat: number | null
  lng: number | null
}

export default function StickyMobileCTA({ website, lat, lng }: StickyMobileCTAProps) {
  const href = website || (lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null)
  if (!href) return null
  const label = website ? 'Visit website' : 'Get directions'

  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#7F77DD] text-white font-bold px-5 py-3 rounded-xl text-sm"
      >
        {label} →
      </a>
    </div>
  )
}
