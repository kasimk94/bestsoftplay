import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#1a1a2a' }} className="border-t border-white/10 text-[#9ca3af]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎊</span>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">Best</span>
                <span className="text-[#7F77DD]">SoftPlay</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              The UK&apos;s most comprehensive directory of soft play venues. Helping families find perfect indoor adventures since 2024.
            </p>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Cities</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/london" className="hover:text-white transition-colors">London</Link></li>
              <li><Link href="/birmingham" className="hover:text-white transition-colors">Birmingham</Link></li>
              <li><Link href="/manchester" className="hover:text-white transition-colors">Manchester</Link></li>
            </ul>
          </div>

          {/* London areas */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">London Areas</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/london/south-london" className="hover:text-white transition-colors">South London</Link></li>
              <li><Link href="/london/north-london" className="hover:text-white transition-colors">North London</Link></li>
              <li><Link href="/london/east-london" className="hover:text-white transition-colors">East London</Link></li>
              <li><Link href="/london/west-london" className="hover:text-white transition-colors">West London</Link></li>
            </ul>
          </div>

          {/* Guides */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">Guides</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/guides/best-soft-plays-south-london" className="hover:text-white transition-colors">Best in South London</Link></li>
              <li><Link href="/guides/best-soft-plays-toddlers-london" className="hover:text-white transition-colors">Best for Toddlers</Link></li>
              <li><Link href="/guides/best-soft-plays-birmingham" className="hover:text-white transition-colors">Best in Birmingham</Link></li>
              <li><Link href="/guides/best-soft-plays-manchester" className="hover:text-white transition-colors">Best in Manchester</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} BestSoftPlay. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
