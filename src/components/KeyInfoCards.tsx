interface KeyInfoCardsProps {
  googleRating: number | null
  ageMin: number | null
  ageMax: number | null
  hasCafe: boolean
  hasParking: boolean
  hasPartyRooms: boolean
}

export function getAgeLabel(ageMin: number | null, ageMax: number | null): string | null {
  if (ageMin !== null && ageMax !== null) return `${ageMin}-${ageMax} years`
  if (ageMin !== null) return `${ageMin}+ years`
  if (ageMax !== null) return `Up to ${ageMax} years`
  return null
}

function Card({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
      <span className="text-xl leading-none">{emoji}</span>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function KeyInfoCards({
  googleRating, ageMin, ageMax, hasCafe, hasParking, hasPartyRooms,
}: KeyInfoCardsProps) {
  const ageLabel = getAgeLabel(ageMin, ageMax)

  const cards: { emoji: string; label: string; value: string }[] = []

  if (googleRating !== null) cards.push({ emoji: '⭐', label: 'Rating', value: `${googleRating.toFixed(1)} / 5` })
  if (ageLabel) cards.push({ emoji: '👶', label: 'Age range', value: ageLabel })
  if (hasCafe) cards.push({ emoji: '☕', label: 'Café', value: 'Yes' })
  if (hasParking) cards.push({ emoji: '🅿️', label: 'Parking', value: 'Available' })
  if (hasPartyRooms) cards.push({ emoji: '🎉', label: 'Party rooms', value: 'Yes' })

  if (cards.length === 0) return null

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 mb-8 -mx-1 px-1">
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  )
}
