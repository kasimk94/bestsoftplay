import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How BestSoftPlay handles data — what we collect, what we don\'t, and how location search works.',
  alternates: { canonical: 'https://bestsoftplay.co.uk/privacy' },
}

const LAST_UPDATED = 'July 2026'

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <div className="bg-gradient-to-b from-[#F4F3FB] to-white pt-12 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="prose prose-gray max-w-none [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:text-lg [&>h2]:mt-8 [&>h2]:mb-3 [&>p]:text-gray-700 [&>p]:leading-relaxed [&>ul]:text-gray-700 [&>ul]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2">
          <p>
            BestSoftPlay doesn&apos;t have user accounts, logins, or profiles — there&apos;s nothing to sign up for. This
            keeps what we collect deliberately minimal. Here&apos;s exactly what happens with your data.
          </p>

          <h2>Location search (&ldquo;near me&rdquo;)</h2>
          <p>
            If you use the &ldquo;near me&rdquo; search, your browser will ask permission to share your location. If
            you allow it, we use those coordinates only to work out which venues are nearby and how far away they
            are. This happens for that search only — we don&apos;t store your location, and it isn&apos;t linked to you
            in any way.
          </p>

          <h2>Postcode search</h2>
          <p>
            If you search by postcode instead, we send it to{' '}
            <a href="https://postcodes.io" target="_blank" rel="noopener noreferrer" className="text-[#7F77DD] hover:underline">
              postcodes.io
            </a>
            , a free, open UK postcode lookup service, to convert it into coordinates for the same nearby-venue
            calculation. We don&apos;t store the postcodes you search.
          </p>

          <h2>Cookies and analytics</h2>
          <p>
            We don&apos;t currently use analytics tools, advertising cookies, or tracking scripts. If that changes in
            the future — for example, to add basic, privacy-friendly analytics — we&apos;ll update this page to say
            so.
          </p>

          <h2>Server logs</h2>
          <p>
            Like virtually any website, our hosting provider automatically logs standard technical information
            (such as IP address and browser type) for security and performance purposes. This is normal web server
            behaviour, not something we actively collect or analyse ourselves.
          </p>

          <h2>Contacting us</h2>
          <p>
            If you email us, we&apos;ll have your email address and whatever you send us, which we use only to
            respond to you. We don&apos;t add it to a mailing list or share it with anyone else.
          </p>

          <h2>Venue data</h2>
          <p>
            The venue information on this site — names, addresses, ratings, reviews, photos — comes from Google
            Places and is about businesses, not about you. It&apos;s not personal data relating to site visitors.
          </p>

          <h2>Third-party sites</h2>
          <p>
            Venue listings link out to venues&apos; own websites and to Google Maps. Once you leave BestSoftPlay,
            their own privacy policies apply, not ours.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            If how we handle data changes, we&apos;ll update this page and the &ldquo;last updated&rdquo; date above.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy? <Link href="/contact" className="text-[#7F77DD] hover:underline">Get in touch</Link>.
          </p>
        </div>
      </article>

      <Footer />
    </>
  )
}
