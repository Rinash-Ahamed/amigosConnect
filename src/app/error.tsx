"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="route-state">
      <section className="state-card" role="alert">
        <p className="eyebrow">Something went wrong</p>
        <h1>AMIGOS Connect could not load</h1>
        <p>Check your connection and try again.</p>
        <button className="route-action" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
