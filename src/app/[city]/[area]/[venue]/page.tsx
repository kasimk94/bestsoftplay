import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import VenueTabs from '@/components/VenueTabs'
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

async function fetchPhotoRefs(googlePlaceId: string | null, mainRef: string | null): Promise<string[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!googlePlaceId || !key) return mainRef ? [mainRef] : []
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=photos&key=${key}`,
      { next: { revalidate: 86400 } }
    )
    const data = await res.json()
    const refs: string[] = (data.result?.photos ?? [])
      .map((p: { photo_reference: string }) => p.photo_reference)
      .slice(0, 3)
    return refs.length > 0 ? refs : (mainRef ? [mainRef] : [])
  } catch {
    return mainRef ? [mainRef] : []
  }
}

function generateFAQs(venue: {
  name: string
  features: string[]
  ageMin: number | null
  ageMax: number | null
  priceRange: string | null
  area: { name: string }
}) {
  const hasCafe = venue.features.some(f => /caf[eé]/i.test(f))
  const hasParking = venue.features.some(f => /parking/i.test(f))

  const ageAnswer =
    venue.ageMin !== null && venue.ageMax !== null
      ? `${venue.name} is best suited for children aged ${venue.ageMin}–${venue.ageMax} years.`
      : venue.ageMin !== null
      ? `${venue.name} is suitable for children ${venue.ageMin} years and above.`
      : `${venue.name} caters to a range of ages — check with them directly for guidance.`

  return [
    {
      q: `What ages is ${venue.name} suitable for?`,
      a: `${ageAnswer} Always check with the venue about height or age restrictions on specific equipment.`,
    },
    {
      q: `Do I need to book in advance?`,
      a: `Weekends and school holidays can get busy at ${venue.name}. We recommend booking ahead online or calling the venue to reserve a session and avoid disappointment.`,
    },
    {
      q: `Is there a café or food available?`,
      a: hasCafe
        ? `Yes, ${venue.name} has a café on site — perfect for parents to grab a coffee while the kids play.`
        : `${venue.name} may have light refreshments available. Contact them directly to find out about food and drink options.`,
    },
    {
      q: `Is there parking at ${venue.name}?`,
      a: hasParking
        ? `Yes, ${venue.name} has parking available. It's worth confirming whether it's free or paid when you book.`
        : `We don't have confirmed parking details for ${venue.name}. Check their website or call ahead to find out about parking nearby.`,
    },
    {
      q: `How much does ${venue.name} cost?`,
      a: venue.priceRange
        ? `Prices at ${venue.name} are in the ${venue.priceRange} range. Exact charges vary by session — check their website for current pricing.`
        : `Admission prices at ${venue.name} vary by session type and child's age. Visit their website or call for up-to-date pricing.`,
    },
  ]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const venue = await getVenue(params.venue, params.city, params.area)
  if (!venue) return {}
  return {
    title: `${venue.name} – Soft Play in ${venue.area.name}, ${venue.city.name}`,
    description:
      venue.description ??
      `${venue.name} is a soft play venue in ${venue.area.name}, ${venue.city.name}. See ratings, photos, opening times and how to get there.`,
    alternates: {
      canonical: `https://bestsoftplay.co.uk/${venue.city.slug}/${venue.area.slug}/${venue.slug}`,
    },
  }
}

const HERO_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

function PhotoSlot({
  photoRef,
  name,
  fallbackColor,
}: {
  photoRef: string | undefined
  name: string
  fallbackColor: string
}) {
  if (!photoRef) {
    return <div className="absolute inset-0" style={{ backgroundColor: fallbackColor }} />
  }
  const src = `/api/place-photo?ref=${encodeURIComponent(photoRef)}&w=800`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className="absolute inset-0 w-full h-full object-cover" />
  )
}

export default async function VenuePage({ params }: Props) {
  const venue = await getVenue(params.venue, params.city, params.area)
  if (!venue) notFound()

  const photoRefs = await fetchPhotoRefs(venue.googlePlaceId, venue.photoReference)
  const heroColor = HERO_COLORS[Math.abs(venue.name.charCodeAt(0)) % 4]
  const score = venue.googleRating ? Math.round(venue.googleRating * 20) / 10 : null
  const faqs = generateFAQs(venue)
  const placesKey = process.env.GOOGLE_PLACES_API_KEY ?? ''

  const jsonLd = {
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
      geo: { '@type': 'GeoCoordinates', latitude: venue.lat, longitude: venue.lng },
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Navbar />

      {/* Hero photo gallery */}
      <div className="h-[340px] sm:h-[440px] grid grid-cols-3 gap-0.5 overflow-hidden bg-gray-200">
        <div className="col-span-2 relative">
          <PhotoSlot photoRef={photoRefs[0]} name={venue.name} fallbackColor={heroColor} />
        </div>
        <div className="col-span-1 grid grid-rows-2 gap-0.5">
          <div className="relative">
            <PhotoSlot photoRef={photoRefs[1] ?? photoRefs[0]} name={venue.name} fallbackColor={heroColor} />
          </div>
          <div className="relative">
            <PhotoSlot photoRef={photoRefs[2] ?? photoRefs[0]} name={venue.name} fallbackColor={heroColor} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          crumbs={[
            { label: 'Home', href: '/' },
            { label: venue.city.name, href: `/${venue.city.slug}` },
            { label: venue.area.name, href: `/${venue.city.slug}/${venue.area.slug}` },
            { label: venue.name },
          ]}
        />

        {/* Title + score */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {venue.name}
          </h1>
          {score !== null && (
            <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-[#7F77DD] text-white shadow-md">
              <span className="text-xl font-extrabold leading-none">{score}</span>
              <span className="text-[10px] font-semibold opacity-80 leading-none mt-0.5">/10</span>
            </div>
          )}
        </div>

        {/* Meta one-liner */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {venue.area.name}, {venue.city.name}
          </span>
          {venue.googleRating && (
            <>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1">
                <span className="text-amber-400">★</span>
                <span className="font-semibold text-gray-900">{venue.googleRating.toFixed(1)}</span>
                {venue.googleReviewCount && (
                  <span>({venue.googleReviewCount.toLocaleString()} reviews)</span>
                )}
              </span>
            </>
          )}
          {venue.priceRange && (
            <>
              <span className="text-gray-300">·</span>
              <span className="font-medium text-gray-700">{venue.priceRange}</span>
            </>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-8">
          {venue.address}{venue.postcode ? `, ${venue.postcode}` : ''}
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#7F77DD] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#6A62C8] transition-colors text-sm"
            >
              Visit website
            </a>
          )}
          {venue.phone && (
            <a
              href={`tel:${venue.phone}`}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              {venue.phone}
            </a>
          )}
          {venue.lat && venue.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Get directions
            </a>
          )}
        </div>

        {/* Tabbed content */}
        <VenueTabs
          name={venue.name}
          description={venue.description}
          features={venue.features}
          ageMin={venue.ageMin}
          ageMax={venue.ageMax}
          openingHours={venue.openingHours as { weekdays?: string[] } | null}
          address={venue.address}
          postcode={venue.postcode}
          phone={venue.phone}
          website={venue.website}
          lat={venue.lat}
          lng={venue.lng}
          googlePlacesKey={placesKey}
          faqs={faqs}
        />
      </div>

      <Footer />
    </>
  )
}
