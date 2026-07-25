import { prisma } from '@/lib/prisma'
import { excludeNonSoftPlay } from '@/lib/venueFilters'

export const dynamic = 'force-dynamic'

const BASE = 'https://www.bestsoftplay.co.uk'

async function getDataCoverageLine() {
  const cities = await prisma.city.findMany({
    select: { name: true, _count: { select: { venues: true } } },
    orderBy: { name: 'asc' },
  })
  const total = cities.reduce((sum, c) => sum + c._count.venues, 0)
  const breakdown = cities.map((c) => `${c._count.venues} ${c.name}`).join(', ')
  return `${total} verified soft play venues (${breakdown})`
}

const HEADER = (dataCoverageLine: string) => `# BestSoftPlay

> The UK's largest soft play directory. Helping parents find the perfect indoor play venue for their children across London, Birmingham and Manchester.

## What this site does
BestSoftPlay is a comprehensive directory of soft play venues across the UK. Parents can search by location, age range, amenities (café, parking, party rooms) and read real Google reviews. All venues include opening hours, photos, addresses and directions.

## Key pages
- Homepage: https://www.bestsoftplay.co.uk
- London soft play venues: https://www.bestsoftplay.co.uk/london
- Birmingham soft play venues: https://www.bestsoftplay.co.uk/birmingham
- Manchester soft play venues: https://www.bestsoftplay.co.uk/manchester
- Parent guides: https://www.bestsoftplay.co.uk/guides

## Data coverage
- ${dataCoverageLine}
- 3 UK cities: London, Birmingham, Manchester
- Real Google ratings and reviews
- Up-to-date opening hours
- Venue photos, addresses and postcodes
- Age range information (under 2s, 2-5 years, 5-12 years)
- Amenity filters: café, parking, party rooms, sensory play, toddler only

## London areas covered
South London, North London, East London, West London, Central London

## Birmingham areas covered
City Centre, Solihull, Sutton Coldfield, Dudley, Wolverhampton, Sandwell, Walsall

## Manchester areas covered
City Centre, Salford, Trafford, Stockport, Bolton

## How to use this data
- To find soft plays near a location, use the postcode search on any city page
- To filter by age, use the Browse by age section on city pages
- To find venues with specific amenities, use the Browse by type filters
- Individual venue pages include full details: hours, map, reviews, nearby venues

## Site technology
Built with Next.js 14, PostgreSQL database, data sourced from Google Places API with AI-generated descriptions. Updated monthly.
`

export async function GET() {
  const dataCoverageLine = await getDataCoverageLine()

  const venues = await prisma.venue.findMany({
    where: {
      AND: [...excludeNonSoftPlay(), { googleRating: { not: null } }],
    },
    select: {
      name: true,
      slug: true,
      googleRating: true,
      googleReviewCount: true,
      city: { select: { slug: true, name: true } },
      area: { select: { slug: true } },
    },
    orderBy: [
      { googleRating: 'desc' },
      { googleReviewCount: 'desc' },
    ],
    take: 50,
  })

  const lines = venues.map((v, i) => {
    const url = `${BASE}/${v.city.slug}/${v.area.slug}/${v.slug}`
    return `${i + 1}. ${v.name} — ${v.city.name} — ${v.googleRating?.toFixed(1)}★ — ${url}`
  })

  const content = `${HEADER(dataCoverageLine)}
## Top 50 highest-rated venues
${lines.join('\n')}
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
