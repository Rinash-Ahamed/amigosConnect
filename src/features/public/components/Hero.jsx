import React, { useEffect, useState } from 'react'
import Link from 'next/link'

// High quality Unsplash fashion images
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1600&q=90&fit=crop&auto=format&sat=10',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=90&fit=crop&auto=format&sat=10',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1600&q=90&fit=crop&auto=format&sat=10',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=90&fit=crop&auto=format&sat=10',
  'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=1600&q=90&fit=crop&auto=format&sat=10',
]

const HERO_TEXTS = [
  ['Wear', 'Your', 'Story.'],
  ['Define', 'Your', 'Style.'],
  ['Elevate', 'Every', 'Look.'],
  ['Own', 'The', 'Moment.'],
  ['Bold', 'And', 'Classic.'],
]

const css = `
.hero {
  position: relative;
  height: 100svh;
  min-height: 600px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  padding-top: 112px;
  padding-bottom: 80px;
}
.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.hero__slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: opacity 1.2s cubic-bezier(0.76,0,0.24,1), transform 8s linear;
  transform: scale(1.08);
  filter: saturate(1.08) contrast(1.04) brightness(0.92);
}
.hero__slide.active {
  opacity: 1;
  transform: scale(1);
}
.hero__slide:not(.active) {
  opacity: 0;
}
.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(8,8,8,0.92) 0%,
    rgba(8,8,8,0.48) 42%,
    rgba(8,8,8,0.42) 78%,
    rgba(8,8,8,0.72) 100%
  );
  z-index: 1;
}
.hero__content {
  position: relative;
  z-index: 2;
  padding: 0 48px;
  width: 100%;
  padding-top: 32px;
}
.hero__eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.3em;
  color: #9a9a9a;
  text-transform: uppercase;
  margin-bottom: 16px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.8s 0.4s var(--ease-smooth) forwards;
}
.hero__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(48px, 9vw, 118px);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.03em;
  color: #f5f0eb;
  margin-bottom: 24px;
}
.hero__title .line {
  display: block;
  overflow: hidden;
}
.hero__title .line span {
  display: block;
  opacity: 0;
  transform: translateY(100%);
  animation: slideUp 0.9s var(--ease-cinematic) forwards;
}
.hero__title .line:nth-child(1) span { animation-delay: 0.2s; }
.hero__title .line:nth-child(2) span { animation-delay: 0.35s; }
.hero__title .line:nth-child(3) span { animation-delay: 0.5s; }
.hero__sub {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(16px, 2.5vw, 22px);
  font-style: italic;
  color: #9a9a9a;
  max-width: 440px;
  line-height: 1.5;
  margin-bottom: 40px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.8s 0.7s var(--ease-smooth) forwards;
}
.hero__actions {
  display: flex;
  align-items: center;
  gap: 32px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.8s 0.9s var(--ease-smooth) forwards;
}
.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 16px 36px;
  border: 1px solid #f5f0eb;
  color: #f5f0eb;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: background 0.3s, color 0.3s;
  cursor: none;
}
.hero__cta:hover {
  background: #f5f0eb;
  color: #080808;
}
.hero__cta-ghost {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  color: #6b6b6b;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.3s;
}
.hero__cta-ghost:hover { color: #f5f0eb; }
.hero__pagination {
  position: absolute;
  right: 48px;
  bottom: 80px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hero__dot {
  width: 2px;
  height: 20px;
  background: #3d3d3d;
  transition: height 0.3s, background 0.3s;
  cursor: none;
}
.hero__dot.active {
  height: 40px;
  background: #f5f0eb;
}
.hero__scroll-hint {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  animation: fadeUp 0.8s 1.2s ease forwards;
}
.hero__scroll-line {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, #f5f0eb, transparent);
  animation: scrollPulse 2s ease-in-out infinite;
}
.hero__scroll-text {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: #6b6b6b;
  writing-mode: vertical-rl;
  text-transform: uppercase;
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scrollPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@media (max-width: 768px) {
  .hero__content { padding: 0 24px; }
  .hero__pagination { right: 24px; bottom: 60px; }
  .hero__actions { flex-direction: column; align-items: flex-start; gap: 16px; }
  .hero { padding-top: 104px; padding-bottom: 60px; }
  .hero__title { font-size: clamp(48px, 18vw, 86px); }
}
`

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [loadedSlides, setLoadedSlides] = useState(() => new Set([0]))

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const nextSlide = (activeSlide + 1) % HERO_IMAGES.length
    const image = new window.Image()
    image.onload = () => {
      setLoadedSlides(current => {
        if (current.has(nextSlide)) return current
        return new Set([...current, nextSlide])
      })
    }
    image.src = HERO_IMAGES[nextSlide]
    return () => {
      image.onload = null
    }
  }, [activeSlide])

  return (
    <>
      <style>{css}</style>
      <section className="hero">
        <div className="hero__bg">
          {HERO_IMAGES.map((img, i) => (
            <div
              key={i}
              className={`hero__slide${i === activeSlide ? ' active' : ''}`}
              style={{
                backgroundImage: loadedSlides.has(i) || i === activeSlide
                  ? `url(${img})`
                  : 'none',
              }}
            />
          ))}
          <div className="hero__overlay" />
        </div>

        <div className="hero__content">
          <p className="hero__eyebrow">Indian Multi-Brand Collections</p>
          <h1 className="hero__title">
            <span className="line">
              <span key={`w1-${activeSlide}`}>{HERO_TEXTS[activeSlide % HERO_TEXTS.length][0]}</span>
            </span>
            <span className="line">
              <span key={`w2-${activeSlide}`}>{HERO_TEXTS[activeSlide % HERO_TEXTS.length][1]}</span>
            </span>
            <span className="line">
              <span key={`w3-${activeSlide}`}>{HERO_TEXTS[activeSlide % HERO_TEXTS.length][2]}</span>
            </span>
          </h1>
          <p className="hero__sub">
            Curated fashion for every story - Men, Women &amp; Kids.
          </p>
          <div className="hero__actions">
            <Link href="/collections" className="hero__cta">
              Explore Collections
              <span style={{ fontSize: '16px' }}>→</span>
            </Link>
            <Link href="/about" className="hero__cta-ghost">Our Story</Link>
          </div>
        </div>

        <div className="hero__pagination">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              className={`hero__dot${i === activeSlide ? ' active' : ''}`}
              onClick={() => setActiveSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="hero__scroll-hint">
          <span className="hero__scroll-text">Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </section>
    </>
  )
}
