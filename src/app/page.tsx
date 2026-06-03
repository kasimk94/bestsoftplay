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
    colour: '#5B21B6',
    emoji: '🎡',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #EC4899 100%)',
    scatter: ['✨', '⭐', '💫', '🌟', '✨', '⭐'],
    areas: ['South London', 'North London', 'East London', 'West London'],
  },
  {
    name: 'Birmingham',
    slug: 'birmingham',
    colour: '#9A3412',
    emoji: '🎠',
    gradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FDE047 100%)',
    scatter: ['🎊', '✨', '⭐', '🎉', '✨', '💛'],
    areas: ['City Centre', 'Solihull', 'Sutton Coldfield'],
  },
  {
    name: 'Manchester',
    slug: 'manchester',
    colour: '#065F46',
    emoji: '🌈',
    gradient: 'linear-gradient(135deg, #059669 0%, #14B8A6 50%, #22D3EE 100%)',
    scatter: ['🌟', '✨', '⭐', '💫', '✨', '🌟'],
    areas: ['City Centre', 'Salford', 'Trafford', 'Stockport'],
  },
]


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
              className="group relative overflow-hidden rounded-3xl flex flex-col justify-end shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.05]"
              style={{ background: city.gradient, minHeight: '300px' }}
            >
              {/* Scattered floating emoji */}
              <div className="absolute inset-0 select-none pointer-events-none overflow-hidden">
                <span className="absolute top-4 left-5 text-2xl opacity-50">{city.scatter[0]}</span>
                <span className="absolute top-16 left-[22%] text-xl opacity-40">{city.scatter[1]}</span>
                <span className="absolute top-3 left-[44%] text-2xl opacity-45">{city.scatter[2]}</span>
                <span className="absolute top-24 left-[12%] text-lg opacity-35">{city.scatter[3]}</span>
                <span className="absolute top-10 left-[60%] text-xl opacity-35">{city.scatter[4]}</span>
                <span className="absolute top-28 left-[48%] text-lg opacity-30">{city.scatter[5]}</span>
              </div>

              {/* Big hero emoji — top right */}
              <div
                className="absolute top-4 right-5 select-none drop-shadow-xl leading-none"
                style={{ fontSize: '84px' }}
              >
                {city.emoji}
              </div>

              {/* Soft gradient fade at bottom for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none"/>

              {/* Card content */}
              <div className="relative z-10 p-7">
                <p className="text-white/85 text-sm font-bold mb-2 drop-shadow">
                  {counts[city.slug] ?? 0} venues
                </p>
                <h3 className="text-white font-black tracking-tight leading-none mb-4 drop-shadow-lg" style={{ fontSize: '2.8rem' }}>
                  {city.name}
                </h3>

                {/* Area tags — bright white pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {city.areas.map((area) => (
                    <span
                      key={area}
                      className="bg-white text-xs font-extrabold px-4 py-2 rounded-full shadow-md"
                      style={{ color: city.colour }}
                    >
                      {area}
                    </span>
                  ))}
                </div>

                {/* Bright white Explore button */}
                <div
                  className="inline-flex items-center gap-2 bg-white font-extrabold text-sm px-5 py-3 rounded-full shadow-lg group-hover:shadow-xl transition-all group-hover:gap-3"
                  style={{ color: city.colour }}
                >
                  Explore {city.name}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
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
