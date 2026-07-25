import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with BestSoftPlay — report incorrect venue details, suggest a venue to add, or ask a general question.',
  alternates: { canonical: 'https://bestsoftplay.co.uk/contact' },
}

const CONTACT_EMAIL = 'hello@bestsoftplay.co.uk'

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <div className="bg-gradient-to-b from-[#F4F3FB] to-white pt-12 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
            Get in touch
          </h1>
          <p className="text-lg text-gray-500">
            Spotted something wrong, or want to tell us about a venue we&apos;re missing? We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="p-8 bg-[#F4F3FB] rounded-2xl mb-10 text-center">
          <p className="text-sm text-gray-500 mb-2">Email us directly at</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-2xl sm:text-3xl font-bold text-[#7F77DD] hover:underline break-all"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="text-sm text-gray-500 mt-4">We aim to reply within a few working days.</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <h2 className="font-bold text-gray-900 text-lg mb-2">What to include</h2>
          <p className="text-gray-700 leading-relaxed mb-5">
            To help us sort your message quickly, please let us know what it&apos;s about:
          </p>
          <ul className="text-gray-700 leading-relaxed mb-5 list-disc pl-5 space-y-2">
            <li>
              <strong>Incorrect venue details</strong> — the venue name, city, and what&apos;s wrong (e.g. wrong opening
              hours, closed down, wrong address).
            </li>
            <li>
              <strong>Suggest a venue</strong> — the venue&apos;s name and location so we can look it up.
            </li>
            <li>
              <strong>Business enquiries</strong> — if you run a soft play venue and want to update your listing or
              enquire about featuring on the site.
            </li>
            <li>
              <strong>Something else</strong> — general feedback, bug reports, or anything else on your mind.
            </li>
          </ul>
        </div>
      </article>

      <Footer />
    </>
  )
}
