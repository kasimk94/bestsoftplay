import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import VenueCard from '@/components/VenueCard'
import LinkedGuideContent from '@/components/LinkedGuideContent'
import { prisma } from '@/lib/prisma'
import { passesQualityFilter } from '@/lib/venueFilters'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

async function getGuide(slug: string) {
  try {
    return await prisma.guide.findUnique({ where: { slug } })
  } catch {
    return null
  }
}

// Explicit per-guide venue lists, in the order each venue is first named in
// that guide's prose. Kept as fixed slugs (rather than a dynamic keyword/rating
// query) so the "recommended venues" grid always matches exactly what the body
// text names — a dynamic query can silently drift from the prose over time,
// which is exactly how the old free-vs-paid guide ended up recommending a
// venue (RPCA Soft Play) that its own text no longer mentioned after deletion.
const GUIDE_VENUE_SLUGS: Record<string, string[]> = {
  'best-soft-plays-toddlers-london': ['kinder-island-soft-play', 'bonbon-kids-cafe', 'play-central', 'the-barnyard-soft-play', 'buzy-bees-playbarn', 'salaspark-ltd', 'ballooon-soft-play-cafe', 'rainbow-cafe'],
  'best-soft-play-toddlers-birmingham': ['little-tinkers-birmingham', 'playwrights-cafe-coventry-canal-basin', 'the-soft-play-caf', 'rock-up-birmingham', 'flamingoo-soft-play', 'mini-monkeys-play-learn-centre', 'little-lobsters-play-centre', 'jungle-boogie-walsall'],
  'best-soft-play-toddlers-manchester': ['baby-bears-play-cafe', 'playcafe', 'bumble-bee', 'busy-little-monsters', 'the-rainforest-retreat-play-cafe', 'the-place-to-play', 'the-treehouse-salford', 'small-town-play-caf'],
  'rainy-day-indoor-soft-play-guide': ['rendezvous-softplay', 'under-the-canopy-play-cafe', 'kinder-island-soft-play', 'the-snug-stay-and-play-cafe', 'natural-play-and-cafe', 'little-tinkers-birmingham', 'the-place-to-play', 'baby-bears-play-cafe'],
  'soft-play-birthday-parties-guide': ['myplace-soft-play-parties', 'fun-junction-play-party-centre', 'zig-zags-play-and-party', 'junglebugs-indoor-play-centre-and-party-zone', 'discobowl-warrington', 'treetops-play-and-party-cafe'],
  'free-vs-paid-soft-play': ['rendezvous-softplay', 'under-the-canopy-play-cafe', 'the-snug-stay-and-play-cafe', 'natural-play-and-cafe', 'the-place-to-play', 'baby-bears-play-cafe'],
  'best-soft-plays-south-london': ['rendezvous-softplay', 'clip-n-climb-croydon', 'salaspark-ltd', 'another-planet', 'little-seedlings-soft-play', 'bertie-and-boo-adventure-island', 'globetrotters-soft-play-centre', 'fratello-caf-play'],
  'best-soft-plays-birmingham': ['little-tinkers-birmingham', 'playwrights-cafe-coventry-canal-basin', 'flamingoo-soft-play', 'the-soft-play-caf', 'rock-up-birmingham', 'natural-play-and-cafe', 'the-snug-stay-and-play-cafe', 'jungle-boogie-walsall', 'mini-monkeys-play-learn-centre', 'little-lobsters-play-centre'],
  'best-soft-plays-manchester': ['baby-bears-play-cafe', 'playcafe', 'bumble-bee', 'busy-little-monsters', 'the-little-luxe-soft-play-centre-ltd', 'the-rainforest-retreat-play-cafe', 'the-place-to-play', 'the-treehouse-salford'],
  'free-and-cheap-soft-play-london': ['hornsey-road-childrens-centre', 'barnardos-triangle-service', 'the-sherriff-centre', 'the-greenwich-centre', 'wandle-recreation-centre', 'waltham-forest-feel-good-centre', 'bellingham-leisure-lifestyle-centre', 'the-eltham-centre'],
  'soft-play-birthday-parties-under-15': ['fun-junction-play-party-centre', 'myplace-soft-play-parties', 'zig-zags-play-and-party', 'junglebugs-indoor-play-centre-and-party-zone', 'discobowl-warrington', 'treetops-play-and-party-cafe', 'wandle-recreation-centre', 'bellingham-leisure-lifestyle-centre'],
  'soft-play-near-me-quick-pick-guide': ['rendezvous-softplay', 'clip-n-climb-croydon', 'under-the-canopy-play-cafe', 'ballooon-soft-play-cafe', 'rainbow-cafe', 'kinder-island-soft-play', 'salaspark-ltd', 'rainforest-soft-play-club-cic', 'the-snug-stay-and-play-cafe', 'jungle-boogie-walsall', 'natural-play-and-cafe', 'little-tinkers-birmingham', 'playwrights-cafe-coventry-canal-basin', 'flamingoo-soft-play', 'mini-monkeys-play-learn-centre', 'little-lobsters-play-centre', 'the-place-to-play', 'baby-bears-play-cafe', 'playcafe', 'the-little-luxe-soft-play-centre-ltd', 'bumble-bee', 'busy-little-monsters', 'the-treehouse-salford'],
}

async function getGuideVenues(slug: string) {
  const slugs = GUIDE_VENUE_SLUGS[slug]
  if (!slugs) return []
  try {
    const venues = await prisma.venue.findMany({
      where: { slug: { in: slugs }, isExcluded: false, ...passesQualityFilter() },
      include: { city: true, area: true },
    })
    const order = new Map(slugs.map((s, i) => [s, i]))
    return venues.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = await getGuide(params.slug)
  if (!guide) return {}

  return {
    title: guide.title,
    description: guide.metaDescription ?? undefined,
    alternates: { canonical: `https://bestsoftplay.co.uk/guides/${guide.slug}` },
  }
}

const FALLBACK_GUIDES: Record<string, { title: string; metaDescription: string; content: string }> = {
  'best-soft-plays-south-london': {
    title: 'Best Soft Plays in South London',
    metaDescription: '18 venues reviewed and ranked across Croydon, Brixton, Greenwich, and beyond.',
    content: `South London has a fantastic range of soft play venues, from giant adventure parks to cosy toddler-friendly centres. Whether you're in Croydon, Greenwich, or Brixton, there's something for every age group.\n\nOur top picks include Kidspace Adventure Park in Croydon – one of the largest in the capital with rides, climbing frames, and a great café. For toddlers, Little Explorers in Greenwich offers a calm, well-staffed environment with dedicated baby areas.\n\nWe've visited and reviewed over 18 venues across South London to bring you this definitive guide.`,
  },
  'best-soft-plays-toddlers-london': {
    title: 'Best Soft Plays for Toddlers in London',
    metaDescription: 'Our top picks for under 2s and toddlers — safe, fun, and parent-friendly.',
    content: `Finding the right soft play for a toddler or baby can feel overwhelming – you want somewhere safe, clean, and manageable. We've done the legwork for you.\n\nThe best toddler soft play venues in London have dedicated under-2 zones, are never too loud or overwhelming, and have genuinely good coffee for parents. Our top picks include Tumble In the Jungle (Islington), Gambado Chelsea, and Little Explorers Greenwich.\n\nAll featured venues have been verified to have strong safety records and dedicated toddler areas.`,
  },
  'best-soft-plays-birmingham': {
    title: 'Best Soft Plays in Birmingham',
    metaDescription: 'A complete guide to the top indoor play centres across Greater Birmingham.',
    content: `Birmingham's indoor play scene has exploded in recent years. From massive inflatable parks to traditional soft play centres, there's a huge range of options across the city.\n\nTop picks include Inflata Nation in Acocks Green (brilliant for older kids), Funky Monkeys in Solihull (great for all ages), and Wacky Warehouse venues dotted around the suburbs.\n\nWe cover venues across Solihull, Sutton Coldfield, the City Centre, and surrounding areas.`,
  },
  'best-soft-plays-manchester': {
    title: 'Best Soft Plays in Manchester',
    metaDescription: "Manchester's finest soft play venues — perfect for rainy days with the kids.",
    content: `Manchester's famously grey weather makes it one of the best UK cities for indoor play. The soft play scene here is vibrant, with options ranging from budget-friendly local centres to premium adventure parks.\n\nOur favourites include Flip Out Manchester (trampolining and soft play combo), Partington Leisure (hidden gem in Trafford), and Tiny Feet in Salford for the littlest ones.\n\nWhether you're in Stockport, Salford, or the City Centre – we've got you covered.`,
  },
}

export default async function GuidePage({ params }: Props) {
  const dbGuide = await getGuide(params.slug)
  const fallback = FALLBACK_GUIDES[params.slug]

  if (!dbGuide && !fallback) notFound()

  const venues = await getGuideVenues(params.slug)

  const guide = dbGuide ?? {
    id: params.slug,
    slug: params.slug,
    title: fallback.title,
    metaDescription: fallback.metaDescription,
    content: fallback.content,
    publishedAt: new Date('2024-01-01'),
  }

  return (
    <>
      <Navbar />

      <div className="bg-gradient-to-b from-[#F4F3FB] to-white pt-12 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb
            crumbs={[
              { label: 'Home', href: '/' },
              { label: 'Guides', href: '/guides' },
              { label: guide.title },
            ]}
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
            {guide.title}
          </h1>
          {guide.metaDescription && (
            <p className="text-lg text-gray-500">{guide.metaDescription}</p>
          )}
          <p className="text-sm text-gray-400 mt-3">
            Published{' '}
            {guide.publishedAt.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="prose prose-gray prose-lg max-w-none">
          <LinkedGuideContent
            content={guide.content}
            venues={venues.map((v) => ({ name: v.name, href: `/${v.city.slug}/${v.area.slug}/${v.slug}` }))}
          />
        </div>

        {venues.length > 0 && (
          <div className="mt-12">
            <h2 className="font-bold text-gray-900 text-xl mb-5">Recommended venues</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {venues.map((venue, i) => (
                <VenueCard key={venue.id} venue={venue} index={i} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 p-6 bg-[#F4F3FB] rounded-2xl">
          <h2 className="font-bold text-gray-900 text-lg mb-2">Ready to explore?</h2>
          <p className="text-gray-600 text-sm mb-4">
            Browse all soft play venues with live ratings and features.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/london" className="btn-primary text-sm">
              London venues →
            </Link>
            <Link href="/birmingham" className="btn-primary text-sm" style={{ backgroundColor: '#D85A30' }}>
              Birmingham venues →
            </Link>
            <Link href="/manchester" className="btn-primary text-sm" style={{ backgroundColor: '#1D9E75' }}>
              Manchester venues →
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </>
  )
}
