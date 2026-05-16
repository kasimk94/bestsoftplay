import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const london = await prisma.city.upsert({
    where: { slug: 'london' },
    update: {},
    create: {
      name: 'London',
      slug: 'london',
      colour: '#7F77DD',
      emoji: '🏙️',
    },
  })

  const birmingham = await prisma.city.upsert({
    where: { slug: 'birmingham' },
    update: {},
    create: {
      name: 'Birmingham',
      slug: 'birmingham',
      colour: '#D85A30',
      emoji: '🏭',
    },
  })

  const manchester = await prisma.city.upsert({
    where: { slug: 'manchester' },
    update: {},
    create: {
      name: 'Manchester',
      slug: 'manchester',
      colour: '#1D9E75',
      emoji: '🌧️',
    },
  })

  const londonAreas = [
    { name: 'South London', slug: 'south-london' },
    { name: 'North London', slug: 'north-london' },
    { name: 'East London', slug: 'east-london' },
    { name: 'West London', slug: 'west-london' },
    { name: 'Central London', slug: 'central-london' },
  ]

  const birminghamAreas = [
    { name: 'City Centre', slug: 'city-centre' },
    { name: 'Solihull', slug: 'solihull' },
    { name: 'Sutton Coldfield', slug: 'sutton-coldfield' },
  ]

  const manchesterAreas = [
    { name: 'City Centre', slug: 'city-centre' },
    { name: 'Salford', slug: 'salford' },
    { name: 'Trafford', slug: 'trafford' },
    { name: 'Stockport', slug: 'stockport' },
  ]

  for (const area of londonAreas) {
    await prisma.area.upsert({
      where: { slug_cityId: { slug: area.slug, cityId: london.id } },
      update: {},
      create: { ...area, cityId: london.id },
    })
  }

  for (const area of birminghamAreas) {
    await prisma.area.upsert({
      where: { slug_cityId: { slug: area.slug, cityId: birmingham.id } },
      update: {},
      create: { ...area, cityId: birmingham.id },
    })
  }

  for (const area of manchesterAreas) {
    await prisma.area.upsert({
      where: { slug_cityId: { slug: area.slug, cityId: manchester.id } },
      update: {},
      create: { ...area, cityId: manchester.id },
    })
  }

  const southLondon = await prisma.area.findFirst({
    where: { slug: 'south-london', cityId: london.id },
  })

  if (southLondon) {
    await prisma.venue.upsert({
      where: { slug: 'kidspace-adventure-park' },
      update: {},
      create: {
        name: 'Kidspace Adventure Park',
        slug: 'kidspace-adventure-park',
        cityId: london.id,
        areaId: southLondon.id,
        address: '1 Purley Way, Croydon',
        postcode: 'CR0 4NZ',
        lat: 51.3757,
        lng: -0.1209,
        phone: '020 8686 0040',
        website: 'https://kidspace.co.uk',
        googleRating: 4.2,
        googleReviewCount: 1847,
        description:
          'A massive indoor adventure park packed with slides, climbing frames, and soft play zones for all ages. With dedicated toddler areas, a great café, and free parking, it\'s the ultimate family day out in South London.',
        ageMin: 0,
        ageMax: 12,
        priceRange: '££',
        features: ['All ages', 'Café', 'Free parking', 'Party rooms', 'Toddler zone'],
        isFeatured: true,
      },
    })
  }

  const guides = [
    {
      title: 'Best Soft Plays in South London',
      slug: 'best-soft-plays-south-london',
      content:
        'South London has some of the best soft play venues in the capital...',
      metaDescription:
        'Discover the best soft play venues in South London for kids of all ages. Our guide covers top-rated indoor play centres with reviews, prices, and opening times.',
    },
    {
      title: 'Best Soft Plays for Toddlers in London',
      slug: 'best-soft-plays-toddlers-london',
      content: 'Finding the right soft play for your toddler can be tricky...',
      metaDescription:
        'The best soft play venues in London for toddlers and under 2s. We review the safest, most fun indoor play centres with dedicated baby and toddler areas.',
    },
    {
      title: 'Best Soft Plays in Birmingham',
      slug: 'best-soft-plays-birmingham',
      content: 'Birmingham\'s indoor play scene has grown massively...',
      metaDescription:
        'Find the best soft play venues in Birmingham. Our guide covers top indoor play centres across the city with ratings, features, and what to expect.',
    },
    {
      title: 'Best Soft Plays in Manchester',
      slug: 'best-soft-plays-manchester',
      content: 'Manchester\'s rainy days are no match for these brilliant soft play venues...',
      metaDescription:
        'The best soft play venues in Manchester rated and reviewed. Find top indoor play centres across Greater Manchester for kids of all ages.',
    },
  ]

  for (const guide of guides) {
    await prisma.guide.upsert({
      where: { slug: guide.slug },
      update: {},
      create: guide,
    })
  }

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
