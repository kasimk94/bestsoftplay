import Link from 'next/link'

interface VenueLink {
  name: string
  href: string
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface LinkedGuideContentProps {
  content: string
  venues: VenueLink[]
}

// Renders guide prose as paragraphs, turning the first mention of each venue's
// exact name into a link to its venue page. Matching against live venue names
// (rather than storing raw HTML/markdown links in the DB) means a venue that's
// later renamed or removed just stops being linked instead of breaking a stored
// href — see the RPCA Soft Play deletion, which is exactly the failure mode
// this avoids.
export default function LinkedGuideContent({ content, venues }: LinkedGuideContentProps) {
  // Longest name first so e.g. "Little Tinkers Birmingham" isn't pre-empted by
  // a shorter, unrelated partial match.
  const sorted = [...venues].sort((a, b) => b.name.length - a.name.length)
  const pattern = sorted.length > 0 ? new RegExp(`(${sorted.map((v) => escapeRegExp(v.name)).join('|')})`, 'g') : null
  const linkedAlready = new Set<string>()

  return (
    <>
      {content.split('\n\n').map((para, i) => {
        if (!pattern) {
          return (
            <p key={i} className="text-gray-700 leading-relaxed mb-5">
              {para}
            </p>
          )
        }

        const parts = para.split(pattern)
        return (
          <p key={i} className="text-gray-700 leading-relaxed mb-5">
            {parts.map((part, j) => {
              const venue = sorted.find((v) => v.name === part)
              if (venue && !linkedAlready.has(venue.name)) {
                linkedAlready.add(venue.name)
                return (
                  <Link key={j} href={venue.href} className="text-[#7F77DD] font-semibold hover:underline">
                    {part}
                  </Link>
                )
              }
              return <span key={j}>{part}</span>
            })}
          </p>
        )
      })}
    </>
  )
}
