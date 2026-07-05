interface VenueAboutProps {
  description: string | null
  features: string[]
}

export default function VenueAbout({ description, features }: VenueAboutProps) {
  if (!description && features.length === 0) return null

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-4">About</h2>

      {description && (
        <p className="text-gray-700 text-lg leading-relaxed mb-6">{description}</p>
      )}

      {features.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">What to expect</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-gray-700">
                <span className="text-[#7F77DD]">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
