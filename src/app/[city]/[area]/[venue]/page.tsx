import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Props {
  params: { city: string; area: string; venue: string }
}

async function getVenue(venueSlug: string, citySlug: string, areaSlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } })
  if (!city) return null
  const area = await prisma.area.findFirst({ where: { slug: areaSlug, cityId: city.id } })
  if (!area) return null
  return prisma.venue.findFirst({
    where: { slug: venueSlug, cityId: city.id, areaId: area.id },
    include: { city: true, area: true },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const venue = await getVenue(params.venue, params.city, params.area)
  if (!venue) return {}

  const title = `${venue.name} – Soft Play in ${venue.area.name}, ${venue.city.name}`
  const description =
    venue.description ??
    `${venue.name} is a soft play venue in ${venue.area.name}, ${venue.city.name}. See ratings, features, opening times, and how to get there.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://bestsoftplay.co.uk/${venue.city.slug}/${venue.area.slug}/${venue.slug}`,
    },
  }
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating)
  return (
    <span className="text-amber-400 text-xl">
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  )
}

export default async function VenuePage({ params }: Props) {
  const venue = await getVenue(params.venue, params.city, params.area)
  if (!venue) notFound()

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: venue.name,
    description: venue.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
      postalCode: venue.postcode,
      addressCountry: 'GB',
    },
    telephone: venue.phone,
    url: venue.website,
    ...(venue.googleRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: venue.googleRating,
        reviewCount: venue.googleReviewCount ?? 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(venue.lat && venue.lng && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: venue.lat,
        longitude: venue.lng,
      },
    }),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://bestsoftplay.co.uk' },
      { '@type': 'ListItem', position: 2, name: venue.city.name, item: `https://bestsoftplay.co.uk/${venue.city.slug}` },
      { '@type': 'ListItem', position: 3, name: venue.area.name, item: `https://bestsoftplay.co.uk/${venue.city.slug}/${venue.area.slug}` },
      { '@type': 'ListItem', position: 4, name: venue.name },
    ],
  }

  const cardColors = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']
  const cardEmojis = ['🎪', '🧸', '🎡', '🎠']
  const colorIdx = Math.abs(venue.name.charCodeAt(0)) % 4
  const heroColor = cardColors[colorIdx]
  const heroEmoji = cardEmojis[colorIdx]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Navbar />

      {/* Hero image placeholder */}
      <div
        className="relative h-64 sm:h-80 flex items-center justify-center"
        style={{ backgroundColor: heroColor }}
      >
        <span className="text-9xl opacity-20 select-none">{heroEmoji}</span>
        {venue.isFeatured && (
          <span className="absolute top-6 left-6 bg-white text-gray-900 text-sm font-bold px-3 py-1.5 rounded-full shadow">
            ⭐ Top pick
          </span>
        )}
        {venue.isNew && (
          <span className="absolute top-6 left-6 bg-white text-gray-900 text-sm font-bold px-3 py-1.5 rounded-full shadow">
            New
          </span>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb
          crumbs={[
            { label: 'Home', href: '/' },
            { label: venue.city.name, href: `/${venue.city.slug}` },
            { label: venue.area.name, href: `/${venue.city.slug}/${venue.area.slug}` },
            { label: venue.name },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              {venue.name}
            </h1>

            <p className="text-gray-500 flex items-center gap-1.5 mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {venue.address}, {venue.postcode}
            </p>

            {venue.googleRating && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-2xl">
                <StarRating rating={venue.googleRating} />
                <div>
                  <span className="text-2xl font-extrabold text-gray-900">{venue.googleRating.toFixed(1)}</span>
                  {venue.googleReviewCount && (
                    <span className="text-sm text-gray-500 ml-2">({venue.googleReviewCount.toLocaleString()} Google reviews)</span>
                  )}
                </div>
              </div>
            )}

            {venue.description && (
              <div className="prose prose-gray max-w-none mb-8">
                <p className="text-gray-700 text-base leading-relaxed">{venue.description}</p>
              </div>
            )}

            {/* Features */}
            {venue.features.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {venue.features.map((f) => (
                    <span key={f} className="chip bg-[#F4F3FB] text-[#7F77DD] text-sm font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Age range */}
            {(venue.ageMin !== null || venue.ageMax !== null) && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Age range</h2>
                <p className="text-gray-600">
                  {venue.ageMin !== null && venue.ageMax !== null
                    ? `${venue.ageMin}–${venue.ageMax} years`
                    : venue.ageMin !== null
                    ? `${venue.ageMin}+ years`
                    : `Up to ${venue.ageMax} years`}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24 space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">Visit info</h2>

              {venue.address && (
                <div className="flex gap-3 text-sm">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-gray-900 font-medium">{venue.address}</p>
                    <p className="text-gray-500">{venue.postcode}</p>
                  </div>
                </div>
              )}

              {venue.phone && (
                <div className="flex gap-3 text-sm">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${venue.phone}`} className="text-[#7F77DD] hover:underline font-medium">
                    {venue.phone}
                  </a>
                </div>
              )}

              {venue.priceRange && (
                <div className="flex gap-3 text-sm">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 font-medium">{venue.priceRange}</span>
                </div>
              )}

              {venue.website && (
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-[#7F77DD] text-white font-semibold py-3 rounded-xl hover:bg-[#6A62C8] transition-colors mt-2"
                >
                  Visit website
                </a>
              )}

              {venue.lat && venue.lng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Get directions
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
