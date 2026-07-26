interface KeyInfoCardsProps {
  googleRating: number | null
  ageMin: number | null
  ageMax: number | null
  hasCafe: boolean
  parking: 'Yes' | 'No' | 'Unknown'
  hasPartyRooms: boolean
  areaName: string
}

export function getAgeLabel(ageMin: number | null, ageMax: number | null): string | null {
  if (ageMin !== null && ageMax !== null) return `${ageMin}-${ageMax} years`
  if (ageMin !== null) return `${ageMin}+ years`
  if (ageMax !== null) return `Up to ${ageMax} years`
  return null
}

interface CardSpec {
  emoji: string
  label: string
  value: string
  bg: string
  fg: string
}

function Card({ emoji, label, value, bg, fg }: CardSpec) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-2.5 rounded-2xl px-4 py-3"
      style={{ backgroundColor: bg }}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: fg, opacity: 0.75 }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: fg }}>{value}</p>
      </div>
    </div>
  )
}

export default function KeyInfoCards({
  googleRating, ageMin, ageMax, hasCafe, parking, hasPartyRooms, areaName,
}: KeyInfoCardsProps) {
  const ageLabel = getAgeLabel(ageMin, ageMax) ?? 'All ages'

  const cards: CardSpec[] = []

  if (googleRating !== null) {
    cards.push({ emoji: '⭐', label: 'Rating', value: `${googleRating.toFixed(1)}/5`, bg: '#FEF3C7', fg: '#92400E' })
  }
  cards.push({ emoji: '👶', label: 'Age range', value: ageLabel, bg: '#F4F3FB', fg: '#5F56C8' })
  cards.push({ emoji: '☕', label: 'Café', value: hasCafe ? 'Yes' : 'No', bg: '#FBEAE0', fg: '#9A4A24' })
  cards.push({ emoji: '🅿️', label: 'Parking', value: parking, bg: '#E0F2FE', fg: '#0369A1' })
  if (hasPartyRooms) {
    cards.push({ emoji: '🎉', label: 'Party rooms', value: 'Yes', bg: '#FCE7F3', fg: '#9D174D' })
  }
  cards.push({ emoji: '📍', label: 'Area', value: areaName, bg: '#E8F7F3', fg: '#16785A' })

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 mb-8 -mx-1 px-1">
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  )
}
