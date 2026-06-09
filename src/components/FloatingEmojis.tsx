const SCATTERED = [
  { emoji: '🎪', top: '8%',  left: '2%',   size: '2.4rem', opacity: 0.22 },
  { emoji: '⭐', top: '22%', left: '5%',   size: '1.6rem', opacity: 0.28 },
  { emoji: '🧸', top: '45%', left: '1.5%', size: '2.2rem', opacity: 0.20 },
  { emoji: '🎈', top: '68%', left: '4%',   size: '2rem',   opacity: 0.24 },
  { emoji: '🌈', top: '7%',  right: '3%',  size: '2.8rem', opacity: 0.22 },
  { emoji: '🎡', top: '28%', right: '1.5%',size: '2.4rem', opacity: 0.18 },
  { emoji: '🎠', top: '52%', right: '4%',  size: '2rem',   opacity: 0.22 },
  { emoji: '✨', top: '72%', right: '2%',  size: '1.8rem', opacity: 0.28 },
  { emoji: '⭐', top: '4%',  left: '28%',  size: '1.4rem', opacity: 0.20 },
  { emoji: '🎉', top: '4%',  right: '22%', size: '1.6rem', opacity: 0.18 },
  { emoji: '🌟', top: '85%', left: '15%',  size: '1.4rem', opacity: 0.18 },
  { emoji: '🎠', top: '82%', right: '14%', size: '1.6rem', opacity: 0.16 },
]

export default function FloatingEmojis() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {SCATTERED.map((c, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            top: c.top,
            left: 'left' in c ? (c as { left: string }).left : undefined,
            right: 'right' in c ? (c as { right: string }).right : undefined,
            fontSize: c.size,
            opacity: c.opacity,
            lineHeight: 1,
          }}
        >
          {c.emoji}
        </span>
      ))}
    </div>
  )
}
