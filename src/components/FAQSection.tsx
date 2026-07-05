interface FAQ { q: string; a: string }

export default function FAQSection({ faqs }: { faqs: FAQ[] }) {
  if (faqs.length === 0) return null

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-5">Frequently asked questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="group rounded-2xl border border-gray-100 overflow-hidden bg-white">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 transition-colors list-none">
              {faq.q}
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
