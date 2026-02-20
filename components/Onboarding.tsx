'use client';

import { useState } from 'react';
import { saveProfile } from '@/lib/spark-storage';
import { UserProfile } from '@/lib/types';

interface Props {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [quitDate, setQuitDate] = useState('');
  const [primarySubstance, setPrimarySubstance] = useState<UserProfile['primarySubstance']>('cannabis');
  const [substanceHistory, setSubstanceHistory] = useState('');
  const [whyIQuit, setWhyIQuit] = useState('');

  const handleFinish = () => {
    saveProfile({
      name,
      quitDate,
      primarySubstance,
      substanceHistory,
      whyIQuit,
      journeyPhase: quitDate && new Date(quitDate) <= new Date() ? 'acute' : 'preparation',
    });
    onComplete();
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) return whyIQuit.trim().length > 0;
    return false;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="container-app">
      <div className="animate-fadeIn">
        {/* Progress */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '48px' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: 'var(--radius-full)',
                background: i <= step ? 'var(--accent-primary)' : 'var(--bg-card)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step 0: Name & Quit Date */}
        {step === 0 && (
          <div className="animate-slideUp">
            <h1 className="text-display" style={{ marginBottom: '8px' }}>
              <span className="text-gradient">SPARK</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.1rem' }}>
              Your honest companion for this journey.
            </p>

            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              What should I call you?
            </label>
            <input
              className="input-premium"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              style={{ marginBottom: '24px' }}
            />

            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              When did you quit (or plan to)?
            </label>
            <input
              className="input-premium"
              type="date"
              value={quitDate}
              onChange={(e) => setQuitDate(e.target.value)}
              style={{ marginBottom: '8px' }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Leave empty if you haven&apos;t set a date yet.
            </p>
          </div>
        )}

        {/* Step 1: Substance & History */}
        {step === 1 && (
          <div className="animate-slideUp">
            <h2 className="text-heading" style={{ marginBottom: '8px' }}>Your situation</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              No judgement. Just understanding.
            </p>

            <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Primary substance
            </label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
              {(['cannabis', 'tobacco', 'both'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setPrimarySubstance(s)}
                  className={primarySubstance === s ? 'tag-accent' : 'tag'}
                  style={{
                    padding: '10px 18px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    border: primarySubstance === s ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Brief history (how long, how much)
            </label>
            <textarea
              className="input-premium"
              value={substanceHistory}
              onChange={(e) => setSubstanceHistory(e.target.value)}
              placeholder="e.g. 15 years daily, 5-10 joints a day"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
        )}

        {/* Step 2: Why I Quit */}
        {step === 2 && (
          <div className="animate-slideUp">
            <h2 className="text-heading" style={{ marginBottom: '8px' }}>The anchor</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              This is the most important thing you&apos;ll write.
              When you forget why you&apos;re doing this &mdash; and you will &mdash;
              these words will bring you back.
            </p>

            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Why are you quitting?
            </label>
            <textarea
              className="input-premium"
              value={whyIQuit}
              onChange={(e) => setWhyIQuit(e.target.value)}
              placeholder="In your own words... Why now? What do you want back?"
              rows={6}
              autoFocus
              style={{ resize: 'vertical' }}
            />
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
          {step > 0 ? (
            <button className="btn-ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button
              className="btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Continue
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleFinish}
              disabled={!canProceed()}
            >
              Start my journey
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
