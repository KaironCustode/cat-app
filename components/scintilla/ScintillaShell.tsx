'use client';

import { usePathname, useRouter } from 'next/navigation';

const AMBER = '#F59E0B';
const MUTED = 'var(--text-tertiary)';

const TABS = [
  {
    path: '/scintilla',
    label: 'Casa',
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? AMBER : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/scintilla/log',
    label: 'Diario',
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? AMBER : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    path: '/scintilla/chat',
    label: 'Aiuto',
    icon: (active: boolean) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke={active ? AMBER : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

export default function ScintillaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ paddingBottom: '80px' }}>
        {children}
      </div>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          background: 'rgba(11, 17, 32, 0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 24px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {tab.icon(isActive)}
              <span style={{
                fontSize: '12px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? AMBER : MUTED,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
