// Left column: 0–8% | Right column: 92–100%
// Nothing in between so emojis never touch the centre headline/search area.
const CONFIGS = [
  // Left edge
  { emoji: '🎪', left: 1,  duration: 9,  delay: 0,   opacity: 0.12 },
  { emoji: '🌈', left: 5,  duration: 7,  delay: 3.5, opacity: 0.12 },
  { emoji: '🎈', left: 3,  duration: 12, delay: 1.8, opacity: 0.12 },
  { emoji: '⭐', left: 7,  duration: 10, delay: 5.2, opacity: 0.12 },
  { emoji: '🎉', left: 2,  duration: 8,  delay: 2.6, opacity: 0.12 },
  // Right edge
  { emoji: '🎠', left: 93, duration: 8,  delay: 2.4, opacity: 0.12 },
  { emoji: '🏰', left: 97, duration: 6,  delay: 1.2, opacity: 0.12 },
  { emoji: '🎯', left: 95, duration: 9,  delay: 4.8, opacity: 0.12 },
  { emoji: '⭐', left: 99, duration: 11, delay: 0.8, opacity: 0.12 },
  { emoji: '🎪', left: 91, duration: 13, delay: 3.0, opacity: 0.12 },
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
          style={{
            left: `${c.left}%`,
            opacity: c.opacity,
            zIndex: 0,
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
