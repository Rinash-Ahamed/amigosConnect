import { useState, useEffect } from 'react'

export function useInView(ref, { threshold = 0.15 } = {}) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.disconnect()
      }
    }, { threshold })

    const el = ref.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [ref, threshold])

  return inView
}
