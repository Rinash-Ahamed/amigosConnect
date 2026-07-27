import React, { useRef } from 'react'
import Link from 'next/link'
import { useInView } from '../hooks/useInView'

const css = `
.editorial {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  margin: 0;
}
.editorial__bg {
  position: absolute;
  inset: 0;
  background-image: url('https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1800&q=90&fit=crop');
  background-size: cover;
  background-position: center 30%;
  filter: grayscale(100%) contrast(1.08);
}
.editorial__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(8,8,8,0.95) 0%,
    rgba(8,8,8,0.7) 45%,
    rgba(8,8,8,0.1) 100%
  );
}
.editorial__content {
  position: relative;
  z-index: 2;
  padding: 120px 48px;
  max-width: 680px;
}
.editorial__tag {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.35em;
  color: #6b6b6b;
  text-transform: uppercase;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.editorial__tag::before {
  content: '';
  display: block;
  width: 30px;
  height: 1px;
  background: #6b6b6b;
}
.editorial__heading {
  font-family: 'Playfair Display', serif;
  font-size: clamp(42px, 7vw, 88px);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: #f5f0eb;
  margin-bottom: 24px;
}
.editorial__heading em {
  font-style: italic;
  color: #9a9a9a;
  display: block;
}
.editorial__body {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(16px, 2vw, 20px);
  font-style: italic;
  color: #9a9a9a;
  line-height: 1.65;
  margin-bottom: 24px;
  max-width: 440px;
}
.editorial__author {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  color: #6b6b6b;
  text-transform: uppercase;
  margin-bottom: 40px;
  display: block;
}
.editorial__cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 18px 40px;
  border: 1px solid #f5f0eb;
  background: transparent;
  color: #f5f0eb;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  transition: background 0.3s, color 0.3s, gap 0.3s;
  cursor: none;
}
.editorial__cta:hover {
  background: #f5f0eb;
  color: #080808;
  gap: 20px;
}
.editorial__stats {
  position: absolute;
  right: 48px;
  bottom: 80px;
  z-index: 2;
  display: flex;
  gap: 40px;
}
.editorial__stat {
  text-align: right;
}
.editorial__stat-num {
  font-family: 'Playfair Display', serif;
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 900;
  color: #f5f0eb;
  letter-spacing: -0.02em;
  display: block;
}
.editorial__stat-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: #6b6b6b;
  text-transform: uppercase;
}

.editorial__content > * {
  opacity: 0;
  transform: translateX(-24px);
  transition: opacity 0.8s var(--ease-smooth), transform 0.8s var(--ease-smooth);
}
.editorial.visible .editorial__content > * {
  opacity: 1;
  transform: translateX(0);
}
.editorial.visible .editorial__content > *:nth-child(2) { transition-delay: 0.15s; }
.editorial.visible .editorial__content > *:nth-child(3) { transition-delay: 0.3s; }
.editorial.visible .editorial__content > *:nth-child(4) { transition-delay: 0.45s; }
.editorial.visible .editorial__content > *:nth-child(5) { transition-delay: 0.6s; }

@media (max-width: 768px) {
  .editorial__content { padding: 80px 24px; }
  .editorial__stats { right: 24px; bottom: 40px; gap: 24px; }
}
`

export default function EditorialSection() {
  const ref = useRef(null)
  const inView = useInView(ref)

  return (
    <>
      <style>{css}</style>
      <section className={`editorial${inView ? ' visible' : ''}`} ref={ref}>
        <div className="editorial__bg" />
        <div className="editorial__overlay" />
        <div className="editorial__content">
          <p className="editorial__tag">Editorial - Season 2025</p>
          <h2 className="editorial__heading">
            Dress the<br />
            <em>Bold.</em>
          </h2>
          <p className="editorial__body">
            Fashion is not just clothing - it&apos;s a statement, a mood, a language. AMIGOS brings together the world&apos;s finest brands under one roof, curated for those who dare to stand out.
          </p>
        <span className="editorial__author">- Firoz Khan, Founder</span>
          <Link href="/collections" className="editorial__cta">
            Explore Campaign →
          </Link>
        </div>
        <div className="editorial__stats">
          <div className="editorial__stat">
            <span className="editorial__stat-num">50+</span>
            <span className="editorial__stat-label">Brands</span>
          </div>
          <div className="editorial__stat">
            <span className="editorial__stat-num">2K+</span>
            <span className="editorial__stat-label">Products</span>
          </div>
        </div>
      </section>
    </>
  )
}
