import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import VenueCard from '@/components/VenueCard'
import Breadcrumb from '@/components/Breadcrumb'
import { prisma } from '@/lib/prisma'

interface Props {
  params: { city: string }
}

async function getCity(slug: string) {
  return prisma.city.findUnique({
    where: { slug },
    include: {
      areas: {
        include: { venues: { take: 1 } },
      },
    },
  })
}

async function getCityVenues(citySlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } })
  if (!city) return []
  return prisma.venue.findMany({
    where: { cityId: city.id },
    include: { city: true, area: true },
    orderBy: [{ isFeatured: 'desc' }, { googleRating: 'desc' }],
    take: 12,
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = await getCity(params.city)
  if (!city) return {}

  const title = `Best Soft Play in ${city.name} – Top Rated Venues`
  const description = `Browse the best soft play venues in ${city.name}. ${city.areas.length} areas covered with real Google ratings, features, and opening times for all ages.`

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `https://bestsoftplay.co.uk/${city.slug}` },
  }
}

export const dynamic = 'force-dynamic'

const CITY_META: Record<string, { tagline: string }> = {
  london: { tagline: 'From South London to Enfield — 180+ venues across the capital' },
  birmingham: { tagline: 'The best indoor play centres across Greater Birmingham' },
  manchester: { tagline: 'Rainy day heroes — Manchester\'s top soft play venues' },
}

export default async function CityPage({ params }: Props) {
  const city = await getCity(params.city)
  if (!city) notFound()

  const venues = await getCityVenues(params.city)
  const meta = CITY_META[params.city] ?? { tagline: `Top soft play venues in ${city.name}` }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://bestsoftplay.co.uk' },
      { '@type': 'ListItem', position: 2, name: city.name, item: `https://bestsoftplay.co.uk/${city.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* Hero */}
      <div className="py-12 px-4" style={{ backgroundColor: `${city.colour}15` }}>
        <div className="max-w-7xl mx-auto">
          <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: city.name }]} />

          <div className="flex items-start gap-4">
            <span className="text-5xl">{city.emoji}</span>
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                Soft Play in <span style={{ color: city.colour }}>{city.name}</span>
              </h1>
              <p className="text-lg text-gray-500 mt-2">{meta.tagline}</p>
            </div>
          </div>

          {/* Area chips */}
          {city.areas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              <Link
                href={`/${city.slug}`}
                className="chip bg-white text-gray-700 border border-gray-200 text-sm font-medium"
                style={{ borderColor: city.colour, color: city.colour }}
              >
                All {city.name}
              </Link>
              {city.areas.map((area) => (
                <Link
                  key={area.id}
                  href={`/${city.slug}/${area.slug}`}
                  className="chip bg-white text-gray-600 border border-gray-200 text-sm font-medium hover:border-current transition-colors"
                >
                  {area.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Venues grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {venues.length > 0 ? `${venues.length}+ venues` : 'All venues'}
          </h2>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7F77DD]">
            <option>Top rated</option>
            <option>Newest</option>
            <option>Most reviewed</option>
          </select>
        </div>

        {venues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {venues.map((venue, i) => (
              <VenueCard key={venue.id} venue={venue} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🎪</div>
            <p className="text-lg font-medium text-gray-500">No venues yet</p>
            <p className="text-sm mt-1">Run the sync script to populate venues from Google Places.</p>
          </div>
        )}
      </section>

      <Footer />
    </>
  )
}
