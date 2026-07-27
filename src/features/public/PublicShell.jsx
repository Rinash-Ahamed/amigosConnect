"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import Cursor from "./components/Cursor";
import Loader from "./components/Loader";
import Navbar from "./components/Navbar";

export function PublicShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const lenisRef = useRef(null);

  useEffect(() => {
    document.body.classList.add("public-body");
    router.prefetch("/connect");
    return () => {
      document.body.classList.remove("public-body");
      document.body.style.overflow = "";
    };
  }, [router]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      duration: 1.4,
      easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const update = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
      ScrollTrigger.refresh();
    });
  }, [pathname]);

  return (
    <div className="public-site">
      {!loaded && <Loader onComplete={() => setLoaded(true)} />}
      <div
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.6s ease",
          willChange: "opacity",
        }}
      >
        <div className="custom-cursor-wrapper">
          <Cursor />
        </div>
        <Navbar />
        {children}
      </div>
    </div>
  );
}
