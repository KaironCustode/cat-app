'use client';

import { useState, useEffect } from 'react';
import {
  getTodayScintillaLog,
  saveScintillaLog,
  generateScintillaContext,
} from '@/lib/scintilla-storage';
import { ScintillaLog } from '@/lib/scintilla-storage';

const AMBER = '#F59E0B';

type CigOption = { label: string; value: number };
const CIG_OPTIONS: CigOption[] = [
  { label: 'Nessuna', value: 0 },
  { label: '1–5', value: 3 },
  { label: '6–10', value: 8 },
  { label: 'Più di 10', value: 15 },
];

type MoodOption = { label: string; emoji: string; value: 1 | 2 | 3 | 4 };
const MOOD_OPTIONS: MoodOption[] = [
  { label: 'Difficile', emoji: '😔', value: 1 },
  { label: 'Così così', emoji: '😐', value: 2 },
  { label: 'Abbastanza bene', emoji: '🙂', value: 3 },
  { label: 'Bene', emoji: '😊', value: 4 },
];

export default function LogGiornaliero() {
  const today = new Date().toISOString().split('T')[0];
  const existing = getTodayScintillaLog();

  const [cigValue, setCigValue] = useState<number | null>(existing?.cigarettesSmoked ?? null);
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | null>(existing?.mood ?? null);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saved, setSaved] = useState(false);
  const [aiResponse, setAiResponse] = useState(existing?.aiResponse ?? '');
  const [saving, setSaving] = useState(false);

  const canSave = cigValue !== null && mood !== null;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);

    const logData = {
      date: today,
      cigarettesSmoked: cigValue!,
      mood: mood!,
      notes: notes.trim(),
    };

    // Get AI response
    let aiResp = '';
    try {
      const logText = `Sigarette oggi: ${cigValue === 0 ? 'nessuna' : cigValue === 3 ? '1-5' : cigValue === 8 ? '6-10' : 'più di 10'}. Umore: ${MOOD_OPTIONS.find(m => m.value === mood)?.label}${notes ? `. Note: "${notes}"` : ''}.`;
      const res = await fetch('/api/scintilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: logText }],
          contextDocument: generateScintillaContext(),
          mode: 'log',
          logEntry: logText,
        }),
      });
      const data = await res.json();
      aiResp = data.response || '';
    } catch { /* silent */ }

    saveScintillaLog({ ...logData, aiResponse: aiResp });
    setAiResponse(aiResp);
    setSaved(true);
    setSaving(false);
  };

  const today_it = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div style={{ padding: '28px 24px', maxWidth: '480px', margin: '0 auto' }}>

      <div className="animate-fadeIn" style={{ marginBottom: '32px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>
          {today_it}
        </p>
        <h1 style={{ fontSize: '26px', fontWeight: 700 }}>
          Com&apos;è andata oggi?
        </h1>
      </div>

      {/* Cigarettes */}
      <div style={{ marginBottom: '28px' }} className="animate-slideUp">
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '14px', fontWeight: 500 }}>
          Sigarette fumate oggi
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {CIG_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setCigValue(opt.value)}
              style={{
                padding: '20px',
                borderRadius: '14px',
                border: cigValue === opt.value ? `2px solid ${AMBER}` : '2px solid rgba(255,255,255,0.08)',
                background: cigValue === opt.value ? 'rgba(245,158,11,0.12)' : 'var(--bg-card)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <span style={{
                fontSize: '18px',
                fontWeight: 700,
                color: cigValue === opt.value ? AMBER : 'var(--text-primary)',
              }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div style={{ marginBottom: '28px' }} className="animate-slideUp">
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '14px', fontWeight: 500 }}>
          Come ti senti?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMood(opt.value)}
              style={{
                padding: '18px 12px',
                borderRadius: '14px',
                border: mood === opt.value ? `2px solid ${AMBER}` : '2px solid rgba(255,255,255,0.08)',
                background: mood === opt.value ? 'rgba(245,158,11,0.12)' : 'var(--bg-card)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>{opt.emoji}</span>
              <span style={{
                fontSize: '14px',
                fontWeight: 500,
                color: mood === opt.value ? AMBER : 'var(--text-secondary)',
              }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Note (optional) */}
      <div style={{ marginBottom: '32px' }} className="animate-slideUp">
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '10px', fontWeight: 500 }}>
          Qualcosa da aggiungere? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(facoltativo)</span>
        </p>
        <input
          className="input-premium"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Una frase, un pensiero..."
          style={{ fontSize: '16px', padding: '16px' }}
        />
      </div>

      {/* Save button */}
      {!saved ? (
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            width: '100%',
            padding: '22px',
            borderRadius: '16px',
            background: canSave && !saving ? AMBER : 'var(--bg-card)',
            color: canSave && !saving ? '#0B1120' : 'var(--text-muted)',
            border: 'none',
            fontSize: '18px',
            fontWeight: 700,
            cursor: canSave && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Salvo...' : 'Salva'}
        </button>
      ) : (
        <div className="animate-fadeIn">
          <div style={{
            textAlign: 'center',
            padding: '20px',
            marginBottom: '20px',
            color: '#4ADE80',
            fontSize: '17px',
            fontWeight: 600,
          }}>
            ✓ Salvato
          </div>

          {aiResponse && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '20px',
              borderLeft: `3px solid ${AMBER}`,
            }}>
              <p style={{
                fontSize: '16px',
                color: 'var(--text-primary)',
                lineHeight: '1.7',
              }}>
                {aiResponse}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
