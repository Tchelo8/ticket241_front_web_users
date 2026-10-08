export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <main className="container" aria-busy="true">
      <p role="status" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink3)' }}>{label}</p>
    </main>
  );
}
