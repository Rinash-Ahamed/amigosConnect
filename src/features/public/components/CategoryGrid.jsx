import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useInView } from '../hooks/useInView'

const categoryImageConfig = {
  w: 900,
  q: 88,
  fit: 'crop',
  sat: 18,
}

const categoryImageUrl = (src, config = {}) => {
  const params = new URLSearchParams({ ...categoryImageConfig, ...config })
  return `${src}?${params.toString()}`
}

const categories = [
  {
    label: 'Men',
    sub: 'Suits - Shirts - Jeans',
    images: [
      { src: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc', config: { sat: 16 } },
      { src: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf', config: { sat: 14 } },
      { src: 'https://images.unsplash.com/photo-1542272604-787c3835535d' },

    ],
    accent: '#c4c4c4',
  },
  {
    label: 'Women',
    sub: 'Western - Ethnic - Denims',
    images: [
      { src: 'https://images.unsplash.com/photo-1525845859779-54d477ff291f' },
      { src: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0' },
      { src: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3' },
    ],
    imageLabels: ['western', 'ethnic', 'denims'],
    accent: '#e8ddd0',
  },
  {
    label: 'Kids',
    sub: 'Casual - Activewear - Ethnic',
    images: [
      { src: 'https://images.unsplash.com/photo-1578897367107-2828e351c8a8' },
      { src: 'https://images.unsplash.com/photo-1622822460513-d007dd13580d' },
      { src: 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c' },
    ],
    imageLabels: ['casual', 'schoolwear', 'ethnic'],
    accent: '#9a9a9a',
  },
]

const css = `
.categories {
  padding: 120px 48px;
}
.categories__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 64px;
}
.categories__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(36px, 6vw, 72px);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: #f5f0eb;
}
.categories__title em {
  font-style: italic;
  color: #6b6b6b;
}
.categories__view-all {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: #6b6b6b;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.3s;
  white-space: nowrap;
  margin-bottom: 8px;
}
.categories__view-all:hover { color: #f5f0eb; }
.categories__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.cat-card {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3/4;
  cursor: none;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s var(--ease-smooth), transform 0.8s var(--ease-smooth);
}
.cat-card.visible {
  opacity: 1;
  transform: translateY(0);
}
.cat-card:nth-child(2) { transition-delay: 0.15s; }
.cat-card:nth-child(3) { transition-delay: 0.3s; }
.cat-card__media {
  position: absolute;
  inset: 0;
  perspective: 1200px;
  background: #0f0f0f;
}
.cat-card__img {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.06) contrast(1.04) brightness(0.94);
  transition: opacity 0.9s var(--ease-smooth), transform 1.2s var(--ease-cinematic), filter 0.5s;
  transform-origin: center;
  transform: scale(1.035);
}
.cat-card:hover .cat-card__img {
  transform: scale(1.06);
  filter: saturate(1.2) contrast(1.08) brightness(0.98);
}
.cat-card__img.active,
.cat-card__img.previous {
  opacity: 1;
}
.cat-card__img.active {
  z-index: 2;
  transform: scale(1);
}
.cat-card__img.previous {
  z-index: 1;
}
.cat-card.flipping .cat-card__img.active {
  animation: categoryReveal 1.1s var(--ease-cinematic);
}
.cat-card:hover .cat-card__img.active,
.cat-card:hover .cat-card__img.previous {
  filter: saturate(1.2) contrast(1.08) brightness(0.98);
}
.cat-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.1) 50%, transparent 100%);
  transition: background 0.4s;
}
.cat-card:hover .cat-card__overlay {
  background: linear-gradient(to top, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.3) 60%, rgba(8,8,8,0.05) 100%);
}
.cat-card__info {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 32px 28px;
}
.cat-card__label {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 900;
  color: #f5f0eb;
  letter-spacing: -0.02em;
  line-height: 1;
  margin-bottom: 6px;
}
.cat-card__sub {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.15em;
  color: #9a9a9a;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.cat-card__btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px;
  border: 1px solid rgba(245,240,235,0.4);
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f5f0eb;
  transform: translateY(12px);
  opacity: 0;
  transition: transform 0.4s var(--ease-smooth), opacity 0.4s, background 0.3s, border-color 0.3s;
}
.cat-card:hover .cat-card__btn {
  transform: translateY(0);
  opacity: 1;
  background: rgba(245,240,235,0.08);
  border-color: rgba(245,240,235,0.8);
}

@keyframes categoryReveal {
  0% {
    opacity: 0;
    transform: scale(1.045);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cat-card.flipping .cat-card__img.active {
    animation: none;
  }
}

@media (max-width: 768px) {
  .categories { padding: 80px 24px; }
  .categories__grid { grid-template-columns: 1fr; gap: 2px; }
  .cat-card { aspect-ratio: 4/3; }
  .categories__header { flex-direction: column; align-items: flex-start; gap: 16px; margin-bottom: 40px; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .categories__grid { grid-template-columns: repeat(3, 1fr); }
}
`

export default function CategoryGrid() {
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.1 })
  const sequenceStep = useRef(0)
  const [activeCard, setActiveCard] = useState(null)
  const [imageIndexes, setImageIndexes] = useState(() => categories.map(() => 0))
  const [previousIndexes, setPreviousIndexes] = useState(() => categories.map(() => 0))
  const imageIndexesRef = useRef(imageIndexes)

  useEffect(() => {
    const interval = setInterval(() => {
      const cardIndex = sequenceStep.current % categories.length

      setPreviousIndexes(prev => {
        const next = [...prev]
        next[cardIndex] = imageIndexesRef.current[cardIndex]
        return next
      })

      setImageIndexes(prev => {
        const next = [...prev]
        next[cardIndex] = (prev[cardIndex] + 1) % categories[cardIndex].images.length
        imageIndexesRef.current = next
        return next
      })

      setActiveCard(cardIndex)
      sequenceStep.current += 1
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <style>{css}</style>
      <section className="categories" ref={sectionRef}>
        <div className="categories__header">
          <h2 className="categories__title">
            Explore by<br /><em>Category</em>
          </h2>
          <Link href="/collections" className="categories__view-all">View all</Link>
        </div>
        <div className="categories__grid">
          {categories.map((cat, i) => (
            <Link
              href="/collections"
              key={i}
              className={`cat-card${inView ? ' visible' : ''}${activeCard === i ? ' flipping' : ''}`}
            >
              <div className="cat-card__media">
                {(cat.images || [cat.img]).map((image, imageIndex) => {
                  const img = typeof image === 'string' ? image : categoryImageUrl(image.src, image.config)

                  return (
                    <img
                      key={img}
                      src={img}
                      alt={cat.images ? `${cat.label} ${(cat.imageLabels || ['suits', 'shirts', 'jeans'])[imageIndex]} collection` : cat.label}
                      className={`cat-card__img${imageIndexes[i] === imageIndex ? ' active' : ''}${activeCard === i && previousIndexes[i] === imageIndex ? ' previous' : ''}`}
                      loading="lazy"
                    />
                  )
                })}
              </div>
              <div className="cat-card__overlay" />
              <div className="cat-card__info">
                <div className="cat-card__label">{cat.label}</div>
                <div className="cat-card__sub">{cat.sub}</div>
                <span className="cat-card__btn">
                  Explore
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
