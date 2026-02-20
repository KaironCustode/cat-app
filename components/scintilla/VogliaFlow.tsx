'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { addScintillaCraving, updateScintillaCraving, generateScintillaContext } from '@/lib/scintilla-storage';

const AMBER = '#F59E0B';
const DURATION = 5 * 60; // 5 minutes in seconds

type Step = 'start' | 'timer' | 'breathe' | 'outcome';

export default function VogliaFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('start');
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [cravingId, setCravingId] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [breathPhase, setBreathPhase] = useState<'inspira' | 'trattieni' | 'espira'>('inspira');
  const [breathTimer, setBreathTimer] = useState(4);
  const breathRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch AI message on mount
  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const context = generateScintillaContext();
        const res = await fetch('/api/scintilla', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Ho voglia di fumare.' }],
            contextDocument: context,
            mode: 'craving',
          }),
        });
        const data = await res.json();
        if (data.response) setAiMessage(data.response);
      } catch { /* silent fail */ }
    };
    fetchMessage();
  }, []);

  const startTimer = useCallback(() => {
    const entry = addScintillaCraving('pending');
    setCravingId(entry.id);
    setStep('timer');

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Breathing cycle
  useEffect(() => {
    if (step !== 'breathe') return;

    const phases: { phase: typeof breathPhase; duration: number }[] = [
      { phase: 'inspira', duration: 4 },
      { phase: 'trattieni', duration: 4 },
      { phase: 'espira', duration: 4 },
    ];
    let phaseIdx = 0;
    let countdown = phases[0].duration;
    setBreathPhase(phases[0].phase);
    setBreathTimer(countdown);

    const interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        countdown = phases[phaseIdx].duration;
        setBreathPhase(phases[phaseIdx].phase);
      }
      setBreathTimer(countdown);
    }, 1000);

    breathRef.current = setTimeout(() => {
      clearInterval(interval);
      setStep('timer');
    }, 60 * 1000); // 1 minute of breathing then back to timer

    return () => {
      clearInterval(interval);
      if (breathRef.current) clearTimeout(breathRef.current);
    };
  }, [step]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleOutcome = (outcome: 'resistito' | 'fumato') => {
    if (cravingId) updateScintillaCraving(cravingId, outcome);
    setStep('outcome');
    setTimeout(() => router.push('/scintilla'), 2500);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = (DURATION - secondsLeft) / DURATION;

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: '480px', margin: '0 auto' }}>

      {/* Step: Start */}
      {step === 'start' && (
        <div className="animate-fadeIn" style={{ textAlign: 'center', paddingTop: '40px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 800, color: AMBER, marginBottom: '24px' }}>
            Aspetta.
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-primary)', lineHeight: '1.8', marginBottom: '16px' }}>
            La voglia di fumare passa in circa 5 minuti.
          </p>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '32px' }}>
            Sempre. Ogni volta.
          </p>

          {aiMessage && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '36px',
              textAlign: 'left',
            }}>
              <p style={{ fontSize: '16px', color: 'var(--text-primary)', lineHeight: '1.7' }}>
                {aiMessage}
              </p>
            </div>
          )}

          <button
            onClick={startTimer}
            style={{
              width: '100%',
              padding: '22px',
              borderRadius: '16px',
              background: AMBER,
              color: '#0B1120',
              border: 'none',
              fontSize: '19px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Aspetto 5 minuti
          </button>
        </div>
      )}

      {/* Step: Timer */}
      {step === 'timer' && (
        <div className="animate-scaleIn" style={{ textAlign: 'center', paddingTop: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '40px', color: 'var(--text-secondary)' }}>
            Tieni duro
          </h2>

          {/* Circular timer */}
          <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 40px' }}>
            <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--bg-card)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="80" fill="none"
                stroke={AMBER} strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '42px', fontWeight: 800, color: AMBER }}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <button
            onClick={() => setStep('breathe')}
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '32px',
            }}
          >
            Respira con me
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleOutcome('fumato')}
              style={{
                flex: 1, padding: '18px', borderRadius: '14px',
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)', fontSize: '16px', cursor: 'pointer',
              }}
            >
              Ho fumato
            </button>
            <button
              onClick={() => handleOutcome('resistito')}
              style={{
                flex: 1, padding: '18px', borderRadius: '14px',
                background: AMBER, border: 'none',
                color: '#0B1120', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Ce l&apos;ho fatta
            </button>
          </div>
        </div>
      )}

      {/* Step: Breathe */}
      {step === 'breathe' && (
        <div style={{ textAlign: 'center', paddingTop: '60px' }} className="animate-scaleIn">
          <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '15px' }}>
            Un minuto di respiro
          </p>

          {/* Pulsing circle */}
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

          <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {breathPhase === 'inspira' ? 'Inspira' : breathPhase === 'trattieni' ? 'Trattieni' : 'Espira'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>lentamente</p>

          <button
            onClick={() => setStep('timer')}
            style={{
              marginTop: '48px', padding: '14px 28px', borderRadius: '12px',
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)', fontSize: '15px', cursor: 'pointer',
            }}
          >
            Torna al timer
          </button>
        </div>
      )}

      {/* Step: Outcome */}
      {step === 'outcome' && (
        <div style={{ textAlign: 'center', paddingTop: '100px' }} className="animate-scaleIn">
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
            Registrato.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Sei venuto qui. Questo conta.
          </p>
        </div>
      )}
    </div>
  );
}
