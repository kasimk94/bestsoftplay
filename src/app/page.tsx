import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SearchBar from '@/components/SearchBar'
import VenueCard from '@/components/VenueCard'
import { prisma } from '@/lib/prisma'
import AnimatedWord from '@/components/AnimatedWord'
import FloatingEmojis from '@/components/FloatingEmojis'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BestSoftPlay – Find the Best Soft Play Venues in the UK',
  description:
    'Discover hundreds of soft play venues across London, Birmingham, and Manchester. Filter by age, features, and ratings to find the perfect indoor play centre for your little ones.',
}

const QUICK_FILTERS = [
  { label: 'Most popular', icon: '🔥' },
  { label: 'Under 2s', icon: '👶' },
  { label: '2–5 years', icon: '🧒' },
  { label: '5–12 years', icon: '🧑' },
  { label: 'Good café', icon: '☕' },
  { label: 'Free parking', icon: '🅿️' },
  { label: 'Party rooms', icon: '🎂' },
  { label: 'Open Sundays', icon: '📅' },
]

const CITY_CARDS = [
  {
    name: 'London',
    slug: 'london',
    colour: '#7F77DD',
    emoji: '🎡',
    gradient: 'linear-gradient(145deg, #4C44C8 0%, #7F77DD 55%, #9B94E8 100%)',
    areas: ['South London', 'North London', 'East London', 'West London'],
  },
  {
    name: 'Birmingham',
    slug: 'birmingham',
    colour: '#D85A30',
    emoji: '🎠',
    gradient: 'linear-gradient(145deg, #B83D18 0%, #D85A30 55%, #E87048 100%)',
    areas: ['City Centre', 'Solihull', 'Sutton Coldfield'],
  },
  {
    name: 'Manchester',
    slug: 'manchester',
    colour: '#1D9E75',
    emoji: '⭐',
    gradient: 'linear-gradient(145deg, #0C7A50 0%, #1D9E75 55%, #25BC8A 100%)',
    areas: ['City Centre', 'Salford', 'Trafford', 'Stockport'],
  },
]

function CityCardBg({ slug }: { slug: string }) {
  if (slug === 'london') {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="london-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="2" fill="white" fillOpacity="0.18"/>
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#london-dots)"/>
        {/* London Eye */}
        <circle cx="348" cy="72" r="58" fill="none" stroke="white" strokeWidth="3" strokeOpacity="0.22"/>
        <circle cx="348" cy="72" r="10" fill="white" fillOpacity="0.22"/>
        <line x1="348" y1="72" x2="348" y2="14" stroke="white" strokeWidth="1.5" strokeOpacity="0.18"/>
        <line x1="348" y1="72" x2="348" y2="130" stroke="white" strokeWidth="1.5" strokeOpacity="0.18"/>
        <line x1="348" y1="72" x2="290" y2="72" stroke="white" strokeWidth="1.5" strokeOpacity="0.18"/>
        <line x1="348" y1="72" x2="406" y2="72" stroke="white" strokeWidth="1.5" strokeOpacity="0.18"/>
        <line x1="348" y1="72" x2="307" y2="31" stroke="white" strokeWidth="1.5" strokeOpacity="0.18"/>
        <line x1="348" y1="72" x2="389" y2="31" stroke="white" strokeWidth="1.5" strokeOpacity="0.18"/>
        <line x1="348" y1="72" x2="307" y2="113" stroke="white" strokeWidth="1.5" strokeOpacity="0.18"/>
        <line x1="348" y1="72" x2="389" y2="113" stroke="white" strokeWidth="1.5" strokeOpacity="0.18"/>
        {/* Gondolas */}
        <rect x="341" y="7" width="14" height="9" rx="3" fill="white" fillOpacity="0.28"/>
        <rect x="341" y="126" width="14" height="9" rx="3" fill="white" fillOpacity="0.28"/>
        <rect x="283" y="67" width="14" height="9" rx="3" fill="white" fillOpacity="0.28"/>
        <rect x="399" y="67" width="14" height="9" rx="3" fill="white" fillOpacity="0.28"/>
        {/* Support leg */}
        <rect x="346" y="130" width="4" height="28" fill="white" fillOpacity="0.18"/>
        <rect x="318" y="156" width="60" height="5" rx="2.5" fill="white" fillOpacity="0.18"/>
        {/* Skyline silhouette */}
        <g fill="white" fillOpacity="0.18">
          <rect x="0" y="225" width="400" height="75"/>
          <rect x="8" y="185" width="20" height="40"/>
          <rect x="12" y="174" width="12" height="13"/>
          <rect x="17" y="156" width="2" height="20"/>
          <rect x="35" y="198" width="42" height="27"/>
          <rect x="82" y="188" width="28" height="37"/>
          <rect x="115" y="194" width="48" height="31"/>
          <rect x="168" y="205" width="28" height="20"/>
          <rect x="202" y="191" width="38" height="34"/>
          <rect x="246" y="196" width="55" height="29"/>
          <rect x="306" y="208" width="38" height="17"/>
          <rect x="348" y="200" width="52" height="25"/>
        </g>
      </svg>
    )
  }
  if (slug === 'birmingham') {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {/* Scattered 4-pointed stars */}
        <g fill="white" fillOpacity="0.2">
          <polygon points="50,28 53,20 56,28 64,31 56,34 53,42 50,34 42,31"/>
          <polygon points="155,18 159,8 163,18 173,22 163,26 159,36 155,26 145,22"/>
          <polygon points="38,130 41,123 44,130 51,133 44,136 41,143 38,136 31,133"/>
          <polygon points="28,75 31,68 34,75 41,78 34,81 31,88 28,81 21,78"/>
          <polygon points="200,12 204,2 208,12 218,16 208,20 204,30 200,20 190,16"/>
          <polygon points="100,55 103,48 106,55 113,58 106,61 103,68 100,61 93,58"/>
        </g>
        {/* Confetti dots */}
        <circle cx="130" cy="45" r="5" fill="white" fillOpacity="0.14"/>
        <circle cx="250" cy="28" r="4" fill="white" fillOpacity="0.12"/>
        <circle cx="30" cy="190" r="5" fill="white" fillOpacity="0.12"/>
        <circle cx="180" cy="60" r="3" fill="white" fillOpacity="0.16"/>
        <circle cx="70" cy="170" r="4" fill="white" fillOpacity="0.12"/>
        {/* Ferris wheel */}
        <circle cx="340" cy="78" r="62" fill="none" stroke="white" strokeWidth="3" strokeOpacity="0.22"/>
        <circle cx="340" cy="78" r="12" fill="white" fillOpacity="0.22"/>
        <line x1="340" y1="78" x2="340" y2="16" stroke="white" strokeWidth="2" strokeOpacity="0.18"/>
        <line x1="340" y1="78" x2="340" y2="140" stroke="white" strokeWidth="2" strokeOpacity="0.18"/>
        <line x1="340" y1="78" x2="278" y2="78" stroke="white" strokeWidth="2" strokeOpacity="0.18"/>
        <line x1="340" y1="78" x2="402" y2="78" stroke="white" strokeWidth="2" strokeOpacity="0.18"/>
        <line x1="340" y1="78" x2="296" y2="34" stroke="white" strokeWidth="2" strokeOpacity="0.18"/>
        <line x1="340" y1="78" x2="384" y2="34" stroke="white" strokeWidth="2" strokeOpacity="0.18"/>
        <line x1="340" y1="78" x2="296" y2="122" stroke="white" strokeWidth="2" strokeOpacity="0.18"/>
        <line x1="340" y1="78" x2="384" y2="122" stroke="white" strokeWidth="2" strokeOpacity="0.18"/>
        {/* Gondola cars */}
        <rect x="333" y="8" width="14" height="10" rx="3" fill="white" fillOpacity="0.3"/>
        <rect x="333" y="133" width="14" height="10" rx="3" fill="white" fillOpacity="0.3"/>
        <rect x="270" y="73" width="14" height="10" rx="3" fill="white" fillOpacity="0.3"/>
        <rect x="396" y="73" width="14" height="10" rx="3" fill="white" fillOpacity="0.3"/>
        <rect x="289" y="27" width="14" height="10" rx="3" fill="white" fillOpacity="0.25"/>
        <rect x="377" y="27" width="14" height="10" rx="3" fill="white" fillOpacity="0.25"/>
        <rect x="289" y="116" width="14" height="10" rx="3" fill="white" fillOpacity="0.25"/>
        <rect x="377" y="116" width="14" height="10" rx="3" fill="white" fillOpacity="0.25"/>
        {/* Support */}
        <rect x="338" y="140" width="4" height="30" fill="white" fillOpacity="0.18"/>
        <rect x="310" y="168" width="60" height="6" rx="3" fill="white" fillOpacity="0.18"/>
      </svg>
    )
  }
  // Manchester
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      {/* Scattered dots background */}
      <defs>
        <pattern id="mcr-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="2.5" fill="white" fillOpacity="0.15"/>
        </pattern>
      </defs>
      <rect width="400" height="300" fill="url(#mcr-dots)"/>
      {/* Sun */}
      <circle cx="342" cy="68" r="44" fill="white" fillOpacity="0.2"/>
      {/* Sun rays */}
      <g stroke="white" strokeOpacity="0.18" strokeLinecap="round">
        <line x1="342" y1="12" x2="342" y2="0" strokeWidth="4"/>
        <line x1="342" y1="124" x2="342" y2="136" strokeWidth="4"/>
        <line x1="286" y1="68" x2="274" y2="68" strokeWidth="4"/>
        <line x1="398" y1="68" x2="410" y2="68" strokeWidth="4"/>
        <line x1="302" y1="28" x2="294" y2="20" strokeWidth="3.5"/>
        <line x1="382" y1="28" x2="390" y2="20" strokeWidth="3.5"/>
        <line x1="302" y1="108" x2="294" y2="116" strokeWidth="3.5"/>
        <line x1="382" y1="108" x2="390" y2="116" strokeWidth="3.5"/>
      </g>
      {/* Stars scattered around */}
      <g fill="white" fillOpacity="0.2">
        <polygon points="58,38 61,28 64,38 74,41 64,44 61,54 58,44 48,41"/>
        <polygon points="162,22 166,12 170,22 180,25 170,28 166,38 162,28 152,25"/>
        <polygon points="48,148 51,141 54,148 61,151 54,154 51,161 48,154 41,151"/>
        <polygon points="25,85 28,78 31,85 38,88 31,91 28,98 25,91 18,88"/>
        <polygon points="110,42 113,35 116,42 123,45 116,48 113,55 110,48 103,45"/>
      </g>
      {/* Wave / undulation at bottom */}
      <path d="M0,252 Q50,238 100,252 T200,252 T300,252 T400,252 L400,300 L0,300 Z" fill="white" fillOpacity="0.14"/>
      <path d="M0,268 Q50,254 100,268 T200,268 T300,268 T400,268 L400,300 L0,300 Z" fill="white" fillOpacity="0.1"/>
    </svg>
  )
}

const GUIDE_CARDS = [
  {
    icon: '📍',
    bg: '#ede9fe',
    title: 'Best Soft Plays in South London',
    slug: 'best-soft-plays-south-london',
    desc: '18 venues reviewed and ranked',
  },
  {
    icon: '🍼',
    bg: '#ffedd5',
    title: 'Best for Toddlers in London',
    slug: 'best-soft-plays-toddlers-london',
    desc: 'Under 2s welcome – our picks',
  },
  {
    icon: '🏙️',
    bg: '#ccfbf1',
    title: 'Best Soft Plays in Birmingham',
    slug: 'best-soft-plays-birmingham',
    desc: 'Top venues across the city',
  },
  {
    icon: '☕',
    bg: '#fef3c7',
    title: 'Best Soft Plays in Manchester',
    slug: 'best-soft-plays-manchester',
    desc: 'Rain-proof family fun',
  },
]

async function getCityStats() {
  try {
    const cities = await prisma.city.findMany({
      select: {
        slug: true,
        _count: { select: { venues: true } },
      },
    })
    const counts: Record<string, number> = {}
    let total = 0
    for (const c of cities) {
      counts[c.slug] = c._count.venues
      total += c._count.venues
    }
    return { counts, total }
  } catch {
    return { counts: {}, total: 0 }
  }
}

async function getFeaturedVenues() {
  try {
    return await prisma.venue.findMany({
      where: {
        city: { slug: 'london' },
        googleRating: { gte: 4.0 },
        photoReference: { not: null },
      },
      include: { city: true, area: true },
      orderBy: { googleRating: 'desc' },
      take: 4,
    })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [featuredVenues, { counts, total }] = await Promise.all([
    getFeaturedVenues(),
    getCityStats(),
  ])

  const STATS = [
    { value: total > 0 ? `${total}` : '600+', label: 'Venues listed' },
    { value: '★ 4.5', label: 'Avg Google rating' },
    { value: 'Free', label: 'Always free to use' },
  ]

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#F4F3FB] to-white pt-16 pb-12 px-4 overflow-hidden">
        <FloatingEmojis />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-[#E9E8F7] text-[#7F77DD] text-sm font-semibold px-4 py-2 rounded-full mb-6 shadow-sm">
            <span>🇬🇧</span>
            <span>UK&apos;s largest soft play directory</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Find the perfect soft play for your
            <br />
            <AnimatedWord />
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Browse {total > 0 ? `${total}+` : 'hundreds of'} verified soft play venues across the UK with real Google ratings,
            parent reviews, and up-to-date opening times.
          </p>

          <div className="flex justify-center mb-8">
            <SearchBar />
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.label}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-full hover:border-[#7F77DD] hover:text-[#7F77DD] transition-colors shadow-sm"
              >
                <span>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#7F77DD] py-6">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-6 text-center text-white">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="text-sm text-white/80 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by city */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Browse by city</h2>
            <p className="text-gray-500 mt-1">Pick a city to explore venues near you</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CITY_CARDS.map((city) => (
            <Link
              key={city.slug}
              href={`/${city.slug}`}
              className="group relative overflow-hidden rounded-3xl aspect-[4/3] flex flex-col justify-end shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.03]"
              style={{ background: city.gradient }}
            >
              {/* SVG background art */}
              <CityCardBg slug={city.slug} />

              {/* Gradient fade to make text legible */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"/>

              <div className="relative z-10 p-6 pt-0">
                <p className="text-white/80 text-sm font-semibold mb-1 drop-shadow">
                  {counts[city.slug] ?? 0} venues
                </p>
                <h3 className="text-white text-4xl font-black tracking-tight mb-3 drop-shadow-md">
                  {city.name}
                </h3>

                {/* Area tags — white bg, coloured text */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {city.areas.map((area) => (
                    <span
                      key={area}
                      className="bg-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm"
                      style={{ color: city.colour }}
                    >
                      {area}
                    </span>
                  ))}
                </div>

                <div className="inline-flex items-center gap-2 bg-white/25 hover:bg-white/35 backdrop-blur-sm text-white font-bold text-sm px-4 py-2.5 rounded-full transition-all group-hover:gap-3 shadow-sm">
                  <span>{city.emoji}</span>
                  <span>Explore {city.name}</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top rated in London */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Top rated in London</h2>
              <p className="text-gray-500 mt-1">Highest-rated venues by Google reviews</p>
            </div>
            <Link href="/london" className="text-[#7F77DD] font-semibold text-sm hover:underline hidden sm:block">
              View all London venues →
            </Link>
          </div>

          {/* Filter row */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {['All venues', 'Under 2s', '2–5 years', '5–12 years', 'With café', 'Free parking'].map((f, i) => (
              <button
                key={f}
                className={`whitespace-nowrap text-sm font-medium px-4 py-2 rounded-full border transition-colors ${
                  i === 0
                    ? 'bg-[#7F77DD] text-white border-[#7F77DD]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#7F77DD] hover:text-[#7F77DD]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {featuredVenues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredVenues.map((venue, i) => (
                <VenueCard key={venue.id} venue={venue} index={i} />
              ))}
            </div>
          ) : (
            /* Placeholder cards when DB is empty */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PLACEHOLDER_VENUES.map((venue, i) => (
                <VenueCard key={venue.slug} venue={venue} index={i} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/london" className="text-[#7F77DD] font-semibold text-sm hover:underline">
              View all London venues →
            </Link>
          </div>
        </div>
      </section>

      {/* Parent guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Parent guides</h2>
            <p className="text-gray-500 mt-1">Expert advice to find the best soft play for your family</p>
          </div>
          <Link href="/guides" className="text-[#7F77DD] font-semibold text-sm hover:underline hidden sm:block">
            All guides →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {GUIDE_CARDS.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ backgroundColor: guide.bg }}
              >
                {guide.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#7F77DD] transition-colors mb-1.5">
                {guide.title}
              </h3>
              <p className="text-sm text-gray-500">{guide.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}

const PLACEHOLDER_VENUES = [
  {
    name: 'Kidspace Adventure Park',
    slug: 'kidspace-adventure-park',
    address: 'Croydon, South London',
    googleRating: 4.2,
    googleReviewCount: 1847,
    features: ['All ages', 'Café', 'Parking', 'Party rooms'],
    isFeatured: true,
    isNew: false,
    city: { slug: 'london' },
    area: { slug: 'south-london' },
  },
  {
    name: 'Gambado Chelsea',
    slug: 'gambado-chelsea',
    address: 'Chelsea, West London',
    googleRating: 4.5,
    googleReviewCount: 892,
    features: ['Under 2s', 'Café', 'Party rooms'],
    isFeatured: false,
    isNew: true,
    city: { slug: 'london' },
    area: { slug: 'west-london' },
  },
  {
    name: 'Inflata Nation',
    slug: 'inflata-nation-london',
    address: 'Wembley, North London',
    googleRating: 4.7,
    googleReviewCount: 2341,
    features: ['5–12 years', 'Café', 'Free parking'],
    isFeatured: true,
    isNew: false,
    city: { slug: 'london' },
    area: { slug: 'north-london' },
  },
  {
    name: 'Little Explorers',
    slug: 'little-explorers-greenwich',
    address: 'Greenwich, East London',
    googleRating: 4.6,
    googleReviewCount: 456,
    features: ['Under 2s', '2–5 years', 'Café'],
    isFeatured: false,
    isNew: true,
    city: { slug: 'london' },
    area: { slug: 'east-london' },
  },
]
