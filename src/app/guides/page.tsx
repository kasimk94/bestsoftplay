import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Parent Guides – Best Soft Play UK',
  description:
    'Expert guides to help you find the best soft play venues across the UK. Curated lists for every age group, city, and occasion.',
  alternates: { canonical: 'https://bestsoftplay.co.uk/guides' },
}

const GUIDE_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']
const GUIDE_EMOJIS = ['🗺️', '👶', '🏙️', '🌧️']

async function getGuides() {
  try {
    return await prisma.guide.findMany({
      orderBy: { publishedAt: 'desc' },
    })
  } catch {
    return []
  }
}

const FALLBACK_GUIDES = [
  {
    id: '1',
    slug: 'best-soft-plays-south-london',
    title: 'Best Soft Plays in South London',
    metaDescription: '18 venues reviewed and ranked across Croydon, Brixton, Greenwich, and beyond.',
    publishedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    slug: 'best-soft-plays-toddlers-london',
    title: 'Best Soft Plays for Toddlers in London',
    metaDescription: 'Our top picks for under 2s and toddlers — safe, fun, and parent-friendly.',
    publishedAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    slug: 'best-soft-plays-birmingham',
    title: 'Best Soft Plays in Birmingham',
    metaDescription: 'A complete guide to the top indoor play centres across Greater Birmingham.',
    publishedAt: new Date('2024-02-15'),
  },
  {
    id: '4',
    slug: 'best-soft-plays-manchester',
    title: 'Best Soft Plays in Manchester',
    metaDescription: 'Manchester\'s finest soft play venues — perfect for rainy days with the kids.',
    publishedAt: new Date('2024-03-01'),
  },
]

export default async function GuidesPage() {
  const dbGuides = await getGuides()
  const guides = dbGuides.length > 0 ? dbGuides : FALLBACK_GUIDES

  return (
    <>
      <Navbar />

      <div className="bg-gradient-to-b from-[#F4F3FB] to-white pt-14 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
            Parent <span className="text-[#7F77DD]">guides</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Expert-curated guides to the UK&apos;s best soft play venues — by city, age group, and occasion.
          </p>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {guides.map((guide, i) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
              {/* Coloured top */}
              <div
                className="h-28 flex items-center justify-center text-5xl"
                style={{ backgroundColor: GUIDE_COLORS[i % GUIDE_COLORS.length] }}
              >
                {GUIDE_EMOJIS[i % GUIDE_EMOJIS.length]}
              </div>

              <div className="p-6 flex-1">
                <h2 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-[#7F77DD] transition-colors mb-2">
                  {guide.title}
                </h2>
                {guide.metaDescription && (
                  <p className="text-sm text-gray-500 leading-relaxed">{guide.metaDescription}</p>
                )}
                <div className="mt-4 text-[#7F77DD] text-sm font-semibold group-hover:underline">
                  Read guide →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}
