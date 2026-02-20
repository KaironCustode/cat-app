'use client';

import { useState, useEffect } from 'react';

type Phase = 'inhale' | 'hold' | 'exhale';

const PHASES: { phase: Phase; duration: number; label: string }[] = [
  { phase: 'inhale', duration: 4, label: 'Breathe in' },
  { phase: 'hold', duration: 7, label: 'Hold' },
  { phase: 'exhale', duration: 8, label: 'Breathe out' },
];

export default function BreathingExercise({ onComplete }: { onComplete?: () => void }) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].duration);
  const [cycles, setCycles] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const totalCycles = 3;

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextIndex = (currentPhaseIndex + 1) % PHASES.length;

          if (nextIndex === 0) {
            const newCycles = cycles + 1;
            if (newCycles >= totalCycles) {
              setIsActive(false);
              onComplete?.();
              return 0;
            }
            setCycles(newCycles);
          }

          setCurrentPhaseIndex(nextIndex);
          return PHASES[nextIndex].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, currentPhaseIndex, cycles, onComplete]);

  const currentPhase = PHASES[currentPhaseIndex];
  const scale = currentPhase.phase === 'inhale' ? 1.3 : currentPhase.phase === 'hold' ? 1.3 : 1;

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Breathing circle */}
      <div style={{
        width: '180px',
        height: '180px',
        margin: '0 auto 24px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',
        border: '2px solid var(--accent-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${scale})`,
        transition: `transform ${currentPhase.duration}s ease-in-out`,
        opacity: isActive ? 1 : 0.5,
      }}>
        <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-primary)' }}>
          {currentPhase.label}
        </span>
        <span style={{ fontSize: '32px', fontWeight: 700, marginTop: '4px' }}>
          {secondsLeft}
        </span>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        {isActive
          ? `Cycle ${cycles + 1} of ${totalCycles}`
          : 'Done. Take a moment.'}
      </p>
    </div>
  );
}
