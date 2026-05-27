import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import VenueCard from '@/components/VenueCard'
import Breadcrumb from '@/components/Breadcrumb'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24

interface Props {
  params: { city: string; area: string }
  searchParams: { page?: string }
}

async function getCityAndArea(citySlug: string, areaSlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } })
  if (!city) return null
  const area = await prisma.area.findFirst({
    where: { slug: areaSlug, cityId: city.id },
  })
  if (!area) return null
  return { city, area }
}

async function getAreaVenues(citySlug: string, areaSlug: string, page: number) {
  const data = await getCityAndArea(citySlug, areaSlug)
  if (!data) return { venues: [], total: 0 }

  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where: { cityId: data.city.id, areaId: data.area.id },
      include: { city: true, area: true },
      orderBy: [{ isFeatured: 'desc' }, { googleRating: 'desc' }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.venue.count({ where: { cityId: data.city.id, areaId: data.area.id } }),
  ])

  return { venues, total }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCityAndArea(params.city, params.area)
  if (!data) return {}

  const { city, area } = data
  const title = `Best Soft Play in ${area.name}, ${city.name}`
  const description = `Find the best soft play venues in ${area.name}, ${city.name}. Compare venues by rating, age group, features, and prices.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://bestsoftplay.co.uk/${city.slug}/${area.slug}`,
    },
  }
}

function Pagination({ page, totalPages, base }: { page: number; totalPages: number; base: string }) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <nav className="flex justify-center items-center gap-1 mt-12 flex-wrap" aria-label="Pagination">
      <a
        href={page > 1 ? `${base}?page=${page - 1}` : undefined}
        aria-disabled={page <= 1}
        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
          page <= 1
            ? 'border-gray-100 text-gray-300 pointer-events-none'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        ← Prev
      </a>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 text-sm">…</span>
        ) : (
          <a
            key={p}
            href={p === 1 ? base : `${base}?page=${p}`}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border transition-colors ${
              p === page
                ? 'bg-[#7F77DD] border-[#7F77DD] text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </a>
        )
      )}

      <a
        href={page < totalPages ? `${base}?page=${page + 1}` : undefined}
        aria-disabled={page >= totalPages}
        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
          page >= totalPages
            ? 'border-gray-100 text-gray-300 pointer-events-none'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        Next →
      </a>
    </nav>
  )
}

export default async function AreaPage({ params, searchParams }: Props) {
  const data = await getCityAndArea(params.city, params.area)
  if (!data) notFound()

  const { city, area } = data
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const { venues, total } = await getAreaVenues(params.city, params.area, page)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const base = `/${city.slug}/${area.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://bestsoftplay.co.uk' },
      { '@type': 'ListItem', position: 2, name: city.name, item: `https://bestsoftplay.co.uk/${city.slug}` },
      { '@type': 'ListItem', position: 3, name: area.name, item: `https://bestsoftplay.co.uk/${city.slug}/${area.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      <div className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb
            crumbs={[
              { label: 'Home', href: '/' },
              { label: city.name, href: `/${city.slug}` },
              { label: area.name },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Soft Play in{' '}
            <span style={{ color: city.colour }}>{area.name}</span>
          </h1>
          <p className="text-lg text-gray-500 mt-2">
            {total > 0
              ? `${total} venues in ${area.name}, ${city.name}`
              : `Indoor play venues in ${area.name}, ${city.name}`}
          </p>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {total > 0 && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {total} venues{totalPages > 1 ? ` — page ${page} of ${totalPages}` : ''}
            </h2>
          </div>
        )}

        {venues.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {venues.map((venue, i) => (
                <VenueCard key={venue.id} venue={venue} index={(page - 1) * PAGE_SIZE + i} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} base={base} />
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🎪</div>
            <p className="text-lg font-medium text-gray-500">No venues listed yet</p>
            <p className="text-sm mt-1">Check back soon or explore nearby areas.</p>
          </div>
        )}
      </section>

      <Footer />
    </>
  )
}
