// All left values kept to 0-15% (left edge) or 85-100% (right edge)
// so emojis never drift through the centre where the headline/search bar sit.
const CONFIGS = [
  { emoji: '🎪', left: 3,  duration: 9,  delay: 0,   maxOpacity: 0.18 },
  { emoji: '🎈', left: 10, duration: 12, delay: 1.8, maxOpacity: 0.15 },
  { emoji: '🌈', left: 7,  duration: 7,  delay: 3.5, maxOpacity: 0.20 },
  { emoji: '⭐', left: 13, duration: 10, delay: 0.6, maxOpacity: 0.22 },
  { emoji: '🎠', left: 87, duration: 8,  delay: 2.4, maxOpacity: 0.16 },
  { emoji: '🎉', left: 93, duration: 11, delay: 4.2, maxOpacity: 0.18 },
  { emoji: '🏰', left: 97, duration: 6,  delay: 1.2, maxOpacity: 0.15 },
  { emoji: '🎯', left: 90, duration: 9,  delay: 5.0, maxOpacity: 0.20 },
  { emoji: '⭐', left: 5,  duration: 13, delay: 2.8, maxOpacity: 0.14 },
  { emoji: '🎪', left: 85, duration: 8,  delay: 0.3, maxOpacity: 0.17 },
]

export default function FloatingEmojis() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {CONFIGS.map((c, i) => (
        <div
          key={i}
          className="absolute bottom-0 text-2xl select-none"
          style={{
            left: `${c.left}%`,
            opacity: c.maxOpacity,
          }}
        >
          <span
            style={{
              display: 'block',
              animation: `floatUp ${c.duration}s ${c.delay}s ease-in infinite`,
            }}
          >
            {c.emoji}
          </span>
        </div>
      ))}
    </div>
  )
}
