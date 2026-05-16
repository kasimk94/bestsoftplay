import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'BestSoftPlay – UK\'s Best Soft Play Venues',
    template: '%s | BestSoftPlay',
  },
  description:
    'Find the best soft play venues across the UK. Browse 320+ indoor play centres in London, Birmingham, and Manchester with Google ratings, features, and reviews.',
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  )
}
