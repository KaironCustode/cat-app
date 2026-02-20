'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, getDayCount, getCleanDays, getRecentCravingPatterns, addCraving } from '@/lib/spark-storage';
import BreathingExercise from './BreathingExercise';
import CountdownTimer from './CountdownTimer';

type Step = 'ground' | 'halt' | 'breathe' | 'why' | 'timer' | 'outcome';

export default function EmergencyRecalibration() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('ground');
  const [halt, setHalt] = useState({ hungry: false, angry: false, lonely: false, tired: false });

  const profile = getProfile();
  const dayCount = getDayCount();
  const cleanDays = getCleanDays();
  const patterns = getRecentCravingPatterns(7);

  const handleOutcome = (outcome: 'resisted' | 'used') => {
    addCraving({
      intensity: 10,
      trigger: 'Emergency',
      haltState: halt,
      waited: true,
      waitedMinutes: 10,
      outcome,
    });

    setStep('outcome');
    setTimeout(() => router.push('/'), 3000);
  };

  const handleTimerComplete = useCallback(() => {}, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} className="container-app">
      <div style={{ paddingTop: '32px' }}>

        {/* Step: Ground */}
        {step === 'ground' && (
          <div className="animate-fadeIn" style={{ textAlign: 'center', paddingTop: '40px' }}>
            <h1 className="text-display" style={{ marginBottom: '24px', color: 'var(--emergency)' }}>
              Stop.
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.8' }}>
              Breathe. You&apos;re here because you&apos;re fighting.
            </p>
            <p style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '40px', lineHeight: '1.8' }}>
              That matters.
            </p>

            {dayCount > 0 && (
              <div className="card-accent" style={{ padding: '20px', marginBottom: '32px', textAlign: 'left' }}>
                <p style={{ fontSize: '14px', color: 'var(--accent-primary)', marginBottom: '8px' }}>Your progress</p>
                <p style={{ fontSize: '28px', fontWeight: 700 }}>Day {dayCount}</p>
                {cleanDays > 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {cleanDays} clean days &middot; {patterns.resistedCount} cravings resisted this week
                  </p>
                )}
              </div>
            )}

            <button className="btn-primary" onClick={() => setStep('halt')} style={{ width: '100%', padding: '18px' }}>
              Continue
            </button>
          </div>
        )}

        {/* Step: HALT */}
        {step === 'halt' && (
          <div className="animate-slideUp">
            <h2 className="text-heading" style={{ marginBottom: '8px' }}>Quick check</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Is this really about the substance?
            </p>

            {(['hungry', 'angry', 'lonely', 'tired'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHalt(prev => ({ ...prev, [h]: !prev[h] }))}
                className="card-premium"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '16px 20px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  border: halt[h] ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                  background: halt[h] ? 'var(--accent-light)' : 'var(--bg-card)',
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                  {h === 'hungry' ? 'Hungry?' : h === 'angry' ? 'Angry / Frustrated?' : h === 'lonely' ? 'Lonely?' : 'Tired?'}
                </span>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: halt[h] ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', color: halt[h] ? '#0B1120' : 'var(--text-muted)',
                }}>
                  {halt[h] ? '✓' : ''}
                </span>
              </button>
            ))}

            {Object.values(halt).some(Boolean) && (
              <div className="card-soft" style={{ padding: '14px 18px', marginTop: '12px', marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                  {halt.hungry && 'Eat something first. '}
                  {halt.angry && 'Five deep breaths. '}
                  {halt.lonely && 'Text someone, anyone. '}
                  {halt.tired && 'Lie down for 10 minutes. '}
                  Address this first &mdash; then decide.
                </p>
              </div>
            )}

            <button className="btn-primary" onClick={() => setStep('breathe')} style={{ width: '100%', marginTop: '16px', padding: '18px' }}>
              Let me breathe first
            </button>
          </div>
        )}

        {/* Step: Breathe */}
        {step === 'breathe' && (
          <div className="animate-scaleIn" style={{ paddingTop: '40px' }}>
            <h2 className="text-heading" style={{ marginBottom: '32px', textAlign: 'center' }}>
              4-7-8 Breathing
            </h2>
            <BreathingExercise onComplete={() => setStep('why')} />
          </div>
        )}

        {/* Step: Read your why */}
        {step === 'why' && (
          <div className="animate-fadeIn" style={{ paddingTop: '20px' }}>
            <h2 className="text-heading" style={{ marginBottom: '24px' }}>Remember why</h2>

            {profile?.whyIQuit && (
              <div className="card-accent" style={{ padding: '24px', marginBottom: '32px' }}>
                <p style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your words
                </p>
                <p style={{ fontSize: '17px', lineHeight: '1.8', fontStyle: 'italic' }}>
                  &ldquo;{profile.whyIQuit}&rdquo;
                </p>
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
              You wrote those words for this exact moment.
              The craving will pass. It always does.
            </p>

            <button className="btn-primary" onClick={() => setStep('timer')} style={{ width: '100%', padding: '18px' }}>
              Start 10-minute timer
            </button>
          </div>
        )}

        {/* Step: Timer */}
        {step === 'timer' && (
          <div className="animate-scaleIn" style={{ paddingTop: '40px', textAlign: 'center' }}>
            <h2 className="text-heading" style={{ marginBottom: '24px' }}>Just 10 minutes</h2>
            <CountdownTimer durationMinutes={10} onComplete={handleTimerComplete} />

            <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
              <button className="btn-secondary" onClick={() => handleOutcome('used')} style={{ flex: 1 }}>
                I used
              </button>
              <button className="btn-primary" onClick={() => handleOutcome('resisted')} style={{ flex: 1 }}>
                I made it
              </button>
            </div>
          </div>
        )}

        {/* Step: Outcome */}
        {step === 'outcome' && (
          <div className="animate-scaleIn" style={{ textAlign: 'center', paddingTop: '80px' }}>
            <h2 className="text-heading" style={{ marginBottom: '16px' }}>
              Logged.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Whatever happened, you came here first. That&apos;s not nothing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
