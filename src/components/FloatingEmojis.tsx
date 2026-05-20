const CONFIGS = [
  // Left edge only: 2–10%
  { emoji: '🎪', left: 2,  duration: 9,  delay: 0,   },
  { emoji: '🌈', left: 6,  duration: 12, delay: 3.5, },
  { emoji: '🎈', left: 10, duration: 8,  delay: 1.8, },
  // Right edge only: 88–96%
  { emoji: '🎠', left: 88, duration: 10, delay: 2.4, },
  { emoji: '⭐', left: 92, duration: 7,  delay: 5.0, },
  { emoji: '🎉', left: 96, duration: 11, delay: 1.2, },
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
          className="absolute bottom-0 text-xl select-none"
          style={{ left: `${c.left}%`, opacity: 0.12, zIndex: 0 }}
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
