'use client'

import { useEffect, useState } from 'react'

const DISMISS_KEY = 'bsp_cleanup_banner_dismissed_v1'

export default function CleanupBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
  }

  if (!visible) return null

  return (
    <div
      role="status"
      className="relative px-10 py-2.5 sm:py-2 text-white shadow-sm"
      style={{ background: 'linear-gradient(90deg, #7F77DD 0%, #D85A30 100%)' }}
    >
      <p className="max-w-3xl mx-auto text-center text-xs sm:text-sm font-medium leading-snug">
        We&apos;re busy giving our venue photos a glow-up! 🧸✨ Some images might look a little
        different over the next few days as we make sure every listing shows its best side.
        Thanks for bearing with us!
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
