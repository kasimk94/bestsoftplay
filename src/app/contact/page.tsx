import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageHero from '@/components/PageHero'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with BestSoftPlay — report incorrect venue details, suggest a venue to add, or ask a general question.',
  alternates: { canonical: 'https://bestsoftplay.co.uk/contact' },
}

const CONTACT_EMAIL = 'hello@bestsoftplay.co.uk'

const CARD_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#F59E0B']

const REASONS = [
  {
    icon: '📍',
    title: 'Incorrect venue details',
    description: 'The venue name, city, and what\'s wrong (e.g. wrong opening hours, closed down, wrong address).',
  },
  {
    icon: '✨',
    title: 'Suggest a venue',
    description: 'The venue\'s name and location so we can look it up and add it.',
  },
  {
    icon: '💼',
    title: 'Business enquiries',
    description: 'Run a soft play venue? Update your listing or ask about featuring on the site.',
  },
  {
    icon: '💬',
    title: 'Something else',
    description: 'General feedback, bug reports, or anything else on your mind.',
  },
]

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <PageHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
        title="Get in touch"
        subtitle="Spotted something wrong, or want to tell us about a venue we're missing? We'd love to hear from you."
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Email card */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm mb-12 max-w-2xl mx-auto">
          <div
            className="h-28 flex items-center justify-center text-5xl"
            style={{ backgroundColor: CARD_COLORS[0] }}
          >
            ✉️
          </div>
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 mb-2">Email us directly at</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-2xl sm:text-3xl font-bold text-[#7F77DD] hover:underline break-all"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="text-sm text-gray-500 mt-4">We aim to reply within a few working days.</p>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center mb-2">What to include</h2>
        <p className="text-gray-500 text-center max-w-xl mx-auto mb-8">
          To help us sort your message quickly, please let us know what it&apos;s about:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {REASONS.map((reason, i) => (
            <div
              key={reason.title}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col"
            >
              <div
                className="h-20 flex items-center justify-center text-4xl"
                style={{ backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }}
              >
                {reason.icon}
              </div>
              <div className="p-6 flex-1">
                <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">{reason.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  )
}
