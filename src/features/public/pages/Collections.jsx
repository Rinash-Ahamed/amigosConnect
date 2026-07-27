"use client";

import React, { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useInView } from '../hooks/useInView'
import Footer from '../components/Footer'

const productImageConfig = {
  w: 600,
  q: 88,
  fit: 'crop',
  sat: 18,
}

const collectionHeroImageConfig = {
  w: 1600,
  q: 90,
  fit: 'crop',
}

const unsplashUrl = (src, config = productImageConfig) => {
  const params = new URLSearchParams(config)
  return `${src}?${params.toString()}`
}

const productImageUrl = (src, config = {}) => (
  unsplashUrl(src, { ...productImageConfig, ...config })
)

const ALL_PRODUCTS = [
  { id: 1, name: 'Chudidhar', cat: 'Women', img: 'https://images.unsplash.com/photo-1602210666042-4d76a62d6fcb' },
  { id: 2, name: 'Cords Set', cat: 'Women', img: 'https://plus.unsplash.com/premium_photo-1771426603537-fcce03387547', imageConfig: { sat: 20 } },
  { id: 3, name: 'Slate Linen Shirt', cat: 'Men', img: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e', imageConfig: { sat: 16 } },
  { id: 4, name: 'Jackets & Denims', cat: 'Men', img: 'https://images.unsplash.com/photo-1617114919297-3c8ddb01f599' },
  { id: 5, name: 'White Kurta', cat: 'Kids', img: 'https://images.unsplash.com/photo-1686823982616-ed159963f571', imageConfig: { sat: 22 } },
  { id: 6, name: 'Classic Oxford Shirt', cat: 'Men', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf', imageConfig: { sat: 16 } },
  { id: 7, name: 'Floral Maxi Dress', cat: 'Women', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1', imageConfig: { sat: 20 } },
  { id: 8, name: 'Cargo Joggers', cat: 'Men', img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80', imageConfig: { sat: 16 } },
  { id: 9, name: 'Ruffle Top', cat: 'Women', img: 'https://images.unsplash.com/photo-1763559019748-a68819927eda', imageConfig: { sat: 20 } },
  { id: 10, name: 'Denim Dungaree', cat: 'Kids', img: 'https://images.unsplash.com/photo-1497340525489-441e8427c980' },
  { id: 11, name: 'Merino Blazer', cat: 'Men', img: 'https://images.unsplash.com/photo-1732384069249-fb208dcef49c', imageConfig: { sat: 16 } },
  { id: 12, name: 'Striped Midi Skirt', cat: 'Women', img: 'https://images.unsplash.com/photo-1534445538923-ab38438550d2' },
  { id: 13, name: 'Tailored Suit Set', cat: 'Men', img: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc', imageConfig: { sat: 16 } },
  { id: 14, name: 'Vintage Denim Fit', cat: 'Men', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d' },
  { id: 15, name: 'Smart Occasion Set', cat: 'Kids', img: 'https://images.unsplash.com/photo-1596392927852-2a18c336fb78', imageConfig: { sat: 16 } },
  { id: 16, name: 'Girls Occasion Edit', cat: 'Kids', img: 'https://images.unsplash.com/photo-1611708314849-8bb91fe0fa56', imageConfig: { sat: 16 } },
  { id: 17, name: 'Boutique Dress Edit', cat: 'Kids', img: 'https://images.unsplash.com/photo-1560506840-ec148e82a604', imageConfig: { sat: 20 } },
  { id: 18, name: 'Studio Casual Set', cat: 'Kids', img: 'https://images.unsplash.com/photo-1758782213532-bbb5fd89885e', imageConfig: { sat: 16 } },
  { id: 19, name: 'Baby Wools', cat: 'Kids', img: 'https://images.unsplash.com/photo-1522771930-78848d9293e8', imageConfig: { sat: 20 } },
]


const css = `
.coll-page { padding-top: 72px; min-height: 100dvh; }
.coll-hero {
  position: relative;
  height: 40dvh;
  min-height: 320px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.coll-hero__bg {
  position: absolute;
  inset: 0;
  background-image: url('${unsplashUrl('https://images.unsplash.com/photo-1445205170230-053b83016050', collectionHeroImageConfig)}');
  background-size: cover;
  background-position: center;
  filter: saturate(1.08) contrast(1.04) brightness(0.88);
}
.coll-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.5) 60%, rgba(8,8,8,0.3) 100%);
}
.coll-hero__title {
  position: relative;
  z-index: 2;
  font-family: 'Playfair Display', serif;
  font-size: clamp(48px, 10vw, 100px);
  font-weight: 900;
  color: #f5f0eb;
  letter-spacing: -0.04em;
  padding: 0 48px 40px;
  line-height: 1;
}
.coll-hero__title em { color: #6b6b6b; font-style: italic; }
.coll-filters {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 24px 48px;
  border-bottom: 1px solid #1a1a1a;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.coll-filters::-webkit-scrollbar { display: none; }
.filter-btn {
  padding: 8px 20px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #6b6b6b;
  border: 1px solid #1a1a1a;
  transition: all 0.3s;
  white-space: nowrap;
}
.filter-btn:hover, .filter-btn.active {
  color: #f5f0eb;
  background: #1a1a1a;
  border-color: #3d3d3d;
}
.filter-btn.active {
  background: #f5f0eb;
  color: #080808;
  border-color: #f5f0eb;
}
.coll-body {
  padding: 48px;
}
.coll-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
}
.coll-card {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s var(--ease-smooth), transform 0.6s var(--ease-smooth);
}
.coll-card.visible { opacity: 1; transform: translateY(0); }
.coll-card__img-wrap {
  aspect-ratio: 3/4;
  overflow: hidden;
  background: #0f0f0f;
  margin-bottom: 12px;
  position: relative;
}
.coll-card__img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: saturate(1.05) contrast(1.04) brightness(0.96);
  transition: transform 0.7s cubic-bezier(0.76,0,0.24,1), filter 0.4s;
}
.coll-card__img-wrap:hover .coll-card__img {
  transform: scale(1.06);
  filter: saturate(1.18) contrast(1.08) brightness(1);
}
.coll-card__name { font-family: 'Cormorant Garamond', serif; font-size: 17px; color: #c4c4c4; margin-bottom: 6px; }
.coll-card__meta { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.16em; color: #6b6b6b; text-transform: uppercase; }

@media (pointer: fine) {
  .filter-btn, .coll-card__img-wrap {
    cursor: none;
  }
}

@media (max-width: 1024px) { .coll-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) {
  .coll-grid { grid-template-columns: repeat(2, 1fr); }
  .coll-body { padding: 24px; }
  .coll-filters { padding: 16px 24px; }
  .coll-hero__title { padding: 0 24px 32px; }
}
`

export default function Collections() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const ref = useRef(null)
  const inView = useInView(ref, { threshold: 0.05 })
  const filters = ['All', 'Men', 'Women', 'Kids']
  const categoryParam = searchParams.get('cat')
  const active = filters.includes(categoryParam) ? categoryParam : 'All'
  const filtered = active === 'All' ? ALL_PRODUCTS : ALL_PRODUCTS.filter(p => p.cat === active)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [active])

  const setActiveFilter = (filter) => {
    if (filter === 'All') {
      router.replace(pathname, { scroll: false })
      return
    }

    router.replace(`${pathname}?cat=${encodeURIComponent(filter)}`, { scroll: false })
  }

  return (
    <>
      <style>{css}</style>
      <div className="coll-page">
        <div className="coll-hero">
          <div className="coll-hero__bg" />
          <div className="coll-hero__overlay" />
          <h1 className="coll-hero__title">Collections<em>.</em></h1>
        </div>
        <div className="coll-filters">
          {filters.map(f => (
            <button key={f} className={`filter-btn${active === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <div className="coll-body" ref={ref}>
          <div className="coll-grid">
            {filtered.map((p, i) => (
              <div key={p.id} className={`coll-card${inView ? ' visible' : ''}`} style={{ transitionDelay: `${(i % 4) * 0.08}s` }}>
                <div className="coll-card__img-wrap">
                  <img src={productImageUrl(p.img, p.imageConfig)} alt={p.name} className="coll-card__img" loading="lazy" />
                </div>
                <div className="coll-card__name">{p.name}</div>
                <div className="coll-card__meta">{p.cat} Collection</div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </>
  )
}
