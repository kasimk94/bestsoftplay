import { prisma } from '@/lib/prisma'

// The toddler and city/area guides are city-specific; the other three cover
// all three cities equally (their own content says so), so they're listed
// for every city.
const CITY_GUIDE_SLUGS: Record<string, string[]> = {
  london: ['best-soft-plays-toddlers-london', 'best-soft-plays-south-london', 'rainy-day-indoor-soft-play-guide', 'soft-play-birthday-parties-guide', 'free-vs-paid-soft-play'],
  birmingham: ['best-soft-play-toddlers-birmingham', 'best-soft-plays-birmingham', 'rainy-day-indoor-soft-play-guide', 'soft-play-birthday-parties-guide', 'free-vs-paid-soft-play'],
  manchester: ['best-soft-play-toddlers-manchester', 'best-soft-plays-manchester', 'rainy-day-indoor-soft-play-guide', 'soft-play-birthday-parties-guide', 'free-vs-paid-soft-play'],
}

export async function getCityGuides(citySlug: string) {
  const slugs = CITY_GUIDE_SLUGS[citySlug] ?? []
  if (slugs.length === 0) return []
  const guides = await prisma.guide.findMany({ where: { slug: { in: slugs } } })
  const order = new Map(slugs.map((s, i) => [s, i]))
  return guides.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0))
}
