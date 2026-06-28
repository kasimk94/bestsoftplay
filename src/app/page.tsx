import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SearchBar from '@/components/SearchBar'
import VenueCard from '@/components/VenueCard'
import { prisma } from '@/lib/prisma'
import { excludeNonSoftPlay } from '@/lib/venueFilters'
import AnimatedWord from '@/components/AnimatedWord'
import FloatingEmojis from '@/components/FloatingEmojis'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BestSoftPlay – Find the Best Soft Play Venues in the UK',
  description:
    'Discover hundreds of soft play venues across London, Birmingham, and Manchester. Filter by age, features, and ratings to find the perfect indoor play centre for your little ones.',
}

const QUICK_FILTERS = [
  { label: 'Most popular', icon: '🔥', bg: '#FFE4E1', text: '#9F1239', hover: '#FECACA' },
  { label: 'Under 2s',     icon: '👶', bg: '#FEF3C7', text: '#92400E', hover: '#FDE68A' },
  { label: '2–5 years',    icon: '🧒', bg: '#E0F2FE', text: '#075985', hover: '#BAE6FD' },
  { label: '5–12 years',   icon: '🧑', bg: '#D1FAE5', text: '#065F46', hover: '#A7F3D0' },
  { label: 'Good café',    icon: '☕', bg: '#FEF9C3', text: '#713F12', hover: '#FEF08A' },
  { label: 'Free parking', icon: '🅿️', bg: '#EDE9FE', text: '#4C1D95', hover: '#DDD6FE' },
  { label: 'Party rooms',  icon: '🎂', bg: '#FCE7F3', text: '#831843', hover: '#FBCFE8' },
  { label: 'Open Sundays', icon: '📅', bg: '#CCFBF1', text: '#134E4A', hover: '#99F6E4' },
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
    icon: '🗺️',
    bg: '#FF6B6B',
    textColour: '#7F1D1D',
    accentColour: '#DC2626',
    badge: '📍 18 venues',
    title: 'Best Soft Plays in South London',
    slug: 'best-soft-plays-south-london',
    desc: '18 venues reviewed and ranked',
    rotate: '-rotate-1',
  },
  {
    icon: '👶',
    bg: '#FFD93D',
    textColour: '#713F12',
    accentColour: '#B45309',
    badge: '⭐ Parent favourite',
    title: 'Best for Toddlers in London',
    slug: 'best-soft-plays-toddlers-london',
    desc: 'Under 2s welcome – our picks',
    rotate: 'rotate-1',
  },
  {
    icon: '🏙️',
    bg: '#4ECDC4',
    textColour: '#134E4A',
    accentColour: '#0F766E',
    badge: '🏆 Top rated',
    title: 'Best Soft Plays in Birmingham',
    slug: 'best-soft-plays-birmingham',
    desc: 'Top venues across the city',
    rotate: '-rotate-1',
  },
  {
    icon: '☔',
    bg: '#A78BFA',
    textColour: '#2E1065',
    accentColour: '#7C3AED',
    badge: '🌧️ Rain-day essential',
    title: 'Best Soft Plays in Manchester',
    slug: 'best-soft-plays-manchester',
    desc: 'Rain-proof family fun',
    rotate: 'rotate-1',
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
        googleRating: { gte: 4.5 },
        googleReviewCount: { gte: 50 },
        photoUrl: { not: null },
        AND: excludeNonSoftPlay(),
      },
      include: { city: true, area: true },
      orderBy: [{ googleRating: 'desc' }, { googleReviewCount: 'desc' }],
      take: 8,
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
      <section className="relative pt-16 pb-10 px-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #EDE9FF 0%, #F5EEFF 40%, #FFF0E8 100%)' }}>
        <FloatingEmojis />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-[#E9E8F7] text-[#7F77DD] text-sm font-semibold px-4 py-2 rounded-full mb-6 shadow-sm">
            <span>🇬🇧</span>
            <span>UK&apos;s largest soft play directory</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Find the perfect soft play for your
            <span className="block mt-3 sm:mt-4">
              <AnimatedWord />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Browse {total > 0 ? `${total}+` : 'hundreds of'} verified soft play venues across the UK with real Google ratings,
            parent reviews, and up-to-date opening times.
          </p>

          <div className="flex justify-center mb-8">
            <SearchBar />
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.label}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full shadow-sm transition-all hover:scale-105 hover:shadow-md"
                style={{ backgroundColor: f.bg, color: f.text, border: `1.5px solid ${f.bg}` }}
              >
                <span>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center">
            <div className="animate-bounce flex flex-col items-center gap-1 opacity-50">
              <svg className="w-6 h-6 text-[#7F77DD]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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
      <section className="relative pt-16 pb-12 overflow-hidden" style={{ background: '#F3F1FF' }}>
        {/* Subtle scattered sparkles */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <span className="absolute top-6  left-[3%]  text-xl opacity-[0.12]">✦</span>
          <span className="absolute top-14 left-[12%] text-lg opacity-[0.10]">⭐</span>
          <span className="absolute top-8  right-[5%] text-2xl opacity-[0.12]">✶</span>
          <span className="absolute top-20 right-[14%] text-lg opacity-[0.10]">✨</span>
          <span className="absolute bottom-8  left-[7%]  text-lg opacity-[0.10]">✦</span>
          <span className="absolute bottom-10 right-[9%] text-xl opacity-[0.12]">✶</span>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                className="absolute top-4 right-5 select-none leading-none"
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
        </div>{/* /max-w-7xl */}
      </section>

      {/* Top rated venues */}
      <section className="relative py-16 overflow-hidden" style={{ background: '#EBE8FF' }}>
        {/* Subtle scattered sparkles */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <span className="absolute top-5   left-[6%]   text-2xl opacity-[0.12]">⭐</span>
          <span className="absolute top-16  left-[20%]  text-lg  opacity-[0.09]">✦</span>
          <span className="absolute top-8   right-[8%]  text-xl  opacity-[0.12]">✨</span>
          <span className="absolute top-20  right-[22%] text-lg  opacity-[0.09]">✶</span>
          <span className="absolute bottom-6  left-[10%]  text-xl  opacity-[0.10]">✶</span>
          <span className="absolute bottom-8  right-[6%]  text-2xl opacity-[0.12]">⭐</span>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Top rated venues</h2>
              <p className="text-gray-500 mt-1">Highest-rated across London, Birmingham &amp; Manchester</p>
            </div>
          </div>

          {featuredVenues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredVenues.map((venue, i) => (
                <VenueCard key={venue.id} venue={venue} index={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PLACEHOLDER_VENUES.map((venue, i) => (
                <VenueCard key={venue.slug} venue={venue} index={i} />
              ))}
            </div>
          )}
        </div>{/* /max-w-7xl */}
      </section>

      {/* Parent guides */}
      <section className="bg-[#FFF9F0] py-16 px-4 relative overflow-hidden">
        {/* Decorative confetti dots */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <span className="absolute top-6 left-[8%] text-2xl opacity-30">✦</span>
          <span className="absolute top-12 left-[18%] text-lg opacity-25">✶</span>
          <span className="absolute top-4 left-[35%] text-xl opacity-20">✦</span>
          <span className="absolute top-8 right-[30%] text-2xl opacity-25">✶</span>
          <span className="absolute top-5 right-[15%] text-lg opacity-30">✦</span>
          <span className="absolute top-14 right-[5%] text-xl opacity-20">✶</span>
          <span className="absolute bottom-8 left-[5%] text-xl opacity-20">✦</span>
          <span className="absolute bottom-6 left-[25%] text-2xl opacity-15">✶</span>
          <span className="absolute bottom-10 right-[20%] text-lg opacity-20">✦</span>
          <span className="absolute bottom-4 right-[8%] text-2xl opacity-25">✶</span>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Parent guides</h2>
                <span className="text-2xl">📚</span>
              </div>
              <p className="text-gray-500">Expert advice to find the best soft play for your family</p>
            </div>
            <Link href="/guides" className="text-[#7F77DD] font-semibold text-sm hover:underline hidden sm:block">
              All guides →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {GUIDE_CARDS.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className={`group rounded-3xl p-7 shadow-lg hover:shadow-xl transition-all duration-300 ${guide.rotate} hover:rotate-0 hover:scale-[1.03] flex flex-col`}
                style={{ backgroundColor: guide.bg }}
              >
                {/* Badge */}
                <div
                  className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full mb-5 self-start shadow-sm"
                  style={{ backgroundColor: 'rgba(0,0,0,0.12)', color: guide.textColour }}
                >
                  {guide.badge}
                </div>

                {/* Big floating emoji */}
                <div className="text-[64px] leading-none mb-5 select-none">
                  {guide.icon}
                </div>

                {/* Text */}
                <h3
                  className="font-black text-lg leading-snug mb-2"
                  style={{ color: guide.textColour }}
                >
                  {guide.title}
                </h3>
                <p
                  className="text-sm leading-relaxed flex-1 mb-5"
                  style={{ color: guide.textColour, opacity: 0.75 }}
                >
                  {guide.desc}
                </p>

                {/* Read guide link */}
                <div
                  className="inline-flex items-center gap-1.5 text-sm font-extrabold group-hover:gap-2.5 transition-all"
                  style={{ color: guide.accentColour }}
                >
                  Read guide
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
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
