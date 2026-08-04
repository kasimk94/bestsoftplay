import type { Metadata } from 'next'
import './globals.css'
import { prisma } from '@/lib/prisma'
import CleanupBanner from '@/components/CleanupBanner'
import { SHOW_CLEANUP_BANNER } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const total = await prisma.venue.count().catch(() => 0)

  return {
    title: {
      default: 'BestSoftPlay – UK\'s Best Soft Play Venues',
      template: '%s | BestSoftPlay',
    },
    description:
      `Find the best soft play venues across the UK. Browse ${total > 0 ? `${total}+` : ''} indoor play centres in London, Birmingham, and Manchester with Google ratings, features, and reviews.`,
    metadataBase: new URL('https://bestsoftplay.co.uk'),
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      url: 'https://bestsoftplay.co.uk',
      siteName: 'BestSoftPlay',
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: 'DNOmWegkqorrLSMoDjhWTRLPUxUBZUCo8yEHIFdUczU',
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB">
      <body>
        {SHOW_CLEANUP_BANNER && <CleanupBanner />}
        {children}
      </body>
    </html>
  )
}
