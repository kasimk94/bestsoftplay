import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import VenueCard from '@/components/VenueCard'
import Breadcrumb from '@/components/Breadcrumb'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Props {
  params: { city: string; area: string }
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

async function getAreaVenues(citySlug: string, areaSlug: string) {
  const data = await getCityAndArea(citySlug, areaSlug)
  if (!data) return []
  return prisma.venue.findMany({
    where: { cityId: data.city.id, areaId: data.area.id },
    include: { city: true, area: true },
    orderBy: [{ isFeatured: 'desc' }, { googleRating: 'desc' }],
  })
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

export default async function AreaPage({ params }: Props) {
  const data = await getCityAndArea(params.city, params.area)
  if (!data) notFound()

  const { city, area } = data
  const venues = await getAreaVenues(params.city, params.area)

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
            {venues.length > 0
              ? `${venues.length} venues found in ${area.name}`
              : `Indoor play venues in ${area.name}, ${city.name}`}
          </p>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {venues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {venues.map((venue, i) => (
              <VenueCard key={venue.id} venue={venue} index={i} />
            ))}
          </div>
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
