'use client';

import { useState, useEffect } from 'react';
import { getScintillaProfile } from '@/lib/scintilla-storage';
import ScintillaShell from '@/components/scintilla/ScintillaShell';
import ScintillaDashboard from '@/components/scintilla/ScintillaDashboard';
import ScintillaOnboarding from '@/components/scintilla/ScintillaOnboarding';

export default function ScintillaHome() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    setHasProfile(getScintillaProfile() !== null);
  }, []);

  if (hasProfile === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#F59E0B' }}>✦</div>
      </div>
    );
  }

  if (!hasProfile) {
    return <ScintillaOnboarding onComplete={() => setHasProfile(true)} />;
  }

  return (
    <ScintillaShell>
      <ScintillaDashboard />
    </ScintillaShell>
  );
}
