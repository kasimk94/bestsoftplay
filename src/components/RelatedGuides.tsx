import Link from 'next/link'

interface GuideSummary {
  slug: string
  title: string
  metaDescription: string | null
}

interface RelatedGuidesProps {
  guides: GuideSummary[]
  heading?: string
}

export default function RelatedGuides({ guides, heading = 'You might also like these guides' }: RelatedGuidesProps) {
  if (guides.length === 0) return null

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-4">{heading}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group bg-[#F4F3FB] rounded-2xl p-5 hover:bg-[#EDE9FF] transition-colors"
          >
            <h3 className="font-bold text-gray-900 leading-snug group-hover:text-[#7F77DD] transition-colors mb-1.5">
              {guide.title}
            </h3>
            {guide.metaDescription && <p className="text-sm text-gray-500 leading-relaxed">{guide.metaDescription}</p>}
            <span className="inline-block mt-3 text-[#7F77DD] text-sm font-semibold group-hover:underline">
              Read guide →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
