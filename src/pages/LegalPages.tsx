import { ShieldCheck } from '@phosphor-icons/react';
import { LegalPage } from '../components/LegalPage';
import { CGV, PRIVACY } from '../content/legal';

export function TermsPage() {
  return <LegalPage doc={CGV} />;
}

export function PrivacyPage() {
  return (
    <LegalPage
      doc={PRIVACY}
      asideExtra={
        <div style={{ marginTop: 18, padding: 16, borderRadius: 6, background: 'var(--surf)', display: 'flex', gap: 10 }}>
          <ShieldCheck size={20} color="var(--acc)" style={{ flex: 'none' }} aria-hidden />
          <span style={{ font: "400 13px/1.5 var(--font)", color: 'var(--ink2)' }}>Nous ne stockons aucune donnée de paiement.</span>
        </div>
      }
    />
  );
}
