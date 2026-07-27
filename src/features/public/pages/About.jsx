"use client";

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Footer from '../components/Footer'

gsap.registerPlugin(ScrollTrigger)

const css = `
.about-page { padding-top: 72px; }
.about-hero {
  position: relative;
  height: 80dvh;
  min-height: 500px;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.about-hero__bg {
  position: absolute;
  inset: 0;
  background-image: url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=90&fit=crop');
  background-size: cover;
  background-position: center;
  filter: grayscale(100%) contrast(1.1);
}
.about-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(8,8,8,0.72);
}
.about-hero__content {
  position: relative;
  z-index: 2;
  padding: 0 48px;
  max-width: 760px;
}
.about-hero__eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.35em;
  color: #6b6b6b;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.about-hero__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(44px, 8vw, 100px);
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -0.03em;
  color: #f5f0eb;
  margin-bottom: 24px;
}
.about-hero__title em { font-style: italic; color: #9a9a9a; }
.about-hero__subtitle {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(18px, 2.5vw, 24px);
  font-style: italic;
  color: #9a9a9a;
  line-height: 1.6;
}
.about-marquee-container {
  overflow: hidden;
  padding: 100px 0 0;
  border-top: 1px solid #1a1a1a;
}
.about-marquee h2 {
  font-family: 'Space Mono', monospace;
  font-size: clamp(50px, 10vw, 150px);
  font-weight: 900;
  color: #1a1a1a;
  line-height: 1;
  white-space: nowrap;
  text-transform: uppercase;
  will-change: transform;
}
.about-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  padding: 80px 48px 100px;
}
.reveal-up {
  opacity: 0;
  transform: translateY(40px);
  will-change: opacity, transform;
}
.about-body__section-num {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.3em;
  color: #3d3d3d;
  text-transform: uppercase;
  margin-bottom: 24px;
}
.about-body__heading {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 3.5vw, 44px);
  font-weight: 900;
  color: #f5f0eb;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 24px;
}
.about-body__para {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  color: #9a9a9a;
  line-height: 1.8;
  margin-bottom: 20px;
}
.about-values {
  padding: 0 48px 100px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background: #1a1a1a;
}
.value-tile {
  background: #080808;
  padding: 48px 36px;
  opacity: 0;
  transform: translateY(40px);
  will-change: opacity, transform;
}
.value-tile__icon {
  font-size: 28px;
  margin-bottom: 20px;
}
.value-tile__title {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: #f5f0eb;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}
.value-tile__text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  color: #6b6b6b;
  line-height: 1.7;
}
@media (max-width: 768px) {
  .about-hero__content { padding: 0 24px; }
  .about-body { grid-template-columns: 1fr; gap: 40px; padding: 60px 24px; }
  .about-values { grid-template-columns: 1fr; padding: 0 24px 80px; }
}
`

export default function About() {
  const container = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Giant background text scrub
      gsap.to('.about-marquee h2', {
        xPercent: -25,
        ease: 'none',
        scrollTrigger: {
          trigger: '.about-marquee-container',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      })

      // Smooth fade up for paragraphs
      gsap.utils.toArray('.reveal-up').forEach(el => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
          }
        })
      })

      // Stagger value tiles
      gsap.to('.value-tile', {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about-values',
          start: 'top 85%',
        }
      })
    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <>
      <style>{css}</style>
      <div className="about-page" ref={container}>
        <div className="about-hero">
          <div className="about-hero__bg" />
          <div className="about-hero__overlay" />
          <div className="about-hero__content">
            <p className="about-hero__eyebrow">Our Story - Since 2012</p>
            <h1 className="about-hero__title">
              Fashion<br />
              <em>Reimagined.</em>
            </h1>
            <p className="about-hero__subtitle">
              One store. Fifty+ brands. Infinite styles.
            </p>
          </div>
        </div>

        <div className="about-marquee-container">
          <div className="about-marquee">
            <h2>EST. 2012 - PREMIUM CURATION - 50+ BRANDS - ENDLESS STYLE - EST. 2012 - PREMIUM CURATION - 50+ BRANDS </h2>
          </div>
        </div>

        <div className="about-body">
          <div className="about-body__text-col reveal-up">
            <p className="about-body__section-num">01 / Our Mission</p>
            <h2 className="about-body__heading">Culture over clothing.</h2>
            <p className="about-body__para">
              AMIGOS is a destination where style meets culture. From casual basics to premium eveningwear, we dress every chapter of your life.
            </p>
          </div>
          <div className="about-body__text-col reveal-up">
            <p className="about-body__section-num">02 / What We Do</p>
            <h2 className="about-body__heading">Curated for you.</h2>
            <p className="about-body__para">
              We partner with over 50 premium brands, hand-picking collections for quality and style. Men, Women, Kids - this is where India comes to dress.
            </p>
          </div>
        </div>

        <div className="about-values">
          {[
            { icon: '◈', title: 'Multi-Brand', text: 'Over 50 premium brands under one roof, carefully curated for quality and style.' },
            { icon: '◉', title: 'For Everyone', text: 'Men, women, and children - fashion for every age, every occasion, every story.' },
            { icon: '◊', title: 'Made for India', text: 'Designed with the Indian consumer in mind - sizes, styles, and sensibilities that fit.' },
          ].map((v, i) => (
            <div className="value-tile" key={i}>
              <div className="value-tile__icon">{v.icon}</div>
              <div className="value-tile__title">{v.title}</div>
              <p className="value-tile__text">{v.text}</p>
            </div>
          ))}
        </div>

        <Footer />
      </div>
    </>
  )
}
