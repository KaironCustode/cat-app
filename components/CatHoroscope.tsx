'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface PawParticle {
  left: number;
  duration: number;
  delay: number;
}

export default function CatHoroscope() {
  const [guardianName, setGuardianName] = useState('');
  const [catName, setCatName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [furColor, setFurColor] = useState('');
  const [personality, setPersonality] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [luckyNumbers, setLuckyNumbers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pawParticles, setPawParticles] = useState<PawParticle[]>([]);

  const furColors = [
    'Nero', 'Bianco', 'Grigio', 'Tigrato', 'Bianco tigrato', 'Calico', 'Tortie', 'Rosso/Ginger', 'Crema', 'Marrone', 'Altro'
  ];

  const personalities = [
    'Giocherellone', 'Pigro', 'Indipendente', 'Coccolone', 'Timido', 'Dominante', 'Curioso', 'Tranquillo'
  ];

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  // Genera particelle solo sul client per evitare hydration mismatch
  useEffect(() => {
    setPawParticles(
      Array.from({ length: 8 }).map(() => ({
        left: Math.random() * 100,
        duration: 15 + Math.random() * 10,
        delay: Math.random() * 10,
      }))
    );
  }, []);

  const generateHoroscope = async () => {
    if (!guardianName || !catName || !birthMonth || !furColor) {
      setError('Compila tutti i campi obbligatori: nome guardiano, nome gatto, mese di nascita e colore del pelo');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setHoroscope(null);

    try {
      const response = await fetch('/api/cat-horoscope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardianName,
          catName,
          birthMonth,
          birthYear,
          furColor,
          personality,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella generazione');
      }

      const data = await response.json();
      setHoroscope(data.horoscope);
      setLuckyNumbers(data.luckyNumbers || []);
    } catch (err: any) {
      setError(err.message || 'Errore nella generazione dell\'oroscopo');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Soft gradient overlays */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FFE8E0] rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E8FAF8] rounded-full blur-3xl opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFF4E5] rounded-full blur-3xl opacity-40" />
      </div>

      {/* Floating paw particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {pawParticles.map((particle, i) => (
          <div
            key={i}
            className="absolute text-xl opacity-10"
            style={{
              left: `${particle.left}%`,
              bottom: '-50px',
              animation: `float-paw ${particle.duration}s linear ${particle.delay}s infinite`,
            }}
          >
            🐾
          </div>
        ))}
      </div>

      <div className="relative z-10 container-app py-8 md:py-12">
        {/* Header Navigation */}
        <nav className="flex items-center justify-between mb-8">
          <Link href="/" className="btn-ghost">
            <span className="mr-2">←</span> Torna all'analisi
          </Link>
          <Link href="/diary" className="btn-ghost">
            <span>📔</span> Diario
          </Link>
        </nav>

        {/* Page Title */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="w-10 h-10 mx-auto mb-4 rounded-xl overflow-hidden shadow-md">
            <Image
              src="/Shenzy Icona.png"
              alt="Shenzy"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              quality={100}
              unoptimized
            />
          </div>
          <h1 className="text-display mb-4">
            <span className="text-gradient">Oroscopo</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto">
            Scopri cosa riservano le stelle al tuo micio secondo l'antica arte dell'astrologia felina
          </p>
        </div>

        {/* Form */}
        {!horoscope && (
          <div className="mb-12 animate-slideUp">
            <div className="card-elevated p-8 md:p-10">
              <div className="space-y-6">
                {/* Guardian Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Nome del guardiano *
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Es: Marco, Maria, Il tuo nome..."
                    className="input-premium"
                    autoFocus
                  />
                </div>

                {/* Cat Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Nome del gatto *
                  </label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Es: Luna, Milo, Gattino..."
                    className="input-premium"
                  />
                </div>

                {/* Birth Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Mese di nascita *
                    </label>
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="input-premium"
                    >
                      <option value="">Seleziona...</option>
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Anno di nascita (opzionale)
                    </label>
                    <input
                      type="number"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      placeholder="Es: 2020"
                      min="1990"
                      max={new Date().getFullYear()}
                      className="input-premium"
                    />
                  </div>
                </div>

                {/* Fur Color */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Colore del pelo *
                  </label>
                  <select
                    value={furColor}
                    onChange={(e) => setFurColor(e.target.value)}
                    className="input-premium"
                  >
                    <option value="">Seleziona...</option>
                    {furColors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Personality */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Personalità (opzionale)
                  </label>
                  <select
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="input-premium"
                  >
                    <option value="">Seleziona...</option>
                    {personalities.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateHoroscope}
                  disabled={isGenerating}
                  className="btn-primary w-full py-4 text-lg"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-4">
                      <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-white font-semibold text-lg tracking-wide">L'oracolo sta consultando le stelle...</span>
                    </span>
                  ) : (
                    '🔮 Genera Oroscopo'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 animate-slideUp">
            <div className="card-premium p-6 border-2 border-[var(--error)] bg-[var(--error-light)]">
              <p className="text-[var(--error)] font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Horoscope Result */}
        {horoscope && (
          <div className="animate-slideUp">
            <div className="card-elevated p-8 md:p-10">
              <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h2 className="text-heading text-[var(--text-primary)] mb-2">
                    Oroscopo per {guardianName}
                  </h2>
                  <p className="text-[var(--text-tertiary)] text-sm">
                    Gatto: {catName} • {birthMonth} {birthYear && `• ${birthYear}`} • {furColor}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setHoroscope(null);
                    setLuckyNumbers([]);
                    setGuardianName('');
                    setCatName('');
                    setBirthMonth('');
                    setBirthYear('');
                    setFurColor('');
                    setPersonality('');
                  }}
                  className="btn-secondary"
                >
                  Nuovo Oroscopo
                </button>
              </div>

              <div className="card-soft p-6 md:p-8">
                <div
                  className="text-[var(--text-secondary)] leading-relaxed prose prose-sm max-w-none"
                  style={{ lineHeight: '1.8' }}
                  dangerouslySetInnerHTML={{
                    __html: horoscope
                      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--accent-primary)] font-semibold">$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em class="text-[var(--accent-secondary)] italic">$1</em>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>

              {/* Lucky Numbers */}
              {luckyNumbers.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[var(--border-light)]">
                  <div className="text-center">
                    <p className="text-[var(--text-tertiary)] text-sm mb-3">
                      🍀 Numeri fortunati di {catName}
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      {luckyNumbers.map((num, idx) => (
                        <div
                          key={idx}
                          className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg"
                        >
                          <span className="text-white font-bold text-xl">{num}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[var(--text-tertiary)] text-xs mt-3 italic">
                      Che le stelle siano con voi! ✨
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float-paw {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 0.1; }
          90% { opacity: 0.1; }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
