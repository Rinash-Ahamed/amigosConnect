import React from 'react'

const css = `
.marquee {
  overflow: hidden;
  border-top: 1px solid #1a1a1a;
  border-bottom: 1px solid #1a1a1a;
  padding: 14px 0;
  background: #0d0d0d;
  position: relative;
  z-index: 10;
}
.marquee__track {
  display: flex;
  gap: 0;
  animation: marquee 22s linear infinite;
  white-space: nowrap;
  width: max-content;
}
.marquee:hover .marquee__track {
  animation-play-state: paused;
}
.marquee__item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 40px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #3d3d3d;
}
.marquee__dot {
  width: 4px;
  height: 4px;
  background: #3d3d3d;
  border-radius: 50%;
  flex-shrink: 0;
}
.marquee__item.highlight {
  color: #9a9a9a;
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`

const items = [
  { text: 'New Season Edits', highlight: true },
  { text: 'Men Collection' },
  { text: 'Women Fashion', highlight: true },
  { text: 'Kids Wear' },
  { text: 'Premium Brands', highlight: true },
  { text: 'Indian Multi-Brand Store' },
  { text: 'Curated Collections', highlight: true },
  { text: 'Authentic Fashion' },
]

export default function MarqueeStrip() {
  const doubled = [...items, ...items, ...items, ...items]
  return (
    <>
      <style>{css}</style>
      <div className="marquee">
        <div className="marquee__track">
          {doubled.map((item, i) => (
            <span key={i} className={`marquee__item${item.highlight ? ' highlight' : ''}`}>
              <span className="marquee__dot" />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
