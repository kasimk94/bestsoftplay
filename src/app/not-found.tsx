import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-8xl mb-6">🎪</div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Page not found</h1>
          <p className="text-gray-500 text-lg mb-8">
            We couldn&apos;t find that venue or page. Try exploring by city instead.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary">Back to home</Link>
            <Link href="/london" className="btn-primary" style={{ backgroundColor: '#7F77DD' }}>Browse London</Link>
            <Link href="/guides" className="btn-primary" style={{ backgroundColor: '#1D9E75' }}>Read guides</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
