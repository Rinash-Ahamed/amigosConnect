import React, { useEffect, useState } from 'react'

const styles = {
  loader: {
    position: 'fixed',
    inset: 0,
    background: '#080808',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filmStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '12px',
    background: 'repeating-linear-gradient(90deg, transparent, transparent 18px, #1a1a1a 18px, #1a1a1a 36px)',
    borderBottom: '1px solid #2a2a2a',
  },
  filmStripBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '12px',
    background: 'repeating-linear-gradient(90deg, transparent, transparent 18px, #1a1a1a 18px, #1a1a1a 36px)',
    borderTop: '1px solid #2a2a2a',
  },
  counter: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 'clamp(80px, 18vw, 180px)',
    fontWeight: 700,
    color: '#f5f0eb',
    lineHeight: 1,
    letterSpacing: '-0.06em',
    userSelect: 'none',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  brandLogo: {
    width: '72px',
    height: '72px',
    display: 'block',
    objectFit: 'contain',
    borderRadius: '20px',
    border: '1px solid rgba(245, 240, 235, 0.16)',
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.45)',
  },
  brandName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(24px, 5vw, 48px)',
    fontWeight: 900,
    letterSpacing: '0.14em',
    color: '#f5f0eb',
    textTransform: 'uppercase',
  },
  bar: {
    position: 'absolute',
    bottom: '40px',
    left: '10%',
    right: '10%',
    height: '1px',
    background: '#1a1a1a',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: '#f5f0eb',
    transition: 'width 0.1s linear',
  },
  vignette: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, #080808 100%)',
    pointerEvents: 'none',
  }
}

export default function Loader({ onComplete }) {
  const [count, setCount] = useState(5)
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const total = 2200
    const startTime = Date.now()

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setProgress(Math.min((elapsed / total) * 100, 100))
    }, 30)

    const countInterval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(countInterval)
          return 0
        }
        return prev - 1
      })
    }, 400)

    const timer = setTimeout(() => {
      clearInterval(progressInterval)
      setExiting(true)
      setTimeout(onComplete, 600)
    }, total)

    return () => {
      clearTimeout(timer)
      clearInterval(progressInterval)
      clearInterval(countInterval)
    }
  }, [onComplete])

  return (
    <div
      style={{
        ...styles.loader,
        clipPath: exiting ? 'inset(0 0 100% 0)' : 'inset(0 0 0% 0)',
        transition: exiting ? 'clip-path 0.7s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
      }}
    >
      <div style={styles.filmStrip} />
      <div style={styles.filmStripBottom} />
      <div style={styles.vignette} />
      <div style={styles.counter}>{count}</div>
      <div style={styles.brand}>
        <img style={styles.brandLogo} src="/fashion-logo.png" alt="AMIGOS" />
        <span style={styles.brandName}>AMIGOS</span>
      </div>
      <div style={styles.bar}>
        <div style={{ ...styles.barFill, width: `${progress}%` }} />
      </div>
    </div>
  )
}
