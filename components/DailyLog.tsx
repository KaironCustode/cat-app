'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveDailyLog, getDailyLogs, getTodayLog } from '@/lib/spark-storage';
import { SYMPTOM_OPTIONS, DailyLog as DailyLogType } from '@/lib/types';

type View = 'form' | 'history';

export default function DailyLog() {
  const router = useRouter();
  const [view, setView] = useState<View>('form');
  const [cannabisCount, setCannabisCount] = useState(0);
  const [tobaccoCount, setTobaccoCount] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<DailyLogType[]>([]);

  useEffect(() => {
    const today = getTodayLog();
    if (today) {
      setCannabisCount(today.cannabisCount);
      setTobaccoCount(today.tobaccoCount);
      setSymptoms(today.symptoms);
      setMood(today.mood);
      setNotes(today.notes);
    }
    setHistory(getDailyLogs(30));
  }, []);

  const toggleSymptom = (id: string) => {
    setSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    saveDailyLog({
      date: today,
      cannabisCount,
      tobaccoCount,
      symptoms,
      mood,
      notes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setHistory(getDailyLogs(30));
  };

  return (
    <div className="container-app" style={{ paddingTop: '24px', paddingBottom: '100px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className={view === 'form' ? 'tag-accent' : 'tag'}
          onClick={() => setView('form')}
          style={{ cursor: 'pointer', padding: '8px 16px', border: view === 'form' ? '1px solid var(--accent-primary)' : '1px solid transparent' }}
        >
          Today
        </button>
        <button
          className={view === 'history' ? 'tag-accent' : 'tag'}
          onClick={() => setView('history')}
          style={{ cursor: 'pointer', padding: '8px 16px', border: view === 'history' ? '1px solid var(--accent-primary)' : '1px solid transparent' }}
        >
          History
        </button>
      </div>

      {/* Form View */}
      {view === 'form' && (
        <div className="animate-fadeIn">
          <h1 className="text-heading" style={{ marginBottom: '4px' }}>Daily Log</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '14px' }}>
            Honest data. No judgement.
          </p>

          {/* Cannabis count */}
          <div className="card-premium" style={{ padding: '16px 20px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px' }}>Cannabis today</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setCannabisCount(Math.max(0, cannabisCount - 1))}
                  className="btn-icon"
                  style={{ width: '36px', height: '36px', fontSize: '18px' }}
                >
                  -
                </button>
                <span style={{ fontSize: '24px', fontWeight: 700, minWidth: '32px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                  {cannabisCount}
                </span>
                <button
                  onClick={() => setCannabisCount(cannabisCount + 1)}
                  className="btn-icon"
                  style={{ width: '36px', height: '36px', fontSize: '18px' }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Tobacco count */}
          <div className="card-premium" style={{ padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px' }}>Tobacco/CBD today</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => setTobaccoCount(Math.max(0, tobaccoCount - 1))}
                  className="btn-icon"
                  style={{ width: '36px', height: '36px', fontSize: '18px' }}
                >
                  -
                </button>
                <span style={{ fontSize: '24px', fontWeight: 700, minWidth: '32px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                  {tobaccoCount}
                </span>
                <button
                  onClick={() => setTobaccoCount(tobaccoCount + 1)}
                  className="btn-icon"
                  style={{ width: '36px', height: '36px', fontSize: '18px' }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Mood */}
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Mood ({mood}/10)
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
            style={{ width: '100%', marginBottom: '24px', accentColor: 'var(--accent-primary)' }}
          />

          {/* Symptoms */}
          <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Symptoms (tap all that apply)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {SYMPTOM_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSymptom(s.id)}
                className={symptoms.includes(s.id) ? 'tag-accent' : 'tag'}
                style={{
                  cursor: 'pointer',
                  padding: '6px 12px',
                  border: symptoms.includes(s.id) ? '1px solid var(--accent-primary)' : '1px solid transparent',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Notes */}
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Notes (optional)
          </label>
          <textarea
            className="input-premium"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How was your day? What happened?"
            rows={4}
            style={{ resize: 'vertical', marginBottom: '24px' }}
          />

          <button
            className="btn-primary"
            onClick={handleSave}
            style={{ width: '100%' }}
          >
            {saved ? 'Saved!' : 'Save Log'}
          </button>
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div className="animate-fadeIn">
          <h1 className="text-heading" style={{ marginBottom: '20px' }}>Log History</h1>

          {history.length === 0 ? (
            <div className="card-soft" style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>No logs yet. Start tracking today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((log) => (
                <div key={log.id} className="card-premium" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{log.date}</span>
                    <span style={{ color: log.cannabisCount === 0 ? 'var(--success)' : 'var(--text-tertiary)', fontSize: '13px' }}>
                      {log.cannabisCount === 0 ? 'Clean' : `${log.cannabisCount} cannabis`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>Mood: {log.mood}/10</span>
                    {log.tobaccoCount > 0 && <span>Tobacco/CBD: {log.tobaccoCount}</span>}
                    {log.symptoms.length > 0 && <span>{log.symptoms.length} symptoms</span>}
                  </div>
                  {log.notes && (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '6px', fontStyle: 'italic' }}>
                      {log.notes.length > 80 ? log.notes.slice(0, 80) + '...' : log.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
