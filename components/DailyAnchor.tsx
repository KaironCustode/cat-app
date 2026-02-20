'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateContextDocument, getProfile, getDayCount } from '@/lib/spark-storage';
import { JOURNEY_PHASES } from '@/lib/types';

export default function DailyAnchor() {
  const router = useRouter();
  const [anchorText, setAnchorText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const profile = getProfile();
  const dayCount = getDayCount();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `spark_anchor_${today}`;

    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setAnchorText(cached);
      setIsLoading(false);
      return;
    }

    // Generate fresh
    const fetchAnchor = async () => {
      try {
        const contextDocument = generateContextDocument();
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Generate my daily anchor for today.' }],
            contextDocument,
            mode: 'daily-anchor',
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setAnchorText(data.response);
        localStorage.setItem(cacheKey, data.response);
      } catch (err) {
        console.error('Anchor error:', err);
        setError('Could not generate anchor. Check your connection.');

        // Fallback to static anchor
        if (profile) {
          const phase = JOURNEY_PHASES[profile.journeyPhase];
          setAnchorText(
            `Good morning, ${profile.name}.\n\nDay ${dayCount}. ${phase.label}.\n\n${phase.description}\n\nRemember why you're doing this:\n"${profile.whyIQuit}"\n\nOne day at a time. You've got this.`
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnchor();
  }, []);

  return (
    <div className="container-app" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      <button className="btn-ghost" onClick={() => router.back()} style={{ marginBottom: '16px' }}>
        &larr; Back
      </button>

      <h1 className="text-heading" style={{ marginBottom: '4px' }}>Daily Anchor</h1>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '24px' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="skeleton" style={{ height: '20px', width: '60%' }} />
          <div className="skeleton" style={{ height: '16px', width: '100%' }} />
          <div className="skeleton" style={{ height: '16px', width: '90%' }} />
          <div className="skeleton" style={{ height: '16px', width: '95%' }} />
          <div className="skeleton" style={{ height: '16px', width: '70%' }} />
          <div className="skeleton" style={{ height: '20px', width: '50%', marginTop: '12px' }} />
          <div className="skeleton" style={{ height: '16px', width: '85%' }} />
          <div className="skeleton" style={{ height: '16px', width: '80%' }} />
        </div>
      ) : error && !anchorText ? (
        <div className="card-soft" style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--error)' }}>{error}</p>
        </div>
      ) : (
        <div className="card-premium animate-fadeIn" style={{ padding: '24px' }}>
          {anchorText.split('\n').map((line, i) => (
            <p key={i} style={{
              color: 'var(--text-primary)',
              fontSize: '15px',
              lineHeight: '1.8',
              marginBottom: line.trim() === '' ? '16px' : '4px',
            }}>
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
