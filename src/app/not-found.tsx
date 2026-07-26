import Link from "next/link";

export default function NotFound() {
  return (
    <main className="route-state">
      <section className="state-card">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The address you opened does not exist in AMIGOS Connect.</p>
        <Link className="route-action" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
