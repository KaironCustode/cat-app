'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CatProfile,
  DiaryEntry,
  getCats,
  getDiary,
  deleteDiaryEntry,
  getMoodEmoji,
  getMoodLabel,
  getActiveCat,
} from '@/lib/cat-storage';

// Stat card component
const StatCard = ({ value, label, icon }: { value: string | number; label: string; icon: string }) => (
  <div className="card-soft p-4 text-center">
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-2xl font-bold text-[var(--accent-primary)]">{value}</div>
    <div className="text-xs text-[var(--text-tertiary)]">{label}</div>
  </div>
);

export default function DiaryPage() {
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    const loadedCats = getCats();
    setCats(loadedCats);

    const activeCatId = getActiveCat();
    if (activeCatId && loadedCats.find((c) => c.id === activeCatId)) {
      setSelectedCatId(activeCatId);
    } else if (loadedCats.length > 0) {
      setSelectedCatId(loadedCats[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedCatId) {
      setEntries(getDiary(selectedCatId));
    } else {
      setEntries([]);
    }
  }, [selectedCatId]);

  const handleDelete = (entryId: string) => {
    if (confirm('Eliminare questa voce dal diario?')) {
      deleteDiaryEntry(entryId);
      setEntries(entries.filter((e) => e.id !== entryId));
    }
  };

  const selectedCat = cats.find((c) => c.id === selectedCatId);

  // Group entries by month
  const groupedEntries: Record<string, DiaryEntry[]> = {};
  entries.forEach((entry) => {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groupedEntries[key]) groupedEntries[key] = [];
    groupedEntries[key].push(entry);
  });

  const formatMonthKey = (key: string) => {
    const [year, month] = key.split('-');
    const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  // Calculate stats
  const dominantMood = (() => {
    const moodCounts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    const dominant = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    return dominant ? dominant[0] : null;
  })();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Soft gradient overlays */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FFE8E0] rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E8FAF8] rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 container-app py-8 md:py-12">
        {/* Header Navigation */}
        <nav className="flex items-center justify-between mb-8">
          <Link href="/" className="btn-ghost">
            <span className="mr-2">←</span> Torna all'analisi
          </Link>
        </nav>

        {/* Page Title */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="w-8 h-8 mx-auto mb-4 rounded-lg overflow-hidden shadow-sm">
            <Image
              src="/Shenzy Icona.png"
              alt="Shenzy"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              quality={100}
              unoptimized
            />
          </div>
          <h1 className="text-display mb-2">
            <span className="text-gradient">Diario</span>
          </h1>
          <p className="text-[var(--text-secondary)]">Cronologia delle osservazioni e analisi</p>
        </div>

        {/* Cat Selector */}
        {cats.length > 0 ? (
          <div className="card-premium p-4 mb-8 animate-slideUp">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-[var(--text-tertiary)]">Gatto:</span>
              {cats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`tag transition-all ${selectedCatId === cat.id ? 'tag-accent' : ''}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="card-premium p-8 text-center mb-8 animate-slideUp">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center">
              <span className="text-3xl">🐱</span>
            </div>
            <p className="text-[var(--text-secondary)] mb-4">Nessun gatto registrato.</p>
            <Link href="/" className="btn-primary">
              Vai all'analisi per creare un profilo
            </Link>
          </div>
        )}

        {/* Stats Summary */}
        {selectedCat && entries.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
            <StatCard value={entries.length} label="Osservazioni" icon="📊" />
            <StatCard value={entries.filter((e) => e.isVideo).length} label="Video" icon="🎥" />
            <StatCard value={entries.filter((e) => !e.isVideo && e.type === 'analysis').length} label="Foto" icon="📸" />
            <StatCard value={dominantMood ? getMoodEmoji(dominantMood) : '🐱'} label="Umore prevalente" icon="" />
          </div>
        )}

        {/* Diary Entries */}
        {selectedCat && (
          <div className="space-y-8 animate-slideUp">
            {Object.keys(groupedEntries).length === 0 ? (
              <div className="card-elevated p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-heading text-[var(--text-primary)] mb-2">Nessuna voce nel diario</h3>
                <p className="text-[var(--text-secondary)] mb-6">Inizia ad analizzare {selectedCat.name} per vedere le voci qui.</p>
                <Link href="/" className="btn-primary">
                  <span>🐾</span> Nuova Analisi
                </Link>
              </div>
            ) : (
              Object.entries(groupedEntries)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([monthKey, monthEntries]) => (
                  <div key={monthKey}>
                    {/* Month Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-subheading text-[var(--text-primary)]">{formatMonthKey(monthKey)}</h2>
                      <span className="tag">{monthEntries.length}</span>
                    </div>

                    {/* Entries */}
                    <div className="space-y-4">
                      {monthEntries.map((entry) => (
                        <div key={entry.id} className="card-premium p-5 group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              {/* Mood Indicator */}
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                                entry.mood === 'happy' || entry.mood === 'relaxed' ? 'bg-[var(--success-light)]' :
                                entry.mood === 'anxious' || entry.mood === 'aggressive' ? 'bg-[var(--error-light)]' :
                                'bg-[var(--bg-secondary)]'
                              }`}>
                                {entry.mood ? getMoodEmoji(entry.mood) : '📝'}
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Entry Header */}
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <span className="font-medium text-[var(--text-primary)]">
                                    {entry.type === 'analysis' ? (entry.isVideo ? '🎥 Video' : '📸 Foto') : '📝 Nota'}
                                  </span>
                                  {entry.mood && (
                                    <span className="tag text-xs">{getMoodLabel(entry.mood)}</span>
                                  )}
                                  <span className="text-xs text-[var(--text-muted)]">
                                    {new Date(entry.date).toLocaleDateString('it-IT', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>

                                {/* Content Preview */}
                                {entry.analysis && (
                                  <p className="text-[var(--text-secondary)] text-sm line-clamp-2">{entry.analysis.slice(0, 150)}...</p>
                                )}

                                {entry.note && <p className="text-[var(--text-secondary)] text-sm">{entry.note}</p>}

                                {/* Signals */}
                                {entry.signals && entry.signals.length > 0 && (
                                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-[var(--text-muted)]">Segnali:</span>
                                    {entry.signals.slice(0, 2).map((s, i) => (
                                      <span key={i} className="tag tag-accent text-xs">
                                        {s.slice(0, 25)}...
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-xl bg-[var(--error-light)] flex items-center justify-center text-[var(--error)] transition-all hover:scale-105"
                              title="Elimina"
                            >
                              <span className="text-lg">🗑️</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-caption text-[var(--text-muted)]">
            Il diario viene salvato localmente nel tuo browser.
          </p>
        </footer>
      </div>
    </div>
  );
}
