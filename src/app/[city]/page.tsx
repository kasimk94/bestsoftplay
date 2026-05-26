import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import VenueCard from '@/components/VenueCard'
import Breadcrumb from '@/components/Breadcrumb'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 24

interface Props {
  params: { city: string }
  searchParams: { page?: string }
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

async function getCityVenues(citySlug: string, page: number) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } })
  if (!city) return { venues: [], total: 0 }

  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where: { cityId: city.id },
      include: { city: true, area: true },
      orderBy: [{ isFeatured: 'desc' }, { googleRating: 'desc' }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.venue.count({ where: { cityId: city.id } }),
  ])

  return { venues, total }
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

function buildSubtitle(city: NonNullable<Awaited<ReturnType<typeof getCity>>>, total: number) {
  const areaNames = city.areas.map((a) => a.name)
  const shown = areaNames.slice(0, 3).join(', ')
  const rest = areaNames.length - 3
  const areaStr = rest > 0 ? `${shown} and ${rest} more areas` : shown
  return `${total} venues across ${areaStr}`
}

function Pagination({ page, totalPages, citySlug }: { page: number; totalPages: number; citySlug: string }) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  const base = `/${citySlug}`

  return (
    <nav className="flex justify-center items-center gap-1 mt-12 flex-wrap" aria-label="Pagination">
      <Link
        href={page > 1 ? `${base}?page=${page - 1}` : '#'}
        aria-disabled={page <= 1}
        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
          page <= 1
            ? 'border-gray-100 text-gray-300 pointer-events-none'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        ← Prev
      </Link>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 text-sm">…</span>
        ) : (
          <Link
            key={p}
            href={p === 1 ? base : `${base}?page=${p}`}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border transition-colors ${
              p === page
                ? 'bg-[#7F77DD] border-[#7F77DD] text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={page < totalPages ? `${base}?page=${page + 1}` : '#'}
        aria-disabled={page >= totalPages}
        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
          page >= totalPages
            ? 'border-gray-100 text-gray-300 pointer-events-none'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        Next →
      </Link>
    </nav>
  )
}

export default async function CityPage({ params, searchParams }: Props) {
  const city = await getCity(params.city)
  if (!city) notFound()

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const { venues, total } = await getCityVenues(params.city, page)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const subtitle = buildSubtitle(city, total)

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
              <p className="text-lg text-gray-500 mt-2">{subtitle}</p>
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
            {total > 0
              ? `${total} venues in ${city.name}${totalPages > 1 ? ` — page ${page} of ${totalPages}` : ''}`
              : 'All venues'}
          </h2>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#7F77DD]">
            <option>Top rated</option>
            <option>Newest</option>
            <option>Most reviewed</option>
          </select>
        </div>

        {venues.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {venues.map((venue, i) => (
                <VenueCard key={venue.id} venue={venue} index={(page - 1) * PAGE_SIZE + i} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} citySlug={city.slug} />
          </>
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
