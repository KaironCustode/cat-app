'use client';

import { useState, useEffect } from 'react';
import { getProfile } from '@/lib/spark-storage';
import AppShell from '@/components/AppShell';
import Dashboard from '@/components/Dashboard';
import Onboarding from '@/components/Onboarding';

export default function Home() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    setHasProfile(getProfile() !== null);
  }, []);

  if (hasProfile === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse-soft text-gradient text-display">SPARK</div>
      </div>
    );
  }

  if (!hasProfile) {
    return <Onboarding onComplete={() => setHasProfile(true)} />;
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
