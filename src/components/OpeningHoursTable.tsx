const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function parseHoursRow(entry: string): { day: string; hours: string } | null {
  const idx = entry.indexOf(': ')
  if (idx === -1) return null
  return { day: entry.slice(0, idx), hours: entry.slice(idx + 2) }
}

function ukNow(): { dayName: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date())

  const dayName = parts.find((p) => p.type === 'weekday')?.value ?? DAY_ORDER[0]
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return { dayName, minutes: hour * 60 + minute }
}

function timeToMinutes(h: string, m: string, meridiem: string): number {
  let hours = parseInt(h, 10) % 12
  if (/pm/i.test(meridiem)) hours += 12
  return hours * 60 + parseInt(m, 10)
}

/** Returns true/false if open-status can be determined from the hours text, otherwise null. */
function isOpenNow(hoursText: string, nowMinutes: number): boolean | null {
  if (/closed/i.test(hoursText)) return false
  if (/24 hours/i.test(hoursText)) return true

  const rangeRe = /(\d{1,2}):(\d{2})\s*([AP]M)\s*[–-]\s*(\d{1,2}):(\d{2})\s*([AP]M)/gi
  let match: RegExpExecArray | null
  let foundAny = false
  while ((match = rangeRe.exec(hoursText)) !== null) {
    foundAny = true
    const open = timeToMinutes(match[1], match[2], match[3])
    const close = timeToMinutes(match[4], match[5], match[6])
    if (nowMinutes >= open && nowMinutes < close) return true
  }
  return foundAny ? false : null
}

export default function OpeningHoursTable({ weekdays }: { weekdays: string[] }) {
  if (weekdays.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-4">Opening hours</h2>
        <p className="text-gray-500">Opening hours not available. Check the venue website for up-to-date times.</p>
      </section>
    )
  }

  const { dayName: today, minutes: nowMinutes } = ukNow()

  const sorted = [...weekdays].sort((a, b) => {
    const ai = DAY_ORDER.findIndex((d) => a.startsWith(d))
    const bi = DAY_ORDER.findIndex((d) => b.startsWith(d))
    return ai - bi
  })

  const todayEntry = sorted.find((h) => h.startsWith(today))
  const todayRow = todayEntry ? parseHoursRow(todayEntry) : null
  const openNow = todayRow ? isOpenNow(todayRow.hours, nowMinutes) : null

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-4">Opening hours</h2>

      {todayRow && (
        <div className="flex items-center gap-2 mb-4">
          {openNow !== null && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                openNow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${openNow ? 'bg-green-500' : 'bg-red-500'}`} />
              {openNow ? 'Open now' : 'Closed now'}
            </span>
          )}
          <span className="text-sm text-gray-500">Today: {todayRow.hours}</span>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {sorted.map((entry, i) => {
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
    </section>
  )
}
