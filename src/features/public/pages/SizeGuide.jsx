"use client";

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Footer from '../components/Footer'

gsap.registerPlugin(ScrollTrigger)

const sizeSections = [
  {
    title: 'Men',
    rows: [
      ['S', '36', '30', '38'],
      ['M', '38', '32', '40'],
      ['L', '40', '34', '42'],
      ['XL', '42', '36', '44'],
    ],
  },
  {
    title: 'Women',
    rows: [
      ['S', '34', '28', '36'],
      ['M', '36', '30', '38'],
      ['L', '38', '32', '40'],
      ['XL', '40', '34', '42'],
    ],
  },
  {
    title: 'Kids',
    rows: [
      ['2-3Y', '21', '20', '22'],
      ['4-5Y', '23', '21', '24'],
      ['6-7Y', '25', '22', '26'],
      ['8-9Y', '27', '23', '28'],
    ],
  },
]

const css = `
.size-page { padding-top: 72px; min-height: 100dvh; }
.size-hero {
  position: relative;
  height: 50dvh;
  min-height: 350px;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.size-hero__bg {
  position: absolute;
  inset: 0;
  background-image: url('https://images.unsplash.com/photo-1649207688720-e5aadb947481?w=1600&q=90&fit=crop');
  background-size: cover;
  background-position: center;
  filter: grayscale(100%) contrast(1.1) brightness(0.8);
}
.size-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(8,8,8,0.65);
}
.size-hero__content {
  position: relative;
  z-index: 2;
  padding: 0 48px;
}
.size-hero__eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.35em;
  color: #6b6b6b;
  text-transform: uppercase;
  margin-bottom: 18px;
}
.size-hero__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(44px, 8vw, 96px);
  font-weight: 900;
  line-height: 0.95;
  color: #f5f0eb;
  letter-spacing: -0.03em;
}
.size-hero__title em { color: #6b6b6b; font-style: italic; }
.size-content {
  padding: 64px 48px 100px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background: #1a1a1a;
}
.size-panel {
  background: #080808;
  padding: 36px;
  opacity: 0;
  transform: translateY(40px);
  will-change: opacity, transform;
}
.size-panel__title {
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  color: #f5f0eb;
  margin-bottom: 24px;
}
.size-table {
  width: 100%;
  border-collapse: collapse;
}
.size-table th,
.size-table td {
  border-bottom: 1px solid #1a1a1a;
  padding: 12px 0;
  text-align: left;
}
.size-table th {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  color: #6b6b6b;
  text-transform: uppercase;
}
.size-table td {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  color: #c4c4c4;
  transition: color 0.3s ease, transform 0.3s ease;
}
.size-table td:first-child {
  font-weight: bold;
  color: #f5f0eb;
}
.size-table tbody tr {
  transition: background-color 0.3s ease;
}
.size-table tbody tr:hover {
  background-color: rgba(245, 240, 235, 0.05);
}
.size-table tbody tr:hover td {
  color: #f5f0eb;
  transform: translateX(8px);
}
.size-note {
  padding: 0 48px 80px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  line-height: 1.7;
  color: #9a9a9a;
  max-width: 780px;
}
@media (max-width: 1024px) {
  .size-content { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .size-hero__content { padding: 0 24px; }
  .size-content { padding: 40px 24px 72px; }
  .size-panel { padding: 28px; }
  .size-note { padding: 0 24px 64px; }
}
`

export default function SizeGuide() {
  const container = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.size-panel', {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.size-content',
          start: 'top 85%',
        }
      })
    }, container)
    return () => ctx.revert()
  }, [])

  return (
    <>
      <style>{css}</style>
      <div className="size-page" ref={container}>
        <section className="size-hero">
          <div className="size-hero__bg" />
          <div className="size-hero__overlay" />
          <div className="size-hero__content">
            <p className="size-hero__eyebrow">Fit Reference</p>
            <h1 className="size-hero__title">Size<br /><em>Guide.</em></h1>
          </div>
        </section>

        <section className="size-content">
          {sizeSections.map((section) => (
            <div className="size-panel" key={section.title}>
              <h2 className="size-panel__title">{section.title}</h2>
              <table className="size-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest</th>
                    <th>Waist</th>
                    <th>Hip</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => <td key={cell}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        <p className="size-note">
          Measurements are in inches and intended as a general guide. For tailored fits, compare with a garment that already fits well.
        </p>

        <Footer />
      </div>
    </>
  )
}
