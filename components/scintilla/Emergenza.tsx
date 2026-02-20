'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getScintillaProfile,
  getScintillaDayCount,
  getScintillaCigarettesNotSmoked,
  addScintillaCraving,
  updateScintillaCraving,
  generateScintillaContext,
} from '@/lib/scintilla-storage';

const AMBER = '#F59E0B';
const DURATION = 5 * 60;

type Step = 'ground' | 'breathe' | 'timer' | 'outcome';

export default function Emergenza() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('ground');
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [cravingId, setCravingId] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [breathPhase, setBreathPhase] = useState<'inspira' | 'trattieni' | 'espira'>('inspira');
  const [breathTimer, setBreathTimer] = useState(4);

  const profile = getScintillaProfile();
  const dayCount = getScintillaDayCount();
  const notSmoked = getScintillaCigarettesNotSmoked();

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await fetch('/api/scintilla', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Sto per cedere, aiutami.' }],
            contextDocument: generateScintillaContext(),
            mode: 'emergency',
          }),
        });
        const data = await res.json();
        if (data.response) setAiMessage(data.response);
      } catch { /* silent */ }
    };
    fetchMessage();
  }, []);

  // Breathing cycle
  useEffect(() => {
    if (step !== 'breathe') return;
    const phases: { phase: typeof breathPhase; duration: number }[] = [
      { phase: 'inspira', duration: 4 },
      { phase: 'trattieni', duration: 4 },
      { phase: 'espira', duration: 4 },
    ];
    let idx = 0, countdown = 4;
    setBreathPhase(phases[0].phase);
    setBreathTimer(4);
    const interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        idx = (idx + 1) % phases.length;
        countdown = phases[idx].duration;
        setBreathPhase(phases[idx].phase);
      }
      setBreathTimer(countdown);
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Countdown timer
  useEffect(() => {
    if (step !== 'timer') return;
    const entry = addScintillaCraving('pending');
    setCravingId(entry.id);
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleOutcome = (outcome: 'resistito' | 'fumato') => {
    if (cravingId) updateScintillaCraving(cravingId, outcome);
    setStep('outcome');
    setTimeout(() => router.push('/scintilla'), 2500);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (secondsLeft / DURATION);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '40px 24px',
      maxWidth: '480px',
      margin: '0 auto',
    }}>

      {/* Ground */}
      {step === 'ground' && (
        <div className="animate-fadeIn" style={{ textAlign: 'center', paddingTop: '40px' }}>
          <h1 style={{ fontSize: '52px', fontWeight: 800, color: '#F87171', marginBottom: '24px' }}>
            Fermati.
          </h1>

          {aiMessage && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'left',
            }}>
              <p style={{ fontSize: '17px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                {aiMessage}
              </p>
            </div>
          )}

          {dayCount > 0 && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '32px',
              textAlign: 'left',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>
                Quello che hai già fatto
              </p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: AMBER }}>
                {dayCount} {dayCount === 1 ? 'giorno' : 'giorni'} senza fumare
              </p>
              {notSmoked > 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>
                  Circa {notSmoked} sigarette non fumate
                </p>
              )}
            </div>
          )}

          {profile?.whyIQuit && (
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '32px',
              textAlign: 'left',
            }}>
              <p style={{ fontSize: '13px', color: AMBER, marginBottom: '8px' }}>Perché stai facendo questo</p>
              <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontStyle: 'italic', lineHeight: '1.6' }}>
                &ldquo;{profile.whyIQuit}&rdquo;
              </p>
            </div>
          )}

          <button
            onClick={() => setStep('breathe')}
            style={{
              width: '100%', padding: '22px', borderRadius: '16px',
              background: AMBER, border: 'none',
              color: '#0B1120', fontSize: '18px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Respira con me
          </button>
        </div>
      )}

      {/* Breathe */}
      {step === 'breathe' && (
        <div style={{ textAlign: 'center', paddingTop: '60px' }} className="animate-scaleIn">
          <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '48px', color: 'var(--text-secondary)' }}>
            Un respiro alla volta
          </h2>

          <div style={{
            width: '160px', height: '160px', borderRadius: '50%',
            background: `rgba(245,158,11,${breathPhase === 'trattieni' ? '0.25' : '0.1'})`,
            border: `3px solid ${AMBER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
            transform: breathPhase === 'inspira' ? 'scale(1.12)' : breathPhase === 'espira' ? 'scale(0.9)' : 'scale(1.06)',
            transition: 'transform 1s ease-in-out, background 1s ease',
          }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: AMBER }}>{breathTimer}</span>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
            {breathPhase === 'inspira' ? 'Inspira' : breathPhase === 'trattieni' ? 'Trattieni' : 'Espira'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '48px' }}>lentamente</p>

          <button
            onClick={() => setStep('timer')}
            style={{
              width: '100%', padding: '22px', borderRadius: '16px',
              background: AMBER, border: 'none',
              color: '#0B1120', fontSize: '18px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Aspetta 5 minuti
          </button>
        </div>
      )}

      {/* Timer */}
      {step === 'timer' && (
        <div className="animate-scaleIn" style={{ textAlign: 'center', paddingTop: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '40px', color: 'var(--text-secondary)' }}>
            Solo 5 minuti
          </h2>

          <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 48px' }}>
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--bg-card)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="80" fill="none"
                stroke="#F87171" strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }}>
              <span style={{ fontSize: '42px', fontWeight: 800, color: '#F87171' }}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleOutcome('fumato')}
              style={{
                flex: 1, padding: '20px', borderRadius: '14px',
                background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-muted)', fontSize: '16px', cursor: 'pointer',
              }}
            >
              Ho fumato
            </button>
            <button
              onClick={() => handleOutcome('resistito')}
              style={{
                flex: 1, padding: '20px', borderRadius: '14px',
                background: AMBER, border: 'none',
                color: '#0B1120', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Ce l&apos;ho fatta
            </button>
          </div>
        </div>
      )}

      {/* Outcome */}
      {step === 'outcome' && (
        <div style={{ textAlign: 'center', paddingTop: '100px' }} className="animate-scaleIn">
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Fatto.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Qualunque cosa sia successa, sei venuto qui prima. Non è poco.
          </p>
        </div>
      )}
    </div>
  );
}
