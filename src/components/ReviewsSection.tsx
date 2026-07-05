'use client'

import { useState } from 'react'

export interface VenueReview {
  authorName: string
  rating: number
  text: string
  relativeTime: string
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm tracking-tight" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(Math.round(rating))}
      <span className="text-gray-200">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  )
}

function ReviewCard({ review }: { review: VenueReview }) {
  const [expanded, setExpanded] = useState(false)
  const initial = review.authorName.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-[#7F77DD] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          {initial}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">{review.authorName}</p>
          <p className="text-xs text-gray-400">{review.relativeTime}</p>
        </div>
      </div>
      <Stars rating={review.rating} />
      <p className={`text-sm text-gray-600 leading-relaxed mt-2 ${expanded ? '' : 'line-clamp-3'}`}>
        {review.text}
      </p>
      {review.text.length > 160 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-[#7F77DD] mt-2 hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

export default function ReviewsSection({ reviews }: { reviews: VenueReview[] }) {
  if (reviews.length === 0) return null

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-5">What parents are saying</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reviews.map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
      </div>
    </section>
  )
}
