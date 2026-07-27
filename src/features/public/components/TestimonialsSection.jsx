import React, { useRef } from 'react'
import { useInView } from '../hooks/useInView'

const reviews = [
  { id: 1, text: "The curation of brands is exceptional. AMIGOS has become my go-to for premium menswear.", author: "Arjun M.", role: "Loyal Client" },
  { id: 2, text: "Impeccable quality and the collection is unmatched. Highly recommend for festive and formal shopping.", author: "Priya S.", role: "Fashion Enthusiast" },
  { id: 3, text: "Finally a multi-brand store that understands modern Indian fashion. The experience is breathtaking.", author: "Rahul V.", role: "Style Consultant" }
]

const css = `
.testimonials {
  padding: 120px 48px;
  border-top: 1px solid #1a1a1a;
  background: #080808;
}
.testimonials__header {
  display: flex;
  align-items: baseline;
  gap: 24px;
  margin-bottom: 64px;
}
.testimonials__number {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: #3d3d3d;
  letter-spacing: 0.1em;
}
.testimonials__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 4.5vw, 56px);
  font-weight: 900;
  color: #f5f0eb;
  letter-spacing: -0.02em;
}
.testimonials__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}
.review-card {
  padding: 40px;
  background: #0f0f0f;
  border: 1px solid #1a1a1a;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s var(--ease-smooth), transform 0.8s var(--ease-smooth);
}
.review-card.visible {
  opacity: 1;
  transform: translateY(0);
}
.review-card:nth-child(2) { transition-delay: 0.15s; }
.review-card:nth-child(3) { transition-delay: 0.3s; }
.review-card__stars {
  color: #f5f0eb;
  font-size: 12px;
  letter-spacing: 0.2em;
  margin-bottom: 24px;
}
.review-card__text {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(18px, 2vw, 24px);
  font-style: italic;
  color: #9a9a9a;
  line-height: 1.5;
  margin-bottom: 32px;
}
.review-card__author {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #f5f0eb;
  display: block;
  margin-bottom: 4px;
}
.review-card__role {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.15em;
  color: #3d3d3d;
  text-transform: uppercase;
}

@media (max-width: 1024px) {
  .testimonials__grid { grid-template-columns: repeat(2, 1fr); }
  .review-card:nth-child(3) { display: none; }
}
@media (max-width: 768px) {
  .testimonials { padding: 80px 24px; }
  .testimonials__grid { grid-template-columns: 1fr; }
  .review-card:nth-child(3) { display: block; }
}
`

export default function TestimonialsSection() {
  const ref = useRef(null)
  const inView = useInView(ref)

  return (
    <>
      <style>{css}</style>
      <section className="testimonials" ref={ref}>
        <div className="testimonials__header">
          <span className="testimonials__number">04</span>
          <h2 className="testimonials__title">Client Stories</h2>
        </div>
        <div className="testimonials__grid">
          {reviews.map((r) => (
            <div key={r.id} className={`review-card${inView ? ' visible' : ''}`}>
              <div className="review-card__stars">★★★★★</div>
              <p className="review-card__text">“{r.text}”</p>
              <div>
                <span className="review-card__author">{r.author}</span>
                <span className="review-card__role">{r.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
