import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CityHeroLocation from '@/components/CityHeroLocation'
import CityPageInteractive from '@/components/CityPageInteractive'
import CityMap from '@/components/CityMap'
import CityFAQ from '@/components/CityFAQ'
import { CityLocationProvider } from '@/components/CityLocationContext'
import { prisma } from '@/lib/prisma'
import { excludeNonSoftPlay } from '@/lib/venueFilters'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ── City visual config ────────────────────────────────────────────────────────

const CITY_CONFIG: Record<string, { gradient: string; scatter: string[] }> = {
  london: {
    gradient: 'linear-gradient(160deg, #2D1B69 0%, #7C3AED 45%, #A855F7 72%, #EC4899 100%)',
    scatter: ['🎡', '⭐', '✨', '💫', '🌟', '🎪', '⭐', '✨'],
  },
  birmingham: {
    gradient: 'linear-gradient(160deg, #7C2D12 0%, #EA580C 45%, #F97316 72%, #FDE047 100%)',
    scatter: ['🎠', '🎊', '✨', '⭐', '🎉', '🌟', '💛', '✨'],
  },
  manchester: {
    gradient: 'linear-gradient(160deg, #064E3B 0%, #059669 45%, #14B8A6 72%, #22D3EE 100%)',
    scatter: ['🌈', '🌟', '✨', '⭐', '💫', '🎪', '🌟', '✨'],
  },
}

// Emoji decoration per area slug
const AREA_EMOJIS: Record<string, string> = {
  'south-london': '🌉', 'north-london': '🏙️', 'east-london': '🗼', 'west-london': '🎡',
  'central-london': '🎭', 'city-centre': '🏛️', 'solihull': '🌿', 'sutton-coldfield': '🌲',
  'wolverhampton': '🏭', 'dudley': '⚙️', 'walsall': '🔵', 'sandwell': '🟠',
  'salford': '🎭', 'trafford': '⚽', 'stockport': '🌧️', 'bolton': '🌼',
  'wigan': '🍺', 'oldham': '🏔️', 'rochdale': '🌾', 'bury': '🟤', 'altrincham': '🍃',
}

// ── City-specific FAQs ────────────────────────────────────────────────────────

const FAQ_DATA: Record<string, { q: string; a: string }[]> = {
  london: [
    { q: 'What is the best soft play in London?', a: 'Based on Google ratings and parent reviews, the highest-rated soft play venues in London include Kidspace Adventure Park in Croydon, Gambado Chelsea, and Inflata Nation Wembley. These venues consistently score above 4.5 stars and offer excellent facilities for all ages.' },
    { q: 'How much does soft play cost in London?', a: 'Soft play prices in London typically range from £5 to £15 per child, with adults usually free or paying a small entry fee. Premium venues like Gambado charge up to £15 at peak times, while local soft plays may offer sessions for under £8. Many venues offer discounted off-peak sessions on weekday mornings.' },
    { q: 'Which soft plays in London are good for toddlers?', a: 'Many London venues have dedicated toddler zones designed for under-2s and 2–5 year olds, with softer surfaces, smaller equipment, and quieter areas away from older children. Look for venues tagged "Under 2s" or "Toddler friendly" in our listings above.' },
    { q: 'Are there soft plays in London open on Sundays?', a: 'Yes, the majority of soft play centres in London are open on Sundays, often with the same hours as Saturdays. Sundays can be busy, so booking in advance is recommended for popular venues. Check individual venue pages for exact opening times as they can vary seasonally.' },
    { q: 'Which soft plays in London have cafés?', a: 'Many of London\'s larger soft play venues include onsite cafés serving hot drinks, snacks, and light meals for parents. Venues like Kidspace, Gambado, and most major indoor play centres have good café facilities. Use the "Café" filter in the Browse by type section above to find them quickly.' },
  ],
  birmingham: [
    { q: 'What is the best soft play in Birmingham?', a: 'Birmingham has excellent soft play options including venues in Solihull, Sutton Coldfield, and the City Centre. Our highest-rated venues consistently score above 4.5 stars on Google and offer great facilities for children of all ages, from toddler zones to climbing frames for older kids.' },
    { q: 'How much does soft play cost in Birmingham?', a: 'Soft play prices in Birmingham are generally slightly lower than London, typically ranging from £4 to £12 per child. Many venues offer family deals and off-peak discounts during school hours on weekdays. Adults are usually free or pay a small entry fee.' },
    { q: 'Which soft plays in Birmingham are good for toddlers?', a: 'Birmingham has several venues with excellent toddler facilities, including dedicated under-5s zones with age-appropriate equipment. Venues in Solihull and Sutton Coldfield tend to be particularly well-equipped for younger children, with sensory play areas and soft surfaces.' },
    { q: 'Are there soft plays in Birmingham open on Sundays?', a: 'Yes, most soft play centres in Birmingham are open on Sundays with similar hours to weekends. Sunday sessions can fill up quickly at popular venues, especially during school holidays. We recommend checking and booking online in advance.' },
    { q: 'Which soft plays in Birmingham have free parking?', a: 'Most soft play venues in Birmingham and the wider West Midlands area offer free on-site parking, making them easy to reach by car. Venues in out-of-town retail parks like Merry Hill and Resorts World typically have large free car parks. Use the "Free parking" filter on the homepage to find venues.' },
  ],
  manchester: [
    { q: 'What is the best soft play in Manchester?', a: 'Manchester has a fantastic range of soft play venues, with highly-rated centres across the city including Stockport, Bolton, and Trafford. Our top-rated venues consistently score 4.5+ stars on Google and are praised by parents for cleanliness, facilities, and value for money.' },
    { q: 'How much does soft play cost in Manchester?', a: 'Soft play prices in Manchester typically range from £4 to £12 per child, making it great value compared to London. Many venues offer family bundles, sibling discounts, and cheaper off-peak sessions during school hours on weekdays.' },
    { q: 'Which soft plays in Manchester are good for rainy days?', a: 'All indoor soft play venues are perfect for rainy days, and Manchester has plenty of great options! Venues across Stockport, Trafford, and Bolton offer large indoor facilities ideal when the weather isn\'t cooperating. Check our listings for venues with cafés to make a full day of it.' },
    { q: 'Are there soft plays in Manchester open on Sundays?', a: 'Yes, most Manchester soft play venues are open seven days a week including Sundays. Sunday sessions at popular venues can get busy, particularly during school holidays, so we recommend booking ahead where possible.' },
    { q: 'Which soft plays in Manchester have party rooms?', a: 'Many Manchester soft play venues offer dedicated party room hire for birthday celebrations, including room hire, food packages, and dedicated play session time. Look for venues tagged "Party rooms" in our search filters, and contact venues directly for full party package pricing and availability.' },
  ],
}

// ── Data fetching ─────────────────────────────────────────────────────────────

interface Props {
  params: { city: string }
}

async function getCityData(slug: string) {
  const city = await prisma.city.findUnique({
    where: { slug },
    include: {
      areas: {
        include: { _count: { select: { venues: true } } },
        orderBy: { name: 'asc' },
      },
    },
  })
  if (!city) return null

  const venues = await prisma.venue.findMany({
    where: { cityId: city.id, AND: excludeNonSoftPlay() },
    select: {
      id: true, name: true, slug: true, address: true,
      lat: true, lng: true,
      googleRating: true, googleReviewCount: true,
      photoUrl: true, photoUrl2: true, photoUrl3: true, photoReference: true,
      features: true, isFeatured: true, isNew: true, createdAt: true,
      city: { select: { slug: true } },
      area: { select: { slug: true, name: true } },
    },
    orderBy: [{ isFeatured: 'desc' }, { googleRating: 'desc' }],
  })

  return { city, venues }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCityData(params.city)
  if (!data) return {}
  const { city, venues } = data
  const title = `Best Soft Play in ${city.name} – ${venues.length} Venues`
  const description = `Browse ${venues.length} soft play venues in ${city.name}. Find the best indoor play centres for your children with real Google ratings, parent reviews, age filters, and a live map.`
  return {
    title, description,
    openGraph: { title, description },
    alternates: { canonical: `https://bestsoftplay.co.uk/${city.slug}` },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CityPage({ params }: Props) {
  const data = await getCityData(params.city)
  if (!data) notFound()
  const { city, venues } = data

  const config = CITY_CONFIG[city.slug] ?? CITY_CONFIG.london
  const faqData = FAQ_DATA[city.slug] ?? FAQ_DATA.london

  // Serialise for client components (Dates → strings)
  const serialized = venues.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }))

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://bestsoftplay.co.uk' },
      { '@type': 'ListItem', position: 2, name: city.name, item: `https://bestsoftplay.co.uk/${city.slug}` },
    ],
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />

      <CityLocationProvider>

      {/* ── 1. HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: config.gradient, minHeight: '500px' }}
      >
        {/* Scattered emoji */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {config.scatter.map((emoji, i) => (
            <span
              key={i}
              className="absolute text-white/20"
              style={{
                fontSize: `${[2.4, 1.6, 2.8, 1.4, 2.2, 1.8, 2.4, 1.6][i % 8]}rem`,
                top: `${[8, 28, 5, 52, 18, 65, 38, 80][i % 8]}%`,
                left: i % 2 === 0 ? `${[3, 9, 16, 4][Math.floor(i / 2) % 4]}%` : undefined,
                right: i % 2 === 1 ? `${[4, 8, 13, 6][Math.floor(i / 2) % 4]}%` : undefined,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* Bottom fade into page background */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#F3F1FF] to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-14 pb-28 text-center">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-sm text-white/60 mb-8">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span>/</span>
            <span className="text-white font-medium">{city.name}</span>
          </nav>

          <div className="text-7xl sm:text-8xl mb-4 select-none">{city.emoji}</div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none mb-4 drop-shadow-xl">
            {city.name}
          </h1>
          <CityHeroLocation venues={serialized} totalCount={venues.length} cityName={city.name} />
        </div>
      </section>

      {/* ── 3 + 4 + 7. AGE / CATEGORY FILTERS + VENUE GRID ─────────────────── */}
      <CityPageInteractive
        venues={serialized}
        city={{ slug: city.slug, name: city.name, colour: city.colour }}
      />

      {/* ── 5. BROWSE BY AREA ────────────────────────────────────────────────── */}
      {city.areas.length > 0 && (
        <section className="py-14 px-4 relative overflow-hidden" style={{ background: '#EBE8FF' }}>
          {/* Sparkles */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            <span className="absolute top-5 left-[4%] text-xl opacity-[0.12]">✦</span>
            <span className="absolute top-12 right-[6%] text-2xl opacity-[0.10]">✶</span>
            <span className="absolute bottom-6 left-[10%] text-lg opacity-[0.10]">✨</span>
            <span className="absolute bottom-8 right-[4%] text-xl opacity-[0.12]">✦</span>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Browse by area</h2>
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="text-gray-500 mb-8">Explore soft plays in a specific neighbourhood</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {city.areas.map((area) => (
                <Link
                  key={area.id}
                  href={`/${city.slug}/${area.slug}`}
                  className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.03] text-center"
                >
                  <div className="text-3xl mb-2 select-none">
                    {AREA_EMOJIS[area.slug] ?? '📍'}
                  </div>
                  <div className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#7F77DD] transition-colors">
                    {area.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {area._count.venues} venue{area._count.venues !== 1 ? 's' : ''}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. MAP ───────────────────────────────────────────────────────────── */}
      <section className="py-14 px-4 relative" style={{ background: '#F3F1FF' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Find venues on the map</h2>
            <span className="text-2xl">📍</span>
          </div>
          <p className="text-gray-500 mb-6">Click any pin to see venue details and get directions</p>
          <CityMap venues={serialized} citySlug={city.slug} />
        </div>
      </section>

      </CityLocationProvider>

      {/* ── 8. FAQ ───────────────────────────────────────────────────────────── */}
      <CityFAQ cityName={city.name} faqs={faqData} />

      <Footer />
    </>
  )
}
