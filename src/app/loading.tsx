export default function Loading() {
  return (
    <main className="route-state" aria-busy="true" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">Loading AMIGOS Connect</span>
    </main>
  );
}
