import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import VenueGallery from '@/components/VenueGallery'
import KeyInfoCards, { getAgeLabel } from '@/components/KeyInfoCards'
import VenueAbout from '@/components/VenueAbout'
import OpeningHoursTable from '@/components/OpeningHoursTable'
import VenueMap from '@/components/VenueMap'
import NearbyVenues from '@/components/NearbyVenues'
import ReviewsSection, { type VenueReview } from '@/components/ReviewsSection'
import FAQSection from '@/components/FAQSection'
import StickyMobileCTA from '@/components/StickyMobileCTA'
import { prisma } from '@/lib/prisma'
import { excludeNonSoftPlay } from '@/lib/venueFilters'

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

async function getNearbyVenues(cityId: string, excludeId: string, lat: number, lng: number) {
  const venues = await prisma.venue.findMany({
    where: {
      cityId,
      id: { not: excludeId },
      lat: { not: null },
      lng: { not: null },
      AND: excludeNonSoftPlay(),
    },
    select: {
      name: true, slug: true, lat: true, lng: true,
      googleRating: true, googleReviewCount: true,
      photoReference: true, photoUrl: true, photoUrl2: true, photoUrl3: true,
      city: { select: { slug: true } },
      area: { select: { slug: true } },
    },
  })

  return venues
    .map((v) => ({ ...v, distance: haversine(lat, lng, v.lat!, v.lng!) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4)
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8 // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface PlaceDetails {
  photoRefs: string[]
  reviews: VenueReview[]
}

async function fetchPlaceDetails(googlePlaceId: string | null, mainRef: string | null): Promise<PlaceDetails> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  const fallback = { photoRefs: mainRef ? [mainRef] : [], reviews: [] }
  if (!googlePlaceId || !key) return fallback

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=photos,reviews&key=${key}`,
      { next: { revalidate: 86400 } }
    )
    const data = await res.json()

    const photoRefs: string[] = (data.result?.photos ?? [])
      .map((p: { photo_reference: string }) => p.photo_reference)
      .slice(0, 10)

    const reviews: VenueReview[] = (data.result?.reviews ?? [])
      .slice(0, 5)
      .map((r: { author_name: string; rating: number; text: string; relative_time_description: string }) => ({
        authorName: r.author_name,
        rating: r.rating,
        text: r.text,
        relativeTime: r.relative_time_description,
      }))

    return {
      photoRefs: photoRefs.length > 0 ? photoRefs : fallback.photoRefs,
      reviews,
    }
  } catch {
    return fallback
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
      q: `Is ${venue.name} suitable for toddlers?`,
      a: `${ageAnswer} Always check with the venue about height or age restrictions on specific equipment.`,
    },
    {
      q: `Do I need to book in advance?`,
      a: `Weekends and school holidays can get busy at ${venue.name}. We recommend booking ahead online or calling the venue to reserve a session and avoid disappointment.`,
    },
    {
      q: `Does ${venue.name} have a café?`,
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
    {
      q: `Is ${venue.name} open on weekends?`,
      a: `Most soft play venues, including ${venue.name}, are open on Saturdays and Sundays. Check the opening hours table above for exact weekend times.`,
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

function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return (
    <span className="text-amber-400 text-lg tracking-tight leading-none">
      {'★'.repeat(rounded)}
      <span className="text-gray-200">{'★'.repeat(5 - rounded)}</span>
    </span>
  )
}

export default async function VenuePage({ params }: Props) {
  const venue = await getVenue(params.venue, params.city, params.area)
  if (!venue) notFound()

  const [{ photoRefs, reviews }, nearby] = await Promise.all([
    fetchPlaceDetails(venue.googlePlaceId, venue.photoReference),
    venue.lat && venue.lng ? getNearbyVenues(venue.cityId, venue.id, venue.lat, venue.lng) : Promise.resolve([]),
  ])

  const heroColor = HERO_COLORS[Math.abs(venue.name.charCodeAt(0)) % 4]
  const faqs = generateFAQs(venue)
  const ageLabel = getAgeLabel(venue.ageMin, venue.ageMax)
  const hasCafe = venue.features.some((f) => /caf[eé]/i.test(f))
  const hasParking = venue.features.some((f) => /parking/i.test(f))
  const hasPartyRooms = venue.features.some((f) => /party/i.test(f))
  const weekdays = (venue.openingHours as { weekdays?: string[] } | null)?.weekdays ?? []

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

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Navbar />

      <VenueGallery photoRefs={photoRefs} name={venue.name} fallbackColor={heroColor} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
        <Breadcrumb
          crumbs={[
            { label: 'Home', href: '/' },
            { label: venue.city.name, href: `/${venue.city.slug}` },
            { label: venue.area.name, href: `/${venue.city.slug}/${venue.area.slug}` },
            { label: venue.name },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {venue.name}
          </h1>
          {ageLabel && (
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#F4F3FB] text-[#7F77DD] text-sm font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
              👶 {ageLabel}
            </span>
          )}
        </div>

        {venue.googleRating && (
          <div className="flex items-center gap-2 mb-3">
            <StarRow rating={venue.googleRating} />
            <span className="font-bold text-gray-900">{venue.googleRating.toFixed(1)}</span>
            {venue.googleReviewCount && (
              <a
                href={venue.googlePlaceId ? `https://www.google.com/maps/place/?q=place_id:${venue.googlePlaceId}` : '#reviews'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-[#7F77DD] hover:underline"
              >
                ({venue.googleReviewCount.toLocaleString()} reviews)
              </a>
            )}
          </div>
        )}

        <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-8">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {venue.address}{venue.postcode ? `, ${venue.postcode}` : ''}
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#7F77DD] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#6A62C8] transition-colors text-sm"
            >
              Visit website →
            </a>
          )}
          {venue.lat && venue.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Get directions →
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
        </div>

        {/* Key info cards */}
        <KeyInfoCards
          googleRating={venue.googleRating}
          ageMin={venue.ageMin}
          ageMax={venue.ageMax}
          hasCafe={hasCafe}
          hasParking={hasParking}
          hasPartyRooms={hasPartyRooms}
        />

        <VenueAbout description={venue.description} features={venue.features} />

        <OpeningHoursTable weekdays={weekdays} />

        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-4">Location</h2>
          {venue.lat && venue.lng && (
            <div className="mb-4">
              <VenueMap lat={venue.lat} lng={venue.lng} name={venue.name} />
            </div>
          )}
          <p className="text-gray-700 font-medium">{venue.address}</p>
          {venue.postcode && <p className="text-gray-500 text-sm">{venue.postcode}</p>}
        </section>

        <div id="reviews">
          <ReviewsSection reviews={reviews} />
        </div>

        <NearbyVenues venues={nearby} />

        <FAQSection faqs={faqs} />
      </div>

      <Footer />

      <StickyMobileCTA website={venue.website} lat={venue.lat} lng={venue.lng} />
    </>
  )
}
