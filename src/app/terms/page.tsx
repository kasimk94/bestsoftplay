import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'
import SectionCard from '@/components/SectionCard'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for BestSoftPlay, the UK soft play venue directory.',
  alternates: { canonical: 'https://bestsoftplay.co.uk/terms' },
}

const LAST_UPDATED = 'July 2026'

const COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <PageHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]}
        title="Terms of Service"
        subtitle={`Last updated: ${LAST_UPDATED}`}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-gray-700 leading-relaxed mb-8">
          These terms apply to your use of BestSoftPlay (bestsoftplay.co.uk). By using this site, you agree to
          them. If you don&apos;t agree, please don&apos;t use the site.
        </p>

        <SectionCard icon="🎪" color={COLORS[0]} title="What BestSoftPlay is">
          <p>
            BestSoftPlay is a directory of indoor soft play venues in London, Birmingham, and Manchester. We list
            venues we don&apos;t own or operate, and pull details — ratings, reviews, opening hours, photos, addresses
            — largely from Google Places and other public sources.
          </p>
        </SectionCard>

        <SectionCard icon="⚠️" color={COLORS[1]} title="Accuracy of information">
          <p>
            We do our best to keep listings accurate, but we can&apos;t guarantee that every detail is correct or
            current. Venues change their hours, prices, and facilities without telling us, and some information is
            sourced automatically and may occasionally be wrong or out of date. <strong>Always check directly with
            a venue</strong> — by phone, website, or their own social media — before making a special trip,
            especially around bank holidays and school holidays.
          </p>
        </SectionCard>

        <SectionCard icon="🛡️" color={COLORS[2]} title="No liability for third-party venues">
          <p>
            We are not responsible for the venues listed on this site: their safety standards, staff conduct,
            cleanliness, pricing, cancellation policies, or anything else that happens on their premises. Any
            booking, visit, or dispute is between you and the venue directly. We are not a party to that
            relationship and accept no liability arising from it.
          </p>
        </SectionCard>

        <SectionCard icon="🔗" color={COLORS[3]} title="External links">
          <p>
            We link to venues&apos; own websites and to third-party services (for example, Google Maps). We aren&apos;t
            responsible for the content, accuracy, or availability of external sites, and linking to them isn&apos;t
            an endorsement of everything they say.
          </p>
        </SectionCard>

        <SectionCard icon="📋" color={COLORS[0]} title="Use of the site">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the site in a way that could damage, disable, or overburden it (for example, scraping it aggressively)</li>
            <li>Attempt to gain unauthorised access to any part of the site or its underlying systems</li>
            <li>Use the site for any unlawful purpose</li>
          </ul>
        </SectionCard>

        <SectionCard icon="🎨" color={COLORS[1]} title="Intellectual property">
          <p>
            The site&apos;s design, layout, and original written content belong to BestSoftPlay. Venue photos, ratings,
            and reviews sourced from Google Places remain the property of their respective owners and are used
            under Google&apos;s terms.
          </p>
        </SectionCard>

        <SectionCard icon="🔄" color={COLORS[2]} title="Changes">
          <p>
            We may update these terms or the site itself at any time without notice. Continuing to use the site
            after changes means you accept the updated terms.
          </p>
        </SectionCard>

        <SectionCard icon="⚖️" color={COLORS[3]} title="Governing law">
          <p>These terms are governed by the laws of England and Wales.</p>
        </SectionCard>

        <SectionCard icon="✉️" color={COLORS[0]} title="Contact">
          <p>
            Questions about these terms? <Link href="/contact" className="text-[#7F77DD] hover:underline">Get in touch</Link>.
          </p>
        </SectionCard>
      </article>

      <Footer />
    </>
  )
}
