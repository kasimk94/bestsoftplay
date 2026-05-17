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
      // Fade out + slide up
      setVisible(false)

      const swap = setTimeout(() => {
        setIndex(i => (i + 1) % WORDS.length)
        // Fade in
        setVisible(true)
      }, FADE_MS)

      return () => clearTimeout(swap)
    }, DISPLAY_MS)

    return () => clearInterval(interval)
  }, [])

  return (
    <span
      style={{
        color: '#7F77DD',
        display: 'inline-block',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(-10px)',
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
      }}
    >
      {WORDS[index]}
    </span>
  )
}
