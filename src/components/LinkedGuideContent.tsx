import Link from 'next/link'
import type { ReactNode } from 'react'

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

// Renders guide content, turning the first mention of each venue's exact name
// into a link to its venue page. Matching against live venue names (rather
// than storing raw HTML/markdown links in the DB) means a venue that's later
// renamed or removed just stops being linked instead of breaking a stored
// href — see the RPCA Soft Play deletion, which is exactly the failure mode
// this avoids.
//
// Content is plain text split on blank lines into blocks. Most guides are
// plain prose (each block a paragraph), but a block can also be:
//   "## Heading text"     -> <h2>
//   "- item\n- item"      -> <ul><li>
// letting list-style guides use headers and bullets while sharing the same
// auto-linking logic as the prose-only guides.
export default function LinkedGuideContent({ content, venues }: LinkedGuideContentProps) {
  // Longest name first so e.g. "Little Tinkers Birmingham" isn't pre-empted by
  // a shorter, unrelated partial match.
  const sorted = [...venues].sort((a, b) => b.name.length - a.name.length)
  const pattern = sorted.length > 0 ? new RegExp(`(${sorted.map((v) => escapeRegExp(v.name)).join('|')})`, 'g') : null
  const linkedAlready = new Set<string>()

  function linkify(text: string, keyPrefix: string): ReactNode {
    if (!pattern) return text
    const parts = text.split(pattern)
    return parts.map((part, j) => {
      const venue = sorted.find((v) => v.name === part)
      if (venue && !linkedAlready.has(venue.name)) {
        linkedAlready.add(venue.name)
        return (
          <Link key={`${keyPrefix}-${j}`} href={venue.href} className="text-[#7F77DD] font-semibold hover:underline">
            {part}
          </Link>
        )
      }
      return <span key={`${keyPrefix}-${j}`}>{part}</span>
    })
  }

  return (
    <>
      {content.split('\n\n').map((block, i) => {
        const trimmed = block.trim()

        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={i} className="text-xl font-extrabold text-gray-900 mt-8 mb-3">
              {linkify(trimmed.slice(3).trim(), `h${i}`)}
            </h2>
          )
        }

        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
        const isList = lines.length > 0 && lines.every((l) => l.startsWith('- '))
        if (isList) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-2 mb-5 text-gray-700">
              {lines.map((line, j) => (
                <li key={j} className="leading-relaxed">
                  {linkify(line.slice(2).trim(), `l${i}-${j}`)}
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p key={i} className="text-gray-700 leading-relaxed mb-5">
            {linkify(block, `p${i}`)}
          </p>
        )
      })}
    </>
  )
}
