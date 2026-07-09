const CONTENT = `# BestSoftPlay

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
- 1,000+ verified soft play venues
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
  return new Response(CONTENT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
