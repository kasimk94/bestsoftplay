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
    'Discover 320+ soft play venues across London, Birmingham, and Manchester. Filter by age, features, and ratings to find the perfect indoor play centre for your little ones.',
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
    emoji: '🏙️',
    venueCount: 180,
    areas: ['South London', 'North London', 'East London', 'West London'],
  },
  {
    name: 'Birmingham',
    slug: 'birmingham',
    colour: '#D85A30',
    emoji: '🏭',
    venueCount: 85,
    areas: ['City Centre', 'Solihull', 'Sutton Coldfield'],
  },
  {
    name: 'Manchester',
    slug: 'manchester',
    colour: '#1D9E75',
    emoji: '🌧️',
    venueCount: 72,
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
  const featuredVenues = await getFeaturedVenues()

  const STATS = [
    { value: '320+', label: 'Venues listed' },
    { value: '3', label: 'Cities covered' },
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
            <span>UK&apos;s most trusted soft play directory</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Find the perfect soft play for your
            <br />
            <AnimatedWord />
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Browse 320+ verified soft play venues across the UK with real Google ratings,
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
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CITY_CARDS.map((city) => (
            <Link
              key={city.slug}
              href={`/${city.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] flex flex-col justify-end p-6 transition-transform hover:scale-[1.02] duration-200"
              style={{ backgroundColor: city.colour }}
            >
              {/* Background emoji */}
              <div className="absolute top-6 right-6 text-7xl opacity-20 select-none">
                {city.emoji}
              </div>

              <div className="relative z-10">
                <p className="text-white/70 text-sm font-medium mb-1">
                  {city.venueCount}+ venues
                </p>
                <h3 className="text-white text-3xl font-extrabold tracking-tight mb-3">
                  {city.name}
                </h3>

                {/* Area tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {city.areas.map((area) => (
                    <span key={area} className="bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                      {area}
                    </span>
                  ))}
                </div>

                <div className="inline-flex items-center gap-2 text-white font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore {city.name}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
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
