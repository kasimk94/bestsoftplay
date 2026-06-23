'use client'

import { useState } from 'react'

type FAQ = { q: string; a: string }

export default function CityFAQ({ cityName, faqs }: { cityName: string; faqs: FAQ[] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="py-16 px-4 relative overflow-hidden" style={{ background: '#EDE9FF' }}>
      {/* Decorative dots */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <span className="absolute top-6 left-[6%] text-xl opacity-[0.12]">✦</span>
        <span className="absolute top-12 right-[8%] text-2xl opacity-[0.10]">✶</span>
        <span className="absolute bottom-8 left-[12%] text-lg opacity-[0.10]">✦</span>
        <span className="absolute bottom-6 right-[5%] text-xl opacity-[0.12]">✶</span>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            FAQs — soft play in {cityName}
          </h2>
          <span className="text-2xl">❓</span>
        </div>
        <p className="text-gray-500 mb-10">Common questions from parents like you</p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              <button
                className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="font-bold text-gray-900 text-base leading-snug">{faq.q}</span>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EDE9FF] flex items-center justify-center text-[#7F77DD] font-bold text-lg leading-none transition-transform duration-200"
                  style={{ transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-gray-600 leading-relaxed text-sm border-t border-gray-50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
