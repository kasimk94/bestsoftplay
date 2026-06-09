'use client'

import { useState, useEffect } from 'react'

const WORDS = ['little ones', 'toddlers', 'adventurers', 'little explorers', 'tiny humans']
const DISPLAY_MS = 2500
const FADE_MS = 380

export default function AnimatedWord() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      const swap = setTimeout(() => {
        setIndex(i => (i + 1) % WORDS.length)
        setVisible(true)
      }, FADE_MS)
      return () => clearTimeout(swap)
    }, DISPLAY_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(-10px)',
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
      }}
    >
      {/* Yellow marker highlight behind the text */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-4px -10px -2px -10px',
          background: 'linear-gradient(104deg, transparent 1%, #FFE066 2%, #FFE066 97%, transparent 98%)',
          borderRadius: '4px',
          transform: 'rotate(-1deg) skewX(-2deg)',
          zIndex: 0,
          opacity: 0.75,
        }}
      />
      <span style={{ position: 'relative', zIndex: 1, color: '#7F77DD' }}>
        {WORDS[index]}
      </span>
    </span>
  )
}
