'use client'

import { useEffect, useRef, useState } from 'react'

interface ShareButtonProps {
  name: string
  url: string
}

export default function ShareButton({ name, url }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const shareText = `Check out ${name} on BestSoftPlay - ${url}`

  const handleClick = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: name, text: `Check out ${name} on BestSoftPlay`, url })
      } catch {
        // user cancelled — no-op
      }
      return
    }
    setOpen((v) => !v)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    setOpen(false)
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    )
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
      >
        Share 📤
      </button>

      {open && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 z-30 w-48 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            📋 {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            onClick={shareWhatsApp}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            💬 Share on WhatsApp
          </button>
          <button
            onClick={shareFacebook}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            📘 Share on Facebook
          </button>
        </div>
      )}
    </div>
  )
}
