#!/usr/bin/env node
/**
 * One-off seed for 6 guide pages: three toddler city guides, plus rainy day,
 * birthday parties, and free-vs-paid. Upserts into the Guide table, so it's
 * safe to re-run (e.g. to update copy) without creating duplicates.
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const GUIDES = [
  {
    slug: 'best-soft-plays-toddlers-london',
    title: 'Best Soft Play for Toddlers in London',
    metaDescription: 'Our pick of what actually makes a soft play venue toddler-friendly, plus London venues that stand out for under-2 provision.',
    publishedAt: new Date('2026-07-26'),
    content: `Taking a toddler to a soft play centre built for big kids can be more stressful than staying home, with bigger children barrelling down slides, ball pits designed for confident climbers, and nowhere quiet for a baby who just wants to crawl. The good news is that a growing number of London's soft play venues have recognised this and built dedicated toddler and under-2 zones, with smaller equipment, softer surfaces, and a calmer pace.

What actually makes a venue toddler-friendly? It's rarely just a sign on the door. Look for a physically separate toddler area rather than a corner roped off inside the main structure, ideally with its own small slide, soft blocks, and sensory toys rather than scaled-down versions of big-kid equipment. Non-slip padded flooring throughout matters more for toddlers than older children, since falls happen at a different height and a different frequency. A calmer noise level helps too. Venues that host large groups of primary-school-age children on weekends can be overwhelming for a one-year-old, so weekday mornings are often the better visit for this age group regardless of which venue you choose.

Staffing is worth paying attention to as well. The best toddler venues have staff who actively keep an eye on the toddler zone rather than only patrolling the main play frame, and many run structured toddler sessions, often mid-morning on weekdays, with a lower overall capacity so it doesn't turn into a scrum. If a venue publishes separate toddler session times, that's usually a good sign they've thought about this age group specifically rather than treating it as an afterthought.

Practical basics matter more with a toddler in tow than with an older child. Buggy parking near the entrance, a baby-changing table that's actually clean and stocked, somewhere to warm a bottle, and a café with a view of the toddler area so you're not craning your neck the whole visit are the details that turn a stressful outing into an easy one. Socks-only policies, sometimes with grip socks sold on-site, are near-universal at this point, so it's worth keeping a spare pair in the changing bag.

London's toddler-friendly soft play scene spans every corner of the city, from converted railway arches in East London to purpose-built centres out in the suburbs. Below are venues from our directory that stand out for toddler and baby provision specifically, based on their described facilities and consistently strong ratings from other parents. As with any venue, it's worth a quick check of opening hours before you go, since toddler-specific sessions in particular can vary week to week.

If none of these are close to you, our full London directory lets you filter by area and age range, so you can find something dedicated to under-2s within a short drive or bus ride wherever you are in the city.

One last tip worth knowing: toddler sessions and under-2 discounts are the kind of thing venues often announce on their own social media or mailing list rather than keeping permanently listed on their website, since they sometimes shift with school terms and staffing. If a venue looks promising but you can't find current toddler session times, a quick call or message usually gets you a straight answer faster than searching their site.`,
  },
  {
    slug: 'best-soft-play-toddlers-birmingham',
    title: 'Best Soft Play for Toddlers in Birmingham',
    metaDescription: "What to look for in a toddler-friendly soft play venue, plus Birmingham's best options for under-2s.",
    publishedAt: new Date('2026-07-26'),
    content: `Birmingham's soft play scene has grown fast over the past few years, and a lot of that growth has been aimed squarely at parents of toddlers and babies rather than just school-age kids. That's good news if you've ever tried to keep a wobbly one-year-old safe in a play frame designed for eight-year-olds, or spent a visit hovering anxiously at the bottom of a slide built for much bigger children.

The venues that do toddler provision well tend to share a few things. First, a genuinely separate toddler zone, not just a soft mat in the corner of the main frame, with its own small-scale slide, ball pit, and soft shapes sized for little limbs. Second, flooring and equipment padded specifically for the height and frequency of toddler tumbles, which is a different engineering problem to cushioning a seven-year-old jumping off a climbing frame. And third, a noise and pace level that doesn't overwhelm a baby who startles easily, which usually means visiting on a weekday morning rather than a Saturday afternoon.

Many of the better venues around Birmingham run dedicated toddler or baby sessions, often first thing in the morning before the venue opens to all ages, or on quieter weekday slots. These sessions cap numbers deliberately, so it's worth booking ahead if a venue offers them rather than turning up and hoping for the best. It's also worth asking whether the toddler area is supervised separately, since a single member of staff patrolling a large main structure can't realistically also be watching a baby area on the other side of the building.

The practical details matter as much as the play equipment itself. Look for buggy parking that doesn't block a fire exit, a baby-change area that's stocked and clean rather than an afterthought, and a café with sightlines into the toddler zone so you can actually relax with a coffee rather than standing over your child the whole time. Socks-only rules are standard practice almost everywhere now, and grip socks are usually available to buy on-site if you forget a pair.

Birmingham's toddler-friendly venues are spread right across the wider area, from the city centre out to Solihull and Sutton Coldfield, so there's usually somewhere reasonably close no matter which side of the city you're on. The venues below are pulled from our directory based on their described toddler and baby facilities alongside consistently strong ratings from other parents who've actually visited. Opening hours and toddler-session timings can shift, so it's always worth a quick check before you set off, especially if you're planning around a specific baby or toddler slot.

For the full spread of options, our Birmingham directory covers venues across the city centre, Solihull, Sutton Coldfield, and beyond, filterable by age range so you can narrow things down to what actually suits a toddler rather than scrolling through venues built for teenagers.

One last tip worth knowing: toddler sessions and any under-2 pricing are the kind of thing venues tend to announce through their own social media or mailing list rather than keep permanently listed on their website, since timings can shift with school terms and staffing. If a venue looks promising but you can't find current toddler session details online, a quick call usually gets you a straight answer faster than digging through their site.`,
  },
  {
    slug: 'best-soft-play-toddlers-manchester',
    title: 'Best Soft Play for Toddlers in Manchester',
    metaDescription: "What to look for in a toddler-friendly soft play venue, plus Manchester's best options for under-2s.",
    publishedAt: new Date('2026-07-26'),
    content: `Manchester's weather has a lot to answer for, but it has also produced one of the best indoor play scenes in the country, and increasingly, venues here take toddlers and babies as seriously as they take the older kids barrelling around the main frame. That matters, because a soft play centre designed purely for five-to-ten-year-olds can be a genuinely stressful place to bring a one-year-old who's just learning to walk.

The venues that get toddler provision right tend to do a few specific things. A proper toddler zone is physically separate from the main structure, not just a mat pushed into a corner, and is scaled to toddler size: a small slide rather than a big one, soft blocks instead of hard climbing frames, and sensory elements like textured panels or soft lighting. The flooring matters too. Toddlers fall differently and more often than older children, so proper cushioned flooring throughout the toddler area is worth checking for rather than assuming it's the same as the main hall.

Noise and pace are the other big factor. A venue that's brilliant for a boisterous eight-year-old's birthday party can be completely overwhelming for a baby, so weekday mornings tend to be calmer across the board regardless of venue, and many Manchester soft play centres now run dedicated baby or toddler sessions at quieter times specifically to address this. If a venue advertises separate toddler sessions, it's usually a sign they've actually thought about this age group rather than treating them as smaller versions of big kids.

Practical details are worth checking before you commit to a visit. Buggy parking that's actually accessible, a baby-change area that's stocked and clean, somewhere to warm a bottle, and a café with a clear view of the toddler zone all make the difference between a relaxing morning out and an hour of low-grade stress. Socks-only entry is close to universal now, often with grip socks for sale if you turn up without a pair.

Manchester's toddler-friendly venues are spread from the city centre out through Salford, Trafford, and Stockport, so there's usually a reasonable option wherever you're based across Greater Manchester. The venues listed below are drawn from our directory based on their described toddler and baby facilities together with consistently strong ratings from parents who've visited. Toddler session times can change, so it's worth a quick check of current opening hours before heading out, particularly if you're planning around a specific baby or toddler slot rather than general opening hours.

If you want to see everything on offer, our Manchester directory covers venues right across the city centre, Salford, Trafford, and Stockport, filterable by age range so you can find something genuinely built for toddlers rather than scrolling through venues aimed at much older kids.

One last tip worth knowing: toddler sessions and under-2 pricing are the kind of detail venues often announce through their own social media or mailing list rather than keep permanently listed on their website, since timings can shift with school terms and staffing. If a venue looks promising but you can't find current toddler session details online, a quick call usually gets you a straight answer faster than digging through their site.`,
  },
  {
    slug: 'rainy-day-indoor-soft-play-guide',
    title: 'Rainy Day Activities: Indoor Soft Play Guide',
    metaDescription: "Why soft play is the UK's go-to rainy day activity, what to look for in a venue, and tips for a smoother wet-weather visit.",
    publishedAt: new Date('2026-07-26'),
    content: `The UK gets, on average, well over a hundred days of rain a year, and anyone with young children knows exactly what that means: long stretches where the garden, the park, and the back step are all off-limits, and a house full of energy with nowhere obvious to put it. Indoor soft play exists almost entirely to solve this problem, and it's worth understanding why it works so well before you default to the same venue every single wet Saturday.

The basic appeal is simple. A good soft play centre gives children genuine physical activity, climbing, jumping, sliding, running, that would otherwise only be available outdoors, in a space that's fully weatherproof and designed to absorb the kind of boisterous play that would get a telling-off in most indoor spaces. For parents, that's the real value: a way to properly tire out a child indoors rather than watching them bounce off the walls of the living room by mid-afternoon.

What should you actually look for when picking a venue for a rainy day, as opposed to a special occasion? Capacity and variety matter more than for a quick after-school visit, since you're often looking to fill a couple of hours rather than forty-five minutes. A venue with multiple play zones, different equipment for different ages, and enough space that it doesn't feel crowded when every other parent in the postcode has had the same idea, will hold a child's attention for longer. A decent café matters too, since a rainy day out often becomes lunch or an extended stay rather than a quick visit, and you'll want somewhere you can actually sit down.

Timing makes a bigger difference on rainy days than on dry ones. Because everyone has the same idea when the weather turns, popular venues get noticeably busier on wet weekends and school holidays than on an ordinary dry Tuesday. Arriving at opening time, or checking whether a venue takes bookings, can save you from turning up to a fully packed hall. If you have a choice of ages in the family, mixed-age venues with separate zones for toddlers and older children tend to cope better with a full house than smaller single-zone venues.

A few practical habits make wet-weather visits smoother. Bring a spare set of clothes, since children get warm and often end up removing layers mid-session, and a change of socks is genuinely useful given almost every venue requires socks rather than bare feet or shoes. Layering rather than one thick coat helps too, since soft play halls tend to run warm regardless of the weather outside. And if you're driving, checking whether a venue has covered or nearby parking is worth the thirty seconds it takes, since nobody wants to arrive already soaked before you've even got through the door.

Soft play isn't just a fallback for bad weather, but it earns its reputation as the default rainy-day activity for good reason: it's reliable, it's indoors, and it tires children out properly rather than just occupying them. Our directory covers venues across London, Birmingham, and Manchester, so whatever the forecast says where you are, there's usually somewhere nearby worth checking out.`,
  },
  {
    slug: 'soft-play-birthday-parties-guide',
    title: 'Soft Play Birthday Parties: What to Look For',
    metaDescription: 'A practical guide to booking a soft play birthday party — party rooms, catering, pricing, and questions worth asking first.',
    publishedAt: new Date('2026-07-26'),
    content: `A soft play birthday party solves the two hardest problems of hosting at home: where do you put twelve excitable children, and who cleans up afterwards. Most soft play venues run parties as a core part of their business rather than an occasional extra, which means the good ones have the process down to a routine. Knowing what to ask before you book makes the difference between a smooth afternoon and a stressful one.

Start with the party room itself. Most venues offer either a dedicated party room booked alongside general access to the play area, or an exclusive hire of the whole venue outside normal opening hours, usually at a higher price. A dedicated room is normally enough for a standard party, but if you're inviting a large number of families, or want to avoid sharing the play area with the general public during your session, it's worth asking specifically whether exclusive hire is available and what it costs. Also check how long the room booking actually is: an hour of play plus half an hour in the room is a very different party to two clear hours, and venues vary a lot here.

Catering is the next thing to nail down. Some venues include food as standard in their party packages, typically sandwiches, snacks, and juice for the children, while others allow you to bring your own food, and some do both depending on the package tier. If you're bringing your own cake or food, ask explicitly whether that's allowed, since a few venues restrict outside food for hygiene or catering-contract reasons. It's also worth asking what happens with dietary requirements and allergies, since a venue that's used to handling this smoothly is generally a good sign of overall organisation.

Numbers and pricing catch people out more than anything else. Most venues price parties per child with a minimum headcount, so a party for eight children might cost the same as one for the minimum of ten or twelve. Ask what's included at the base price, what counts as an extra, and whether siblings of invited children who tag along get charged. A deposit to secure the date is standard practice, so check the deposit amount, the cancellation policy, and the final payment deadline before you commit, particularly if you're booking months in advance for a popular Saturday slot.

A few things separate a well-run soft play party from a stressful one. A dedicated party host who manages timing, brings out the food, and handles the cake moment means parents actually get to enjoy the party rather than running it themselves. Clear invitations with the right details, arrival time, party room versus general admission, and what to wear, save a lot of last-minute questions on the day. And weekend slots at popular venues get booked up months ahead, particularly around school holidays, so if you have a date in mind, it's worth enquiring earlier than feels necessary.

Every venue in our directory links through to their own website or contact details, so once you've found a few options in your area, the next step is simply getting in touch to check current availability and party packages, since these change more often than the venues' general opening hours.`,
  },
  {
    slug: 'free-vs-paid-soft-play',
    title: 'Free vs Paid Soft Play: Is It Worth It?',
    metaDescription: 'An honest look at free community soft play sessions versus paid commercial venues, and which one actually suits your family.',
    publishedAt: new Date('2026-07-26'),
    content: `Most soft play in the UK is a paid, commercial activity, but it isn't the only option, and it's worth knowing what genuinely free alternatives look like before assuming a paid venue is your only choice. The honest answer to is it worth paying depends heavily on your child's age and what you're actually looking for from the visit.

Free soft play sessions do exist, but they tend to look quite different from the big commercial centres. They're usually run by volunteers, charities, or local parent associations, often in a shared space like a youth centre or church hall rather than a purpose-built play centre, and typically follow a fixed weekly timetable rather than being open every day. RPCA Soft Play in Bermondsey, London, is a good real example: it's run by a volunteer parents' and carers' association offering free indoor soft play sessions in a sports hall, rather than a commercial venue with paid entry. Sessions like this are aimed squarely at younger children, usually under five, and the equipment tends to be simpler, more like soft shapes and a ball pit than a multi-level climbing structure with slides.

Paid venues earn their entry price through scale and facilities that are genuinely expensive to provide. Multi-level play frames, dedicated toddler zones, on-site cafés, party rooms, and staff dedicated to supervision and cleaning all cost money to run, and that's reflected in the ticket price. You're also generally paying for reliability: a commercial venue is open set hours every day of the week, rather than one session a week that depends on volunteer availability, which matters if you need somewhere to go on a random Wednesday afternoon rather than only at a fixed weekly slot.

So which is actually worth it? For very young babies who aren't yet crawling or walking confidently, a free or low-cost session with simple equipment is often genuinely just as good as an expensive commercial venue, since the baby isn't going to use a big slide or climbing frame anyway, and the social side of meeting other parents matters more than the equipment. Free sessions are also a sensible default if you're visiting often, since the cost of multiple trips a week to a paid venue adds up fast, and if the main goal is getting a baby out of the house rather than an activity in itself.

Paid venues earn their keep once children are mobile enough to actually use bigger equipment, roughly from toddler age onwards, and particularly once they want a longer session than a typical hour-long free group provides. They're also the better choice for special occasions, birthday parties, a treat day out, or when the weather is bad enough that you want somewhere with genuinely all-day capacity rather than a single morning slot.

A sensible approach for most families is to use both: free or low-cost sessions for regular week-to-week outings, especially with younger children, and paid venues for occasional bigger days out or when older children need more space and equipment than a shared hall can offer. Our directory covers both ends of that spectrum across London, Birmingham, and Manchester, so it's worth checking what's genuinely available near you before assuming a paid ticket is the only route to a good day out.`,
  },
]

async function main() {
  for (const g of GUIDES) {
    const { slug, ...data } = g
    const result = await prisma.guide.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    })
    console.log(`✅ ${result.slug} (${data.content.split(/\s+/).length} words)`)
  }
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
