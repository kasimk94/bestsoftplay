import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE = 'https://bestsoftplay.co.uk'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/guides`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/london`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/birmingham`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/manchester`, changeFrequency: 'daily', priority: 0.9 },
  ]

  try {
    const venues = await prisma.venue.findMany({
      include: { city: true, area: true },
    })

    for (const venue of venues) {
      routes.push({
        url: `${BASE}/${venue.city.slug}/${venue.area.slug}/${venue.slug}`,
        lastModified: venue.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }

    const areas = await prisma.area.findMany({
      include: { city: true },
    })

    for (const area of areas) {
      routes.push({
        url: `${BASE}/${area.city.slug}/${area.slug}`,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    const guides = await prisma.guide.findMany({
      select: { slug: true, publishedAt: true },
    })

    for (const guide of guides) {
      routes.push({
        url: `${BASE}/guides/${guide.slug}`,
        lastModified: guide.publishedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch {
    // DB not connected yet — return static routes only
  }

  return routes
}
