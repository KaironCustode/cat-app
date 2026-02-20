'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, getDayCount, getCurrentPhase, getWeekSummary, getCravings, getCleanDays } from '@/lib/spark-storage';
import { JOURNEY_PHASES, UserProfile } from '@/lib/types';

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dayCount, setDayCount] = useState(0);
  const [cleanDays, setCleanDays] = useState(0);
  const [phase, setPhase] = useState(getCurrentPhase());
  const [weekSummary, setWeekSummary] = useState(getWeekSummary());
  const [todayCravings, setTodayCravings] = useState(0);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setDayCount(getDayCount());
    setCleanDays(getCleanDays());
    setPhase(getCurrentPhase());
    setWeekSummary(getWeekSummary());

    const today = new Date().toISOString().split('T')[0];
    const cravings = getCravings();
    setTodayCravings(cravings.filter(c => c.timestamp.startsWith(today)).length);
  }, []);

  if (!profile) return null;

  const phaseInfo = JOURNEY_PHASES[phase];

  return (
    <div className="container-app" style={{ paddingTop: '24px' }}>
      {/* Header */}
      <div className="animate-fadeIn" style={{ marginBottom: '32px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '4px' }}>
          Hey, {profile.name}
        </p>
        <h1 className="text-display">
          Day <span className="text-gradient">{dayCount}</span>
        </h1>
        <div className="tag-accent" style={{ marginTop: '8px' }}>
          {phaseInfo.label} &middot; {phaseInfo.daysRange}
        </div>
      </div>

      {/* Phase Card */}
      <div className="card-soft animate-slideUp" style={{ padding: '20px', marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
          {phaseInfo.description}
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }} className="animate-slideUp">
        <div className="card-premium" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>{cleanDays}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Clean days</p>
        </div>
        <div className="card-premium" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-primary)' }}>{todayCravings}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Cravings today</p>
        </div>
      </div>

      {/* Week Summary */}
      {weekSummary.avgMood > 0 && (
        <div className="card-premium animate-slideUp" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            This Week
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 600 }}>{weekSummary.avgMood}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Avg mood</p>
            </div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 600 }}>{weekSummary.cleanDays}/{weekSummary.cleanDays + weekSummary.usageDays}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Clean days</p>
            </div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 600 }}>{weekSummary.resistedCravings}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Cravings resisted</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          className="btn-primary"
          onClick={() => router.push('/craving')}
          style={{ width: '100%', padding: '18px', fontSize: '16px' }}
        >
          CRAVING NOW
        </button>

        <button
          className="btn-secondary"
          onClick={() => router.push('/anchor')}
          style={{ width: '100%' }}
        >
          Daily Anchor
        </button>

        <button
          className="btn-emergency"
          onClick={() => router.push('/emergency')}
          style={{ width: '100%' }}
        >
          I&apos;M ABOUT TO RELAPSE
        </button>
      </div>

      {/* Why I Quit - Always visible */}
      {profile.whyIQuit && (
        <div className="card-accent animate-fadeIn" style={{ padding: '20px', marginTop: '24px' }}>
          <p style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Remember why
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.6', fontStyle: 'italic' }}>
            &ldquo;{profile.whyIQuit}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
