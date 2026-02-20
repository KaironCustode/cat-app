'use client';

import { useRouter } from 'next/navigation';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {children}

      {/* Floating Craving Button */}
      <button
        onClick={() => router.push('/craving')}
        style={{
          position: 'fixed',
          bottom: '88px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--accent-gradient)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-accent)',
          zIndex: 40,
          transition: 'all 0.3s ease',
        }}
        title="Log a craving"
        aria-label="Log a craving"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B1120" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12h14" />
        </svg>
      </button>

      <BottomNav />
    </div>
  );
}
