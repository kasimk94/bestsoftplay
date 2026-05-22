'use client'

import { useState } from 'react'

interface FAQ { q: string; a: string }

interface VenueTabsProps {
  name: string
  description: string | null
  features: string[]
  ageMin: number | null
  ageMax: number | null
  openingHours: { weekdays?: string[] } | null
  address: string
  postcode: string
  phone: string | null
  website: string | null
  lat: number | null
  lng: number | null
  googlePlacesKey: string
  faqs: FAQ[]
}

const TABS = ['About', 'Hours', 'Location', 'FAQ'] as const
type Tab = typeof TABS[number]

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function parseHoursRow(entry: string): { day: string; hours: string } | null {
  const idx = entry.indexOf(': ')
  if (idx === -1) return null
  return { day: entry.slice(0, idx), hours: entry.slice(idx + 2) }
}

function getTodayName(): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
}

export default function VenueTabs({
  name, description, features, ageMin, ageMax,
  openingHours, address, postcode, phone, website,
  lat, lng, googlePlacesKey, faqs,
}: VenueTabsProps) {
  const [active, setActive] = useState<Tab>('About')

  const weekdays = openingHours?.weekdays ?? []
  const today = getTodayName()
  const todayEntry = weekdays.find(h => h.startsWith(today))
  const todayHours = todayEntry ? parseHoursRow(todayEntry)?.hours : null

  const sortedHours = [...weekdays].sort((a, b) => {
    const ai = DAY_ORDER.findIndex(d => a.startsWith(d))
    const bi = DAY_ORDER.findIndex(d => b.startsWith(d))
    return ai - bi
  })

  const ageLabel =
    ageMin !== null && ageMax !== null ? `${ageMin}–${ageMax} years`
    : ageMin !== null ? `${ageMin}+ years`
    : ageMax !== null ? `Up to ${ageMax} years`
    : null

  const mapSrc = lat && lng && googlePlacesKey
    ? `https://www.google.com/maps/embed/v1/place?key=${googlePlacesKey}&q=${lat},${lng}&zoom=15`
    : null

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-8 gap-0">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              active === tab
                ? 'border-[#7F77DD] text-[#7F77DD]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* About */}
      {active === 'About' && (
        <div className="space-y-8">
          {description && (
            <p className="text-gray-700 text-base leading-relaxed">{description}</p>
          )}

          {features.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Features</h3>
              <div className="flex flex-wrap gap-2">
                {features.map(f => (
                  <span key={f} className="inline-flex items-center gap-1.5 bg-[#F4F3FB] text-[#7F77DD] text-sm font-medium px-3 py-1.5 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ageLabel && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Age range</h3>
              <p className="text-gray-700 font-medium">{ageLabel}</p>
            </div>
          )}

          {todayHours && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Today&apos;s hours</h3>
              <p className="text-gray-700 font-medium">{todayHours}</p>
            </div>
          )}
        </div>
      )}

      {/* Hours */}
      {active === 'Hours' && (
        <div>
          {sortedHours.length > 0 ? (
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {sortedHours.map((entry, i) => {
                    const row = parseHoursRow(entry)
                    if (!row) return null
                    const isToday = row.day === today
                    return (
                      <tr
                        key={row.day}
                        className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isToday ? 'font-semibold' : ''}`}
                      >
                        <td className="px-5 py-3 text-gray-900 w-36">
                          {isToday ? <span className="text-[#7F77DD]">{row.day} ←</span> : row.day}
                        </td>
                        <td className="px-5 py-3 text-gray-600">{row.hours}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">Opening hours not available. Check the venue website for up-to-date times.</p>
          )}
        </div>
      )}

      {/* Location */}
      {active === 'Location' && (
        <div className="space-y-6">
          {mapSrc && (
            <div className="rounded-2xl overflow-hidden border border-gray-100 h-64 sm:h-80">
              <iframe
                src={mapSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-gray-900 font-medium">{address}</p>
                {postcode && <p className="text-gray-500 text-sm">{postcode}</p>}
              </div>
            </div>

            {phone && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${phone}`} className="text-[#7F77DD] hover:underline font-medium">{phone}</a>
              </div>
            )}

            {website && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
                <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#7F77DD] hover:underline font-medium truncate">
                  {website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}

            {lat && lng && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 bg-[#7F77DD] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#6A62C8] transition-colors text-sm"
              >
                Get directions
              </a>
            )}
          </div>
        </div>
      )}

      {/* FAQ */}
      {active === 'FAQ' && (
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-2xl border border-gray-100 overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 transition-colors list-none">
                {faq.q}
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
