"use client";

import Hero from '../components/Hero'
import MarqueeStrip from '../components/MarqueeStrip'
import CategoryGrid from '../components/CategoryGrid'
import FeaturedRow from '../components/FeaturedRow'
import EditorialSection from '../components/EditorialSection'
import BrandsSection from '../components/BrandsSection'
import TestimonialsSection from '../components/TestimonialsSection'
import StoreLocation from '../components/StoreLocation'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <MarqueeStrip />
      <CategoryGrid />
      <FeaturedRow />
      <EditorialSection />
      <BrandsSection />
      <TestimonialsSection />
      <StoreLocation />
      <Footer />
    </main>
  )
}
