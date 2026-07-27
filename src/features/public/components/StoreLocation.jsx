import React, { useRef, useEffect } from 'react'
import { useInView } from '../hooks/useInView'

const css = `
.store {
  padding: 120px 48px;
  border-top: 1px solid #1a1a1a;
  background: #080808;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 560px));
  justify-content: center;
  gap: 64px;
  align-items: center;
}
.store__media {
  position: relative;
  aspect-ratio: 4/5;
  overflow: hidden;
  opacity: 0;
  clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
  transition: opacity 1s var(--ease-smooth), clip-path 1s cubic-bezier(0.76,0,0.24,1);
}
.store.visible .store__media {
  opacity: 1;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}
.store__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(100%) contrast(1.1) brightness(0.9);
  transform: scale(1.05);
  transition: transform 1.5s var(--ease-cinematic);
}
.store.visible .store__video {
  transform: scale(1);
}
.store__content {
  max-width: 480px;
  opacity: 0;
  transform: translateX(-30px);
  transition: opacity 0.8s 0.2s var(--ease-smooth), transform 0.8s 0.2s var(--ease-smooth);
}
.store.visible .store__content {
  opacity: 1;
  transform: translateX(0);
}
.store__number {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: #3d3d3d;
  letter-spacing: 0.1em;
  margin-bottom: 24px;
  display: block;
}
.store__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 900;
  color: #f5f0eb;
  letter-spacing: -0.02em;
  line-height: 1;
  margin-bottom: 40px;
}
.store__title em {
  font-style: italic;
  color: #6b6b6b;
}
.store__detail-group {
  margin-bottom: 32px;
}
.store__label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: #6b6b6b;
  text-transform: uppercase;
  margin-bottom: 12px;
  display: block;
}
.store__text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  color: #c4c4c4;
  line-height: 1.5;
}
.store__cta-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
}
.store__cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 36px;
  border: 1px solid #f5f0eb;
  background: transparent;
  color: #f5f0eb;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.3s, color 0.3s, gap 0.3s;
  cursor: none;
}
.store__cta:hover {
  background: #f5f0eb;
  color: #080808;
  gap: 18px;
}

@media (max-width: 900px) {
  .store { grid-template-columns: 1fr; gap: 48px; }
  .store__media { aspect-ratio: 16/9; }
}
@media (max-width: 768px) {
  .store { padding: 80px 24px; }
  .store__media { aspect-ratio: 4/3; }
}
`

export default function StoreLocation() {
  const ref = useRef(null)
  const inView = useInView(ref)
  const videoRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return;

    // Explicitly force the DOM node to be muted (Required by Safari/iOS to allow autoplay)
    videoRef.current.defaultMuted = true;
    videoRef.current.muted = true;
  }, []);

  return (
    <>
      <style>{css}</style>
      <section className={`store${inView ? ' visible' : ''}`} ref={ref}>
        <div className="store__media">
          <video
            ref={videoRef}
            src="https://videos.pexels.com/video-files/7679727/7679727-hd_1920_1080_30fps.mp4"
            className="store__video"
            autoPlay
            muted
            loop
            playsInline
            poster="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&q=80&fit=crop"
          ></video>
        </div>
        <div className="store__content">
          <span className="store__number">05</span>
          <h2 className="store__title">
            Visit Our<br /><em>Stores</em>
          </h2>
          
          <div className="store__detail-group">
            <span className="store__label">Mens Store</span>
            <p className="store__text">
              Perumalswamy Road, BK Pudur<br />
              Coimbatore, Kuniyamuthur - 641008
            </p>
          </div>

          <div className="store__detail-group">
            <span className="store__label">Womens & Kids Store</span>
            <p className="store__text">
              New Lenskart Opposite<br />
              Coimbatore, Kuniyamuthur - 641008
            </p>
          </div>

          <div className="store__detail-group">
            <span className="store__label">Hours</span>
            <p className="store__text">
              Monday - Sunday<br />
              10:00 AM - 10:00 PM
            </p>
          </div>

        <div className="store__cta-wrapper">
          <a href="https://share.google/CC8LP36koXuYF79qx" target="_blank" rel="noreferrer" className="store__cta">
            Store 1 Directions →
          </a>
          <a href="https://share.google/j1PXaLh8jareUJm3F" target="_blank" rel="noreferrer" className="store__cta">
            Store 2 Directions →
          </a>
        </div>
        </div>
      </section>
    </>
  )
}
