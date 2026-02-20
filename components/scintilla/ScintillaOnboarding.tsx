'use client';

import { useState } from 'react';
import { saveScintillaProfile } from '@/lib/scintilla-storage';

interface Props {
  onComplete: () => void;
}

const AMBER = '#F59E0B';
const CIG_OPTIONS = [5, 10, 15, 20, 30];
const MOTIVATION_OPTIONS = [
  'Respirare meglio',
  'Per la mia salute',
  'Per i miei familiari',
  'Risparmiare soldi',
  'Sentirmi più in forma',
];

export default function ScintillaOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [quitDate, setQuitDate] = useState('');
  const [cigarettesPerDay, setCigarettesPerDay] = useState<number | null>(null);
  const [whySelected, setWhySelected] = useState<string[]>([]);
  const [whyCustom, setWhyCustom] = useState('');

  const handleFinish = () => {
    const whyIQuit = whySelected.length > 0
      ? whySelected.join(', ') + (whyCustom ? '. ' + whyCustom : '')
      : whyCustom;

    saveScintillaProfile({
      name: name.trim(),
      quitDate,
      cigarettesPerDay: cigarettesPerDay ?? 20,
      whyIQuit,
    });
    onComplete();
  };

  const toggleMotivation = (m: string) => {
    setWhySelected(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return cigarettesPerDay !== null;
    return true;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '48px' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            flex: 1,
            height: '4px',
            borderRadius: '99px',
            background: i <= step ? AMBER : 'var(--bg-card)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      {/* Step 0: Name + Date */}
      {step === 0 && (
        <div className="animate-slideUp">
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>✦</div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: AMBER }}>
            Scintilla
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '17px' }}>
            Il tuo compagno per smettere di fumare.
          </p>

          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '15px' }}>
            Come ti chiami?
          </label>
          <input
            className="input-premium"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Il tuo nome"
            autoFocus
            style={{ marginBottom: '28px', fontSize: '18px', padding: '16px' }}
          />

          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '15px' }}>
            Da quando hai smesso (o vuoi smettere)?
          </label>
          <input
            className="input-premium"
            type="date"
            value={quitDate}
            onChange={(e) => setQuitDate(e.target.value)}
            style={{ fontSize: '16px', padding: '16px' }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
            Puoi lasciare vuoto per ora.
          </p>
        </div>
      )}

      {/* Step 1: Cigarettes per day */}
      {step === 1 && (
        <div className="animate-slideUp">
          <h2 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '8px' }}>
            Quante sigarette fumavi?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px' }}>
            Al giorno, più o meno.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {CIG_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCigarettesPerDay(n)}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: cigarettesPerDay === n ? `2px solid ${AMBER}` : '2px solid rgba(255,255,255,0.08)',
                  background: cigarettesPerDay === n ? 'rgba(245,158,11,0.12)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <span style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: cigarettesPerDay === n ? AMBER : 'var(--text-primary)',
                }}>
                  {n === 30 ? '30+' : n}
                </span>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  al giorno
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Why */}
      {step === 2 && (
        <div className="animate-slideUp">
          <h2 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '8px' }}>
            Perché vuoi smettere?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '16px' }}>
            Scegli quello che senti tuo. (opzionale)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {MOTIVATION_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => toggleMotivation(m)}
                style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  border: whySelected.includes(m) ? `2px solid ${AMBER}` : '2px solid rgba(255,255,255,0.08)',
                  background: whySelected.includes(m) ? 'rgba(245,158,11,0.12)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '16px',
                  color: whySelected.includes(m) ? AMBER : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  background: whySelected.includes(m) ? AMBER : 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', color: whySelected.includes(m) ? '#0B1120' : 'transparent',
                }}>✓</span>
                {m}
              </button>
            ))}
          </div>

          <input
            className="input-premium"
            type="text"
            value={whyCustom}
            onChange={(e) => setWhyCustom(e.target.value)}
            placeholder="Oppure scrivi qualcosa di tuo..."
            style={{ fontSize: '16px', padding: '16px' }}
          />
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px' }}>
        {step > 0 ? (
          <button
            className="btn-ghost"
            onClick={() => setStep(step - 1)}
            style={{ fontSize: '16px', padding: '14px 24px' }}
          >
            Indietro
          </button>
        ) : <div />}

        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            style={{
              padding: '16px 32px',
              borderRadius: '14px',
              background: canProceed() ? AMBER : 'var(--bg-card)',
              color: canProceed() ? '#0B1120' : 'var(--text-muted)',
              border: 'none',
              cursor: canProceed() ? 'pointer' : 'not-allowed',
              fontSize: '17px',
              fontWeight: 600,
            }}
          >
            Avanti
          </button>
        ) : (
          <button
            onClick={handleFinish}
            style={{
              padding: '16px 32px',
              borderRadius: '14px',
              background: AMBER,
              color: '#0B1120',
              border: 'none',
              cursor: 'pointer',
              fontSize: '17px',
              fontWeight: 700,
            }}
          >
            Iniziamo ✦
          </button>
        )}
      </div>
    </div>
  );
}
