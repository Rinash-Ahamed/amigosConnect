import React from 'react'
import Link from 'next/link'

const instagramUrl = 'https://www.instagram.com/amigos_menswear/'
const instagramAppUrl = 'instagram://user?username=amigos_menswear'
const facebookUrl = 'https://www.facebook.com/amigostrend/'
const facebookAppUrl = 'fb://profile/amigostrend'

const socialLinks = [
  { label: 'IG', href: instagramUrl, appHref: instagramAppUrl },
  { label: 'FB', href: facebookUrl, appHref: facebookAppUrl },
]

const css = `
.footer {
  border-top: 1px solid #1a1a1a;
  padding: 80px 48px 40px;
  background: #080808;
}
.footer__top {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 60px;
  margin-bottom: 80px;
}
.footer__brand-name {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.footer__brand-name img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 18px;
  border: 1px solid rgba(245, 240, 235, 0.16);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42);
}
.footer__wordmark {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 900;
  color: #f5f0eb;
  letter-spacing: -0.02em;
}
.footer__wordmark span { color: #3d3d3d; }
.footer__tagline {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  font-style: italic;
  color: #6b6b6b;
  line-height: 1.6;
  max-width: 280px;
  margin-bottom: 32px;
}
.footer__social {
  display: flex;
  gap: 16px;
}
.footer__social a {
  width: 36px; height: 36px;
  border: 1px solid #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: #6b6b6b;
  transition: border-color 0.3s, color 0.3s;
}
.footer__social a:hover {
  border-color: #f5f0eb;
  color: #f5f0eb;
}
.footer__col-title {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #3d3d3d;
  margin-bottom: 20px;
}
.footer__col ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer__col ul li a {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  color: #6b6b6b;
  transition: color 0.3s;
}
.footer__col ul li a:hover { color: #f5f0eb; }
.footer__bottom {
  border-top: 1px solid #1a1a1a;
  padding-top: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer__copy {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.15em;
  color: #3d3d3d;
  text-transform: uppercase;
}

@media (max-width: 1024px) {
  .footer__top { grid-template-columns: 1fr 1fr; gap: 40px; }
}
@media (max-width: 768px) {
  .footer { padding: 60px 24px 32px; }
  .footer__top { grid-template-columns: 1fr; gap: 40px; }
  .footer__bottom { flex-direction: column; gap: 16px; text-align: center; }
}
`

export default function Footer() {
  const handleSocialClick = (event, social) => {
    if (!social.appHref) return

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (!isMobile) return

    event.preventDefault()

    const fallback = window.setTimeout(() => {
      window.location.assign(social.href)
    }, 900)

    window.addEventListener('pagehide', () => window.clearTimeout(fallback), { once: true })
    window.location.assign(social.appHref)
  }

  return (
    <>
      <style>{css}</style>
      <footer className="footer">
        <div className="footer__top">
          <div>
            <div className="footer__brand-name">
              <img src="/fashion-logo.png" alt="AMIGOS" />
              <span className="footer__wordmark">AMIGOS<span>.</span></span>
            </div>
            <p className="footer__tagline">
              Multi-brand fashion for every soul. Discover premium collections for Men, Women &amp; Kids.
            </p>
            <div className="footer__social">
              {socialLinks.map(s => {
                const isExternal = s.href.startsWith('http')

                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noreferrer' : undefined}
                    onClick={(event) => handleSocialClick(event, s)}
                  >
                    {s.label}
                  </a>
                )
              })}
            </div>
          </div>
          <div className="footer__col">
            <p className="footer__col-title">Explore</p>
            <ul>
              <li><Link href="/collections?cat=Men">Men</Link></li>
              <li><Link href="/collections?cat=Women">Women</Link></li>
              <li><Link href="/collections?cat=Kids">Kids</Link></li>
              <li><Link href="/collections">Collections</Link></li>
            </ul>
          </div>
          <div className="footer__col">
            <p className="footer__col-title">Help</p>
            <ul>
              <li><Link href="/size-guide">Size Guide</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer__col">
            <p className="footer__col-title">Company</p>
            <ul>
              <li><Link href="/about">About Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span className="footer__copy">© 2026 AMIGOS Fashion - All rights reserved</span>
          <span className="footer__copy">Version {process.env.NEXT_PUBLIC_APP_VERSION}</span>
          <span className="footer__copy">Made in India 🇮🇳</span>
        </div>
      </footer>
    </>
  )
}
