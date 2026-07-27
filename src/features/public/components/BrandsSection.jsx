import React, { useRef, useState, useEffect } from 'react'
import { useInView } from '../hooks/useInView'

const brands = [
  { name: 'Rare Rabbit', category: 'Fashion' },
  { name: 'H&M', category: 'Casual' },
  { name: 'Levi\'s', category: 'Denim' },
  { name: 'Arrow', category: 'Women' },
  { name: 'LP', category: 'Ethnic' },
  { name: 'Allen Solly', category: 'Formal' },
  { name: 'UCB', category: 'Casual' },
  { name: 'GAP', category: 'Basics' },
  { name: 'Tommy', category: 'Premium' },
  { name: 'Peter England', category: 'Formal' },
]

const css = `
.brands {
  padding: 100px 48px;
  border-top: 1px solid #1a1a1a;
}
.brands__header {
  display: flex;
  align-items: baseline;
  gap: 24px;
  margin-bottom: 64px;
}
.brands__number {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: #3d3d3d;
  letter-spacing: 0.1em;
}
.brands__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 4.5vw, 56px);
  font-weight: 900;
  color: #f5f0eb;
  letter-spacing: -0.02em;
}
.brands__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  background: #1a1a1a;
}
.brand-tile {
  background: #080808;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 6px;
  cursor: none;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s var(--ease-smooth), transform 0.6s var(--ease-smooth), background 0.3s;
  position: relative;
  overflow: hidden;
}
.brand-tile.visible {
  opacity: 1;
  transform: translateY(0);
}
.brand-tile:hover, .brand-tile.active { background: #111; }

/* Animated highlight line on hover */
.brand-tile::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: #f5f0eb;
  transform: scaleY(0);
  transform-origin: bottom left;
  transition: transform 0.4s var(--ease-smooth);
}
.brand-tile:hover::before, .brand-tile.active::before { transform: scaleY(1); }

.brand-tile__name {
  font-family: 'Playfair Display', serif;
  font-size: clamp(16px, 2vw, 24px);
  font-weight: 700;
  color: #3d3d3d;
  letter-spacing: -0.01em;
  transition: color 0.3s, transform 0.4s var(--ease-smooth);
}
.brand-tile:hover .brand-tile__name, .brand-tile.active .brand-tile__name { 
  color: #f5f0eb; 
  transform: translateX(8px);
}
.brand-tile__category {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: #2a2a2a;
  text-transform: uppercase;
  transition: color 0.3s, transform 0.4s var(--ease-smooth);
}
.brand-tile:hover .brand-tile__category, .brand-tile.active .brand-tile__category { 
  color: #6b6b6b; 
  transform: translateX(8px);
}

/* Stagger */
${[...Array(10)].map((_, i) => `.brand-tile:nth-child(${i+1}) { transition-delay: ${i * 0.06}s; }`).join('\n')}

@media (max-width: 1024px) {
  .brands__grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 768px) {
  .brands { padding: 80px 24px; }
  .brands__grid { grid-template-columns: repeat(2, 1fr); }
}
`

export default function BrandsSection() {
  const ref = useRef(null)
  const inView = useInView(ref)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isHovered, setIsHovered] = useState(false)
  const stepRef = useRef(0)

  useEffect(() => {
    if (!inView || isHovered) return; // Run rotation only when on screen and not hovered
    
    // Custom pattern: 1st, 3rd, 5th, etc. to create the jumping rotation
    const sequence = [0, 2, 4, 6, 8, 1, 3, 5, 7, 9];

    const interval = setInterval(() => {
      setActiveIndex(sequence[stepRef.current]);
      stepRef.current = (stepRef.current + 1) % sequence.length;
    }, 1200); // Changes highlight every 1.2 seconds

    return () => clearInterval(interval);
  }, [inView, isHovered]);

  return (
    <>
      <style>{css}</style>
      <section className="brands" ref={ref}>
        <div className="brands__header">
          <span className="brands__number">03</span>
          <h2 className="brands__title">Brand Collections</h2>
        </div>
        <div 
          className="brands__grid"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {brands.map((brand, i) => (
            <div key={i} className={`brand-tile${inView ? ' visible' : ''}${!isHovered && activeIndex === i ? ' active' : ''}`}>
              <span className="brand-tile__name">{brand.name}</span>
              <span className="brand-tile__category">{brand.category}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
