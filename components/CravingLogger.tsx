'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { addCraving, updateCraving } from '@/lib/spark-storage';
import { TRIGGER_OPTIONS, CravingEntry } from '@/lib/types';
import CountdownTimer from './CountdownTimer';

type Step = 'intensity' | 'trigger' | 'halt' | 'timer' | 'outcome';

export default function CravingLogger() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intensity');
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');
  const [customTrigger, setCustomTrigger] = useState('');
  const [halt, setHalt] = useState({ hungry: false, angry: false, lonely: false, tired: false });
  const [savedEntry, setSavedEntry] = useState<CravingEntry | null>(null);
  const [timerDone, setTimerDone] = useState(false);

  const handleStartTimer = () => {
    const entry = addCraving({
      intensity,
      trigger: trigger === 'Other' ? customTrigger : trigger,
      haltState: halt,
      waited: false,
      outcome: 'pending',
    });
    setSavedEntry(entry);
    setStep('timer');
  };

  const handleOutcome = (outcome: 'resisted' | 'used') => {
    if (savedEntry) {
      updateCraving(savedEntry.id, {
        outcome,
        waited: timerDone,
        waitedMinutes: timerDone ? 10 : undefined,
      });
    }
    setStep('outcome');

    setTimeout(() => router.push('/'), 2000);
  };

  const handleTimerComplete = useCallback(() => {
    setTimerDone(true);
  }, []);

  return (
    <div className="container-app" style={{ paddingTop: '24px', minHeight: '100vh' }}>
      {/* Back button */}
      <button
        className="btn-ghost"
        onClick={() => router.back()}
        style={{ marginBottom: '16px' }}
      >
        &larr; Back
      </button>

      {/* Step: Intensity */}
      {step === 'intensity' && (
        <div className="animate-slideUp">
          <h1 className="text-heading" style={{ marginBottom: '8px' }}>Craving logged</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            You&apos;re here instead of smoking. That counts.
          </p>

          <label style={{ display: 'block', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            How strong is it? ({intensity}/10)
          </label>

          <input
            type="range"
            min={1}
            max={10}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{
              width: '100%',
              marginBottom: '8px',
              accentColor: intensity > 7 ? 'var(--error)' : intensity > 4 ? 'var(--warning)' : 'var(--success)',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '32px' }}>
            <span>Manageable</span>
            <span>Intense</span>
          </div>

          <button className="btn-primary" onClick={() => setStep('trigger')} style={{ width: '100%' }}>
            Next
          </button>
        </div>
      )}

      {/* Step: Trigger */}
      {step === 'trigger' && (
        <div className="animate-slideUp">
          <h2 className="text-heading" style={{ marginBottom: '8px' }}>What triggered this?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Naming it takes some of its power away.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {TRIGGER_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTrigger(t)}
                className={trigger === t ? 'tag-accent' : 'tag'}
                style={{
                  cursor: 'pointer',
                  border: trigger === t ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  padding: '8px 14px',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {trigger === 'Other' && (
            <input
              className="input-premium"
              value={customTrigger}
              onChange={(e) => setCustomTrigger(e.target.value)}
              placeholder="What triggered this?"
              style={{ marginBottom: '16px' }}
            />
          )}

          <button
            className="btn-primary"
            onClick={() => setStep('halt')}
            disabled={!trigger || (trigger === 'Other' && !customTrigger.trim())}
            style={{ width: '100%' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Step: HALT Check */}
      {step === 'halt' && (
        <div className="animate-slideUp">
          <h2 className="text-heading" style={{ marginBottom: '8px' }}>HALT Check</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Sometimes the craving isn&apos;t really about the substance.
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
              <span style={{ fontSize: '16px', fontWeight: 500, textTransform: 'capitalize' }}>
                {h === 'hungry' ? 'Hungry?' : h === 'angry' ? 'Angry / Frustrated?' : h === 'lonely' ? 'Lonely / Isolated?' : 'Tired / Exhausted?'}
              </span>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: halt[h] ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: halt[h] ? '#0B1120' : 'var(--text-muted)',
              }}>
                {halt[h] ? '✓' : ''}
              </span>
            </button>
          ))}

          {Object.values(halt).some(Boolean) && (
            <div className="card-accent" style={{ padding: '14px 18px', marginTop: '12px', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {halt.hungry && 'Eat something first. Hunger amplifies cravings. '}
                {halt.angry && 'Take 5 deep breaths. Anger passes faster than you think. '}
                {halt.lonely && 'Text someone. Even a simple "hey" breaks the isolation. '}
                {halt.tired && 'Rest if you can. Exhaustion weakens your resolve. '}
              </p>
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleStartTimer}
            style={{ width: '100%', marginTop: '16px' }}
          >
            Start 10-minute timer
          </button>
        </div>
      )}

      {/* Step: Timer */}
      {step === 'timer' && (
        <div className="animate-scaleIn" style={{ textAlign: 'center', paddingTop: '40px' }}>
          <h2 className="text-heading" style={{ marginBottom: '24px' }}>Ride it out</h2>

          <CountdownTimer
            durationMinutes={10}
            onComplete={handleTimerComplete}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button
              className="btn-secondary"
              onClick={() => handleOutcome('used')}
              style={{ flex: 1 }}
            >
              I used
            </button>
            <button
              className="btn-primary"
              onClick={() => handleOutcome('resisted')}
              style={{ flex: 1 }}
            >
              I resisted
            </button>
          </div>
        </div>
      )}

      {/* Step: Outcome Confirmation */}
      {step === 'outcome' && (
        <div className="animate-scaleIn" style={{ textAlign: 'center', paddingTop: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {savedEntry?.outcome === 'resisted' ? '💪' : '📝'}
          </div>
          <h2 className="text-heading" style={{ marginBottom: '8px' }}>
            {savedEntry?.outcome === 'resisted' ? 'You made it.' : 'Logged.'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {savedEntry?.outcome === 'resisted'
              ? 'Every craving you ride out makes the next one weaker.'
              : 'That\'s data, not failure. What matters is you\'re still here.'}
          </p>
        </div>
      )}
    </div>
  );
}
