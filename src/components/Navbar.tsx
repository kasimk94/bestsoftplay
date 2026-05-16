'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🎊</span>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gray-900">Best</span>
              <span className="text-[#7F77DD]">SoftPlay</span>
            </span>
          </Link>

          {/* Centre nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/london"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#7F77DD] transition-colors"
            >
              London
            </Link>
            <Link
              href="/birmingham"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#D85A30] transition-colors"
            >
              Birmingham
            </Link>
            <Link
              href="/manchester"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#1D9E75] transition-colors"
            >
              Manchester
            </Link>
            <button className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Near me
            </button>
            <Link
              href="/guides"
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Guides
            </Link>
          </div>

          {/* Right pill */}
          <div className="hidden md:flex items-center">
            <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              🇬🇧 UK&apos;s best
            </span>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-1">
            <Link href="/london" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">London</Link>
            <Link href="/birmingham" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Birmingham</Link>
            <Link href="/manchester" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Manchester</Link>
            <Link href="/guides" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Guides</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
