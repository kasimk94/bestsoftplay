import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'
import SectionCard from '@/components/SectionCard'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How BestSoftPlay handles data — what we collect, what we don\'t, and how location search works.',
  alternates: { canonical: 'https://bestsoftplay.co.uk/privacy' },
}

const LAST_UPDATED = 'July 2026'

const COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <PageHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
        title="Privacy Policy"
        subtitle={`Last updated: ${LAST_UPDATED}`}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-gray-700 leading-relaxed mb-8">
          BestSoftPlay doesn&apos;t have user accounts, logins, or profiles — there&apos;s nothing to sign up for. This
          keeps what we collect deliberately minimal. Here&apos;s exactly what happens with your data.
        </p>

        <SectionCard icon="📍" color={COLORS[0]} title={'Location search ("near me")'}>
          <p>
            If you use the &ldquo;near me&rdquo; search, your browser will ask permission to share your location. If
            you allow it, we use those coordinates only to work out which venues are nearby and how far away they
            are. This happens for that search only — we don&apos;t store your location, and it isn&apos;t linked to you
            in any way.
          </p>
        </SectionCard>

        <SectionCard icon="🔍" color={COLORS[1]} title="Postcode search">
          <p>
            If you search by postcode instead, we send it to{' '}
            <a href="https://postcodes.io" target="_blank" rel="noopener noreferrer" className="text-[#7F77DD] hover:underline">
              postcodes.io
            </a>
            , a free, open UK postcode lookup service, to convert it into coordinates for the same nearby-venue
            calculation. We don&apos;t store the postcodes you search.
          </p>
        </SectionCard>

        <SectionCard icon="🍪" color={COLORS[2]} title="Cookies and analytics">
          <p>
            We don&apos;t currently use analytics tools, advertising cookies, or tracking scripts. If that changes in
            the future — for example, to add basic, privacy-friendly analytics — we&apos;ll update this page to say
            so.
          </p>
        </SectionCard>

        <SectionCard icon="🖥️" color={COLORS[3]} title="Server logs">
          <p>
            Like virtually any website, our hosting provider automatically logs standard technical information
            (such as IP address and browser type) for security and performance purposes. This is normal web server
            behaviour, not something we actively collect or analyse ourselves.
          </p>
        </SectionCard>

        <SectionCard icon="✉️" color={COLORS[0]} title="Contacting us">
          <p>
            If you email us, we&apos;ll have your email address and whatever you send us, which we use only to
            respond to you. We don&apos;t add it to a mailing list or share it with anyone else.
          </p>
        </SectionCard>

        <SectionCard icon="🏢" color={COLORS[1]} title="Venue data">
          <p>
            The venue information on this site — names, addresses, ratings, reviews, photos — comes from Google
            Places and is about businesses, not about you. It&apos;s not personal data relating to site visitors.
          </p>
        </SectionCard>

        <SectionCard icon="🔗" color={COLORS[2]} title="Third-party sites">
          <p>
            Venue listings link out to venues&apos; own websites and to Google Maps. Once you leave BestSoftPlay,
            their own privacy policies apply, not ours.
          </p>
        </SectionCard>

        <SectionCard icon="🔄" color={COLORS[3]} title="Changes to this policy">
          <p>
            If how we handle data changes, we&apos;ll update this page and the &ldquo;last updated&rdquo; date above.
          </p>
        </SectionCard>

        <SectionCard icon="💬" color={COLORS[0]} title="Contact">
          <p>
            Questions about this policy? <Link href="/contact" className="text-[#7F77DD] hover:underline">Get in touch</Link>.
          </p>
        </SectionCard>
      </article>

      <Footer />
    </>
  )
}
