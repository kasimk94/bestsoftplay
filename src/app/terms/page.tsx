import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for BestSoftPlay, the UK soft play venue directory.',
  alternates: { canonical: 'https://bestsoftplay.co.uk/terms' },
}

const LAST_UPDATED = 'July 2026'

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <div className="bg-gradient-to-b from-[#F4F3FB] to-white pt-12 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]} />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="prose prose-gray max-w-none [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:text-lg [&>h2]:mt-8 [&>h2]:mb-3 [&>p]:text-gray-700 [&>p]:leading-relaxed [&>ul]:text-gray-700 [&>ul]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2">
          <p>
            These terms apply to your use of BestSoftPlay (bestsoftplay.co.uk). By using this site, you agree to
            them. If you don&apos;t agree, please don&apos;t use the site.
          </p>

          <h2>What BestSoftPlay is</h2>
          <p>
            BestSoftPlay is a directory of indoor soft play venues in London, Birmingham, and Manchester. We list
            venues we don&apos;t own or operate, and pull details — ratings, reviews, opening hours, photos, addresses
            — largely from Google Places and other public sources.
          </p>

          <h2>Accuracy of information</h2>
          <p>
            We do our best to keep listings accurate, but we can&apos;t guarantee that every detail is correct or
            current. Venues change their hours, prices, and facilities without telling us, and some information is
            sourced automatically and may occasionally be wrong or out of date. <strong>Always check directly with
            a venue</strong> — by phone, website, or their own social media — before making a special trip,
            especially around bank holidays and school holidays.
          </p>

          <h2>No liability for third-party venues</h2>
          <p>
            We are not responsible for the venues listed on this site: their safety standards, staff conduct,
            cleanliness, pricing, cancellation policies, or anything else that happens on their premises. Any
            booking, visit, or dispute is between you and the venue directly. We are not a party to that
            relationship and accept no liability arising from it.
          </p>

          <h2>External links</h2>
          <p>
            We link to venues&apos; own websites and to third-party services (for example, Google Maps). We aren&apos;t
            responsible for the content, accuracy, or availability of external sites, and linking to them isn&apos;t
            an endorsement of everything they say.
          </p>

          <h2>Use of the site</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the site in a way that could damage, disable, or overburden it (for example, scraping it aggressively)</li>
            <li>Attempt to gain unauthorised access to any part of the site or its underlying systems</li>
            <li>Use the site for any unlawful purpose</li>
          </ul>

          <h2>Intellectual property</h2>
          <p>
            The site&apos;s design, layout, and original written content belong to BestSoftPlay. Venue photos, ratings,
            and reviews sourced from Google Places remain the property of their respective owners and are used
            under Google&apos;s terms.
          </p>

          <h2>Changes</h2>
          <p>
            We may update these terms or the site itself at any time without notice. Continuing to use the site
            after changes means you accept the updated terms.
          </p>

          <h2>Governing law</h2>
          <p>These terms are governed by the laws of England and Wales.</p>

          <h2>Contact</h2>
          <p>
            Questions about these terms? <Link href="/contact" className="text-[#7F77DD] hover:underline">Get in touch</Link>.
          </p>
        </div>
      </article>

      <Footer />
    </>
  )
}
