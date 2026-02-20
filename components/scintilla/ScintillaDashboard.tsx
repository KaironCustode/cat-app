'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getScintillaProfile,
  getScintillaDayCount,
  getScintillaCigarettesNotSmoked,
  getScintillaConsecutiveCleanDays,
  getScintillaTodayCravings,
} from '@/lib/scintilla-storage';

const AMBER = '#F59E0B';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function ScintillaDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(getScintillaProfile());
  const [dayCount, setDayCount] = useState(0);
  const [notSmoked, setNotSmoked] = useState(0);
  const [cleanDays, setCleanDays] = useState(0);
  const [todayCravings, setTodayCravings] = useState(0);

  useEffect(() => {
    setProfile(getScintillaProfile());
    setDayCount(getScintillaDayCount());
    setNotSmoked(getScintillaCigarettesNotSmoked());
    setCleanDays(getScintillaConsecutiveCleanDays());
    setTodayCravings(getScintillaTodayCravings());
  }, []);

  if (!profile) return null;

  return (
    <div style={{ padding: '28px 24px', maxWidth: '480px', margin: '0 auto' }}>

      {/* Greeting */}
      <div className="animate-fadeIn" style={{ marginBottom: '32px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '4px' }}>
          {getGreeting()}, {profile.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1, color: AMBER }}>
            {dayCount}
          </h1>
          <span style={{ color: 'var(--text-secondary)', fontSize: '20px' }}>
            {dayCount === 1 ? 'giorno' : 'giorni'}
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '4px' }}>
          senza fumare
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}
        className="animate-slideUp">
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '18px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '30px', fontWeight: 700, color: '#4ADE80' }}>{notSmoked}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            sigarette non fumate
          </p>
        </div>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '18px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '30px', fontWeight: 700, color: AMBER }}>{cleanDays}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {cleanDays === 1 ? 'giorno pulito' : 'giorni puliti'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        className="stagger-children">

        <button
          onClick={() => router.push('/scintilla/voglia')}
          style={{
            width: '100%',
            padding: '22px',
            borderRadius: '16px',
            background: 'rgba(245,158,11,0.15)',
            border: `2px solid ${AMBER}`,
            color: AMBER,
            fontSize: '19px',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Ho voglia di fumare
        </button>

        <button
          onClick={() => router.push('/scintilla/emergenza')}
          style={{
            width: '100%',
            padding: '22px',
            borderRadius: '16px',
            background: 'rgba(239,68,68,0.12)',
            border: '2px solid rgba(239,68,68,0.6)',
            color: '#F87171',
            fontSize: '19px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Sto per cedere
        </button>

        <button
          onClick={() => router.push('/scintilla/log')}
          style={{
            width: '100%',
            padding: '20px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-primary)',
            fontSize: '17px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Diario di oggi
        </button>
      </div>

      {/* Today cravings */}
      {todayCravings > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'var(--bg-card)',
          color: 'var(--text-muted)',
          fontSize: '14px',
          textAlign: 'center',
        }}>
          Oggi hai resistito a {todayCravings} {todayCravings === 1 ? 'voglia' : 'voglie'}. Bene.
        </div>
      )}

      {/* Why I quit */}
      {profile.whyIQuit && (
        <div style={{
          marginTop: '24px',
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
        }}
          className="animate-fadeIn">
          <p style={{ fontSize: '12px', color: AMBER, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Perché lo fai
          </p>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', lineHeight: '1.6', fontStyle: 'italic' }}>
            &ldquo;{profile.whyIQuit}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
