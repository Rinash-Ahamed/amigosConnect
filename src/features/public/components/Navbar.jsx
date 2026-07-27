import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const css = `
.nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 9000;
  padding: 0 48px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.5s ease, border-color 0.5s ease;
  border-bottom: 1px solid transparent;
  background: linear-gradient(to bottom, rgba(8,8,8,0.72), rgba(8,8,8,0.18));
}
.nav--scrolled {
  background: rgba(8,8,8,0.9);
  backdrop-filter: blur(20px);
  border-color: #1a1a1a;
}
.nav__logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 44px;
}
.nav__logo img {
  width: 38px;
  height: 38px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(245, 240, 235, 0.18);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}
.nav__wordmark {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f5f0eb;
}
.nav__wordmark span {
  color: #9a9a9a;
}
.nav__links {
  display: flex;
  gap: 40px;
  list-style: none;
}
.nav__links a {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9a9a9a;
  transition: color 0.3s ease;
  position: relative;
}
.nav__links a::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0; right: 100%;
  height: 1px;
  background: #f5f0eb;
  transition: right 0.3s cubic-bezier(0.76,0,0.24,1);
}
.nav__links a:hover, .nav__links a.active {
  color: #f5f0eb;
}
.nav__links a:hover::after, .nav__links a.active::after {
  right: 0;
}
.nav__right {
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav .nav__connect {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 18px;
  border: 1px solid rgba(245, 240, 235, 0.7);
  background: #f5f0eb;
  color: #080808;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: background 0.3s ease, color 0.3s ease;
}
.nav .nav__connect:hover {
  background: transparent;
  color: #f5f0eb;
}
.nav__tag {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.15em;
  color: #3d3d3d;
  text-transform: uppercase;
}
.nav__menu-btn {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: none;
  padding: 4px;
}
.nav__menu-btn span {
  display: block;
  width: 24px;
  height: 1px;
  background: #f5f0eb;
  transition: all 0.3s ease;
}
.nav__menu-btn.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.nav__menu-btn.open span:nth-child(2) { opacity: 0; }
.nav__menu-btn.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

/* Mobile menu */
.nav__mobile {
  position: fixed;
  inset: 0;
  background: rgba(8, 8, 8, 0.95);
  backdrop-filter: blur(15px);
  z-index: 8999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  clip-path: inset(0 0 100% 0);
  transition: clip-path 0.8s cubic-bezier(0.76, 0, 0.24, 1), background 0.8s;
}
.nav__mobile.open {
  clip-path: inset(0 0 0% 0);
}
.nav__mobile a {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 6vw, 42px);
  font-style: italic;
  color: #f5f0eb;
  letter-spacing: -0.02em;
  opacity: 0;
  transform: translateY(20px);
  transition: color 0.3s, opacity 0.3s ease, transform 0.3s ease;
}
.nav__mobile a:hover { color: #6b6b6b; }
.nav__mobile .nav__mobile-connect {
  padding: 12px 24px;
  border: 1px solid #f5f0eb;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-style: normal;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.nav__mobile.open a {
  opacity: 1;
  transform: translateY(0);
}
.nav__mobile.open a:nth-child(1) { transition-delay: 0.3s; transition-duration: 0.6s; }
.nav__mobile.open a:nth-child(2) { transition-delay: 0.4s; transition-duration: 0.6s; }
.nav__mobile.open a:nth-child(3) { transition-delay: 0.5s; transition-duration: 0.6s; }
.nav__mobile.open a:nth-child(4) { transition-delay: 0.6s; transition-duration: 0.6s; }

@media (max-width: 768px) {
  .nav { padding: 0 24px; }
  .nav__links, .nav__tag { display: none; }
  .nav__menu-btn { display: flex; }
  .nav__wordmark { font-size: 18px; letter-spacing: 0.14em; }
  .nav__logo img { width: 34px; height: 34px; border-radius: 10px; }
}
`

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <style>{css}</style>
      <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
        <Link href="/" className="nav__logo" aria-label="AMIGOS home">
          <img src="/fashion-logo.png" alt="AMIGOS" />
          <span className="nav__wordmark">AMIGOS<span>.</span></span>
        </Link>

        <ul className="nav__links">
          {[['/', 'Home'], ['/collections', 'Collections'], ['/about', 'About']].map(([to, label]) => (
            <li key={to}>
              <Link href={to} className={pathname === to ? 'active' : ''}>{label}</Link>
            </li>
          ))}
        </ul>

        <div className="nav__right">
          <Link href="/connect" className="nav__connect" prefetch>Connect</Link>
          <span className="nav__tag">Men · Women · Kids</span>
          <button
            className={`nav__menu-btn${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`nav__mobile${menuOpen ? ' open' : ''}`}>
        <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link href="/collections" onClick={() => setMenuOpen(false)}>Collections</Link>
        <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
        <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
        <Link href="/connect" className="nav__mobile-connect" prefetch onClick={() => setMenuOpen(false)}>Connect</Link>
      </div>
    </>
  )
}
