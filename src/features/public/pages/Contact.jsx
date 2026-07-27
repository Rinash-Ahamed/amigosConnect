"use client";

import React from 'react'
import Footer from '../components/Footer'

const instagramUrl = 'https://www.instagram.com/amigos_menswear/'
const whatsappNumber = '919791834497'

const css = `
.contact-page { padding-top: 72px; min-height: 100dvh; }
.contact-hero {
  position: relative;
  height: 50dvh;
  min-height: 350px;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.contact-hero__bg {
  position: absolute;
  inset: 0;
  background-image: url('https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=1600&q=90&fit=crop');
  background-size: cover;
  background-position: center;
  filter: grayscale(100%) contrast(1.1) brightness(0.8);
}
.contact-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(8,8,8,0.65);
}
.contact-hero__content {
  position: relative;
  z-index: 2;
  padding: 0 48px;
}
.contact-hero__eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.35em;
  color: #6b6b6b;
  text-transform: uppercase;
  margin-bottom: 18px;
}
.contact-hero__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(44px, 8vw, 96px);
  font-weight: 900;
  line-height: 0.95;
  color: #f5f0eb;
  letter-spacing: -0.03em;
}
.contact-hero__title em { color: #6b6b6b; font-style: italic; }
.contact-body {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 2px;
  padding: 64px 48px 100px;
  background: #1a1a1a;
}
.contact-panel {
  background: #080808;
  padding: 44px 40px;
}
.contact-panel__title {
  font-family: 'Playfair Display', serif;
  font-size: 34px;
  color: #f5f0eb;
  margin-bottom: 20px;
}
.contact-panel__text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  line-height: 1.7;
  color: #9a9a9a;
  margin-bottom: 28px;
}
.contact-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 22px;
  border: 1px solid #f5f0eb;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  color: #f5f0eb;
  text-transform: uppercase;
}
.contact-form {
  display: grid;
  gap: 16px;
}
.contact-input,
.contact-message {
  width: 100%;
  border: 1px solid #2a2a2a;
  background: #0f0f0f;
  color: #f5f0eb;
  padding: 14px 16px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px;
  outline: none;
}
.contact-input:focus,
.contact-message:focus {
  border-color: #6b6b6b;
}
.contact-message {
  min-height: 150px;
  resize: vertical;
}
.contact-submit {
  justify-self: start;
  min-height: 42px;
  padding: 0 22px;
  border: 1px solid #f5f0eb;
  background: #f5f0eb;
  color: #080808;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
@media (pointer: fine) {
  .contact-submit {
    cursor: none;
  }
}
@media (max-width: 900px) {
  .contact-body { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .contact-hero__content { padding: 0 24px; }
  .contact-body { padding: 40px 24px 72px; }
  .contact-panel { padding: 32px 28px; }
}
`

export default function Contact() {
  const handleWhatsAppSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const name = formData.get('name')
    const email = formData.get('email')
    const message = formData.get('message')
    
    // Format the message for WhatsApp
    const text = `*New Inquiry from AMIGOS*\n\n*Name:* ${name}\n*Email:* ${email}\n*Message:* ${message}`
    const encodedText = encodeURIComponent(text)
    
    // Open WhatsApp URL in a new tab
    const url = `https://wa.me/${whatsappNumber}?text=${encodedText}`
    window.open(url, '_blank')
  }

  return (
    <>
      <style>{css}</style>
      <div className="contact-page">
        <section className="contact-hero">
          <div className="contact-hero__bg" />
          <div className="contact-hero__overlay" />
          <div className="contact-hero__content">
            <p className="contact-hero__eyebrow">Contact Us</p>
            <h1 className="contact-hero__title">Let us<br /><em>help.</em></h1>
          </div>
        </section>

        <section className="contact-body">
          <div className="contact-panel">
            <h2 className="contact-panel__title">Speak with AMIGOS</h2>
            <p className="contact-panel__text">
              For collection questions, sizing help, or product availability, message us on Instagram and our team will get back to you.
            </p>
            <a className="contact-link" href={instagramUrl} target="_blank" rel="noreferrer">
              Message on Instagram
            </a>
          </div>

          <div className="contact-panel">
            <h2 className="contact-panel__title">Send an inquiry</h2>
            <form className="contact-form" onSubmit={handleWhatsAppSubmit}>
              <input className="contact-input" name="name" type="text" placeholder="Name" aria-label="Name" required />
              <input className="contact-input" name="email" type="email" placeholder="Email" aria-label="Email" required />
              <textarea className="contact-message" name="message" placeholder="Message" aria-label="Message" required />
              <button className="contact-submit" type="submit">Submit via WhatsApp</button>
            </form>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
