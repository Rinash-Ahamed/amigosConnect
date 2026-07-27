import React, { useRef } from 'react'
import { useInView } from '../hooks/useInView'

const products = [
  {
    id: 1,
    name: 'Camel Overcoat',
    category: 'Men',
    img: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=700&q=80&fit=crop',
  },
  {
    id: 2,
    name: 'Yellow Summer Dress',
    category: 'Women',
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&q=80&fit=crop',
  },
  {
    id: 3,
    name: 'Classic Denim Jacket',
    category: 'Men',
    img: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=700&q=80&fit=crop',
  },
  {
    id: 4,
    name: 'Accessories & Knits',
    category: 'Women',
    img: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=700&q=80&fit=crop',
  },
  {
    id: 5,
    name: 'Kids Utility Jacket',
    category: 'Kids',
    img: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=700&q=80&fit=crop',
  },
]

const css = `
.featured {
  padding: 0 48px 120px;
}
.featured__header {
  display: flex;
  align-items: baseline;
  gap: 24px;
  margin-bottom: 56px;
  border-top: 1px solid #1a1a1a;
  padding-top: 48px;
}
.featured__number {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: #3d3d3d;
  letter-spacing: 0.1em;
}
.featured__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 4.5vw, 56px);
  font-weight: 900;
  color: #f5f0eb;
  letter-spacing: -0.02em;
}
.featured__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
}
.product-card {
  position: relative;
  opacity: 0;
  transform: translateY(40px);
  clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
  transition: opacity 0.8s var(--ease-smooth), transform 0.8s var(--ease-smooth), clip-path 0.8s cubic-bezier(0.76,0,0.24,1);
  cursor: none;
}
.product-card.visible { 
  opacity: 1; 
  transform: translateY(0); 
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
.product-card:nth-child(2) { transition-delay: 0.1s; }
.product-card:nth-child(3) { transition-delay: 0.2s; }
.product-card:nth-child(4) { transition-delay: 0.3s; }
.product-card:nth-child(5) { transition-delay: 0.4s; }
.product-card__img-wrap {
  aspect-ratio: 2/3;
  overflow: hidden;
  position: relative;
  margin-bottom: 14px;
  background: #0f0f0f;
  border-radius: 0px;
  transition: transform 0.6s cubic-bezier(0.76,0,0.24,1);
}
.product-card:hover .product-card__img-wrap {
  transform: translateY(-8px);
}
.product-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.05) contrast(1.04) brightness(0.95);
  transition: transform 0.7s cubic-bezier(0.76,0,0.24,1), filter 0.4s;
}
.product-card:hover .product-card__img {
  transform: scale(1.05);
  filter: saturate(1.18) contrast(1.06) brightness(1);
}
.product-card__badge {
  position: absolute;
  top: 12px; left: 12px;
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #080808;
  background: #f5f0eb;
  padding: 4px 10px;
}
.product-card__brand {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: #6b6b6b;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.product-card__name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  font-weight: 500;
  color: #c4c4c4;
  margin-bottom: 6px;
  line-height: 1.3;
}
.product-card__meta {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: #6b6b6b;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

@media (max-width: 1024px) {
  .featured__grid { grid-template-columns: repeat(3, 1fr); }
  .product-card:nth-child(4), .product-card:nth-child(5) { display: none; }
}
@media (max-width: 768px) {
  .featured { padding: 0 24px 80px; }
  .featured__grid { grid-template-columns: repeat(2, 1fr); }
  .product-card:nth-child(4) { display: block; }
  .product-card:nth-child(5) { display: none; }
}
`

export default function FeaturedRow() {
  const ref = useRef(null)
  const inView = useInView(ref)

  return (
    <>
      <style>{css}</style>
      <section className="featured" ref={ref}>
        <div className="featured__header">
          <span className="featured__number">02</span>
          <h2 className="featured__title">Featured Collections</h2>
        </div>
        <div className="featured__grid">
          {products.map((p) => (
            <div key={p.id} className={`product-card${inView ? ' visible' : ''}`}>
              <div className="product-card__img-wrap">
                <img src={p.img} alt={p.name} className="product-card__img" loading="lazy" />
                <span className="product-card__badge">{p.category}</span>
              </div>
              <div className="product-card__name">{p.name}</div>
              <div className="product-card__meta">{p.category} Collection</div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
