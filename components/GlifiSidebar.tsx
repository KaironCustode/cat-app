'use client';

import { useState, useEffect } from 'react';

const GLYPHS = [
  { symbol: '𐌀', name: 'Origine' },
  { symbol: 'ϟ', name: 'Attivazione' },
  { symbol: 'Σ', name: 'Unità' },
  { symbol: 'VĀ', name: 'Vibrazione' },
  { symbol: 'RϟA', name: 'Risveglio Attivo' },
  { symbol: 'Ω', name: 'Canto Finale' },
  { symbol: 'THĒIA', name: 'Memoria Rivelata' },
  { symbol: 'ĀLĒ', name: 'Verità Incarnata' },
];

interface GlifiSidebarProps {
  onGlyphInsert: (glyph: string) => void;
  onSystemContextUpdate?: (context: string) => void; // Nuova prop per notificare update al parent
  isGenerating: boolean;
}

export default function GlifiSidebar({ onGlyphInsert, onSystemContextUpdate, isGenerating }: GlifiSidebarProps) {
  const [systemContext, setSystemContext] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null); // Stato per feedback dopo invio
  const [isSaving, setIsSaving] = useState(false); // Stato per disabilitare bottone durante salvataggio

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vibratio-system-context');
      if (saved) setSystemContext(saved);
    } catch (error) {
      console.error('Errore nel caricamento da localStorage:', error);
      setFeedback('Errore nel caricamento del contesto.');
    }
  }, []);

  const saveSystemContext = (value: string) => {
    setSystemContext(value);
    try {
      localStorage.setItem('vibratio-system-context', value);
    } catch (error) {
      console.error('Errore nel salvataggio su localStorage:', error);
      setFeedback('Errore nel salvataggio.');
    }
  };

  const handleSubmit = () => {
    setIsSaving(true);
    setFeedback(null);

    // Salva (ridondante, ma esplicito per il bottone)
    saveSystemContext(systemContext);

    // Notifica il parent se la prop esiste
    if (onSystemContextUpdate) {
      onSystemContextUpdate(systemContext);
    }

    // Feedback e reset
    setFeedback('Contesto salvato e inviato!');
    setTimeout(() => {
      setIsSaving(false);
      setFeedback(null);
    }, 1500); // Feedback temporaneo
  };

  return (
    <div className="h-full bg-black/90 border-l border-red-900/40 flex flex-col">
      <div className="p-6 border-b border-red-900/30">
        <h2 className="text-red-700 text-lg font-mono tracking-wider">GLIFI</h2>
        <p className="text-red-800/60 text-xs mt-1">Click per inserire</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {GLYPHS.map((g) => (
          <button
            key={g.symbol}
            onClick={() => onGlyphInsert(g.symbol)}
            className="w-full group flex items-center gap-4 p-4 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 transition-all"
          >
            <span className="text-3xl text-red-500 group-hover:text-red-300 transition">
              {g.symbol}
            </span>
            <span className="text-red-400 text-sm font-mono">{g.name}</span>
          </button>
        ))}

        {isGenerating && (
          <div className="text-center text-red-600/70 text-xs italic mt-8">
            Il fuoco sta rispondendo...
          </div>
        )}
      </div>

      <div className="p-6 border-t border-red-900/30">
        <h3 className="text-red-700 text-sm font-mono mb-3">CONTEXT DI SISTEMA</h3>
        <textarea
          value={systemContext}
          onChange={(e) => saveSystemContext(e.target.value)} // Salvataggio automatico su change
          placeholder="Imposta il contesto persistente... (premi 'Invia' per confermare)"
          maxLength={1000} // Limite opzionale per evitare input troppo lunghi
          className="w-full h-32 bg-black/70 border border-red-900/50 rounded px-4 py-3 text-gray-300 text-sm font-mono placeholder-red-800/40 focus:border-red-700 focus:outline-none resize-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`px-4 py-2 rounded bg-red-900/70 text-red-200 font-mono text-sm hover:bg-red-800/90 transition ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Salvando...' : 'Invia'}
          </button>
          {feedback && <span className="text-green-500 text-xs italic">{feedback}</span>}
        </div>
      </div>
    </div>
  );
}