import React, { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef = useRef(null)
  const followerRef = useRef(null)
  const pos = useRef({ x: 0, y: 0 })
  const followerPos = useRef({ x: 0, y: 0 })
  const raf = useRef(null)

  useEffect(() => {
    const dot = dotRef.current
    const follower = followerRef.current
    if (!dot || !follower) return

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      dot.style.left = `${e.clientX}px`
      dot.style.top = `${e.clientY}px`
    }

    const lerp = (a, b, t) => a + (b - a) * t

    const animate = () => {
      followerPos.current.x = lerp(followerPos.current.x, pos.current.x, 0.12)
      followerPos.current.y = lerp(followerPos.current.y, pos.current.y, 0.12)
      follower.style.left = `${followerPos.current.x}px`
      follower.style.top = `${followerPos.current.y}px`
      raf.current = requestAnimationFrame(animate)
    }

    const onHoverEnter = () => {
      dot.classList.add('cursor--hover')
      follower.classList.add('cursor--hover')
    }
    const onHoverLeave = () => {
      dot.classList.remove('cursor--hover')
      follower.classList.remove('cursor--hover')
    }

    window.addEventListener('mousemove', onMove)
    raf.current = requestAnimationFrame(animate)

    const interactables = document.querySelectorAll('a, button, [data-cursor]')
    interactables.forEach(el => {
      el.addEventListener('mouseenter', onHoverEnter)
      el.addEventListener('mouseleave', onHoverLeave)
    })

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor" />
      <div ref={followerRef} className="cursor-follower" />
    </>
  )
}
