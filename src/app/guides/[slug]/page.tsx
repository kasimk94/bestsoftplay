import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import { prisma } from '@/lib/prisma'

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
          {guide.content.split('\n\n').map((para, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-5">
              {para}
            </p>
          ))}
        </div>

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
