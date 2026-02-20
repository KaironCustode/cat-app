'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
  durationMinutes: number;
  onComplete: () => void;
  autoStart?: boolean;
}

export default function CountdownTimer({ durationMinutes, onComplete, autoStart = true }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, onComplete]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 1 - secondsLeft / (durationMinutes * 60);

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Circular progress */}
      <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 16px' }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="var(--bg-card)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 70}
            strokeDashoffset={2 * Math.PI * 70 * (1 - progress)}
            transform="rotate(-90 80 80)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '36px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {secondsLeft > 0 && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Cravings peak and pass. Ride it out.
        </p>
      )}

      {secondsLeft === 0 && (
        <p style={{ color: 'var(--success)', fontSize: '15px', fontWeight: 600 }}>
          The peak has passed. How did it go?
        </p>
      )}
    </div>
  );
}
