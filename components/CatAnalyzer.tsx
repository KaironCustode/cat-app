'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getCats,
  getActiveCat,
  setActiveCat,
  saveCat,
  updateCat,
  deleteCat,
  addDiaryEntry,
  detectMood,
  generateSignalsToWatch,
  compareToPreviousAnalyses,
  compareToBaseline,
  getMoodEmoji,
  getMoodLabel,
  addBaselineEntry,
  removeBaselineEntry,
  getReminders,
  addReminder,
  completeReminder,
  deleteReminder,
  getUpcomingReminders,
  getOverdueReminders,
  CatProfile,
  HomeContext,
  Reminder,
  CAT_COLORS,
  HOME_CONTEXT_LABELS,
  BASELINE_CONTEXTS,
  REMINDER_TYPES,
} from '@/lib/cat-storage';

interface AnalysisResult {
  analysis: string;
  imageCount: number;
  isVideo: boolean;
}

// Animated cat mascot - Using actual Shenzy icon
const ShenzyMascot = ({ mood = 'neutral', size = 'lg' }: { mood?: 'neutral' | 'thinking' | 'happy'; size?: 'sm' | 'lg' }) => {
  // Small sizes to prevent pixelation - keep close to original image resolution
  const sizeClass = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  const imgSize = size === 'lg' ? 40 : 24;

  return (
    <div className={`relative ${sizeClass} rounded-xl overflow-hidden shadow-md ${mood === 'thinking' ? 'animate-pulse-soft' : ''} ${mood === 'happy' ? 'animate-bounce-soft' : ''}`}>
      <Image
        src="/Shenzy Icona.png"
        alt="Shenzy"
        width={imgSize}
        height={imgSize}
        className="w-full h-full object-contain"
        quality={100}
        unoptimized
        priority
      />
      {mood === 'thinking' && (
        <span className="absolute -top-1 -right-1 text-xs animate-bounce">💭</span>
      )}
      {mood === 'happy' && (
        <span className="absolute -top-1 -right-1 text-xs animate-bounce">✨</span>
      )}
    </div>
  );
};

// Simple loading indicator
const LoadingIndicator = () => {
  return (
    <div className="text-center py-4">
      <p className="text-lg font-medium text-[var(--text-secondary)] animate-pulse">
        Shenzy sta analizzando, un attimino!
      </p>
    </div>
  );
};

// Feature card component - using button for proper mobile touch support
const FeatureCard = ({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick?: () => void }) => (
  <button
    type="button"
    className="card-premium p-6 text-center hover:shadow-lg transition-all duration-300 group cursor-pointer w-full border-none"
    onClick={onClick}
  >
    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
    <p className="text-sm text-[var(--text-tertiary)]">{subtitle}</p>
  </button>
);

// Cat Profile Modal with Home Context
const CatProfileModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editCat,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, homeContext?: HomeContext, photoUrl?: string) => void;
  onDelete?: () => void;
  editCat?: CatProfile | null;
}) => {
  const [name, setName] = useState(editCat?.name || '');
  const [color, setColor] = useState(editCat?.color || CAT_COLORS[0]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(editCat?.photoUrl);
  const [homeContext, setHomeContext] = useState<HomeContext>({
    living: editCat?.homeContext?.living || '',
    otherAnimals: editCat?.homeContext?.otherAnimals || '',
    family: editCat?.homeContext?.family || '',
  });

  useEffect(() => {
    if (editCat) {
      setName(editCat.name);
      setColor(editCat.color);
      setPhotoUrl(editCat.photoUrl);
      setHomeContext({
        living: editCat.homeContext?.living || '',
        otherAnimals: editCat.homeContext?.otherAnimals || '',
        family: editCat.homeContext?.family || '',
      });
    } else {
      setName('');
      setColor(CAT_COLORS[0]);
      setPhotoUrl(undefined);
      setHomeContext({ living: '', otherAnimals: '', family: '' });
    }
  }, [editCat, isOpen]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resize and compress to keep storage small
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = document.createElement('img');
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });

      const canvas = document.createElement('canvas');
      const maxSize = 150; // Small thumbnail
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoUrl(dataUrl);
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ zIndex: 9999 }} />
      <div
        className="relative card-elevated p-6 w-full max-w-md animate-scaleIn overflow-y-auto max-h-[90vh]"
        style={{
          position: 'relative',
          zIndex: 10000,
          backgroundColor: 'var(--bg-card)'
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <h2 className="text-heading text-[var(--text-primary)] mb-6">
          {editCat ? 'Modifica profilo' : 'Nuovo gatto'}
        </h2>

        <div className="space-y-5">
          {/* Photo Upload */}
          <div className="text-center">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
              Foto del gatto
            </label>
            <div className="relative inline-block">
              <div
                className="w-24 h-24 rounded-2xl overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity mx-auto"
                style={photoUrl ? {} : { backgroundColor: color }}
                onClick={() => document.getElementById('cat-photo-input')?.click()}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Cat photo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl opacity-60">🐱</span>
                )}
              </div>
              <input
                id="cat-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById('cat-photo-input')?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                📷
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">Clicca per aggiungere una foto</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Come si chiama il tuo gatto?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es: Micio, Luna, Felix..."
              className="input-premium"
              autoFocus
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Colore del profilo
            </label>
            <div className="flex gap-3 flex-wrap">
              {CAT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-24 h-24 rounded-2xl transition-all ${color === c ? 'ring-4 ring-offset-2 ring-[var(--accent-primary)] scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                  type="button"
                />
              ))}
            </div>
          </div>

          {/* Home Context Section */}
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span>🏠</span> Contesto casa
              <span className="text-xs font-normal text-[var(--text-tertiary)]">(opzionale)</span>
            </h3>

            {/* Living situation */}
            <div className="mb-3">
              <label className="block text-xs text-[var(--text-tertiary)] mb-1.5">
                Dove vive?
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['indoor', 'outdoor', 'mixed'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHomeContext(prev => ({ ...prev, living: prev.living === opt ? '' : opt }))}
                    className={`tag text-xs ${homeContext.living === opt ? 'tag-accent' : ''}`}
                  >
                    {HOME_CONTEXT_LABELS.living[opt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Other animals */}
            <div className="mb-3">
              <label className="block text-xs text-[var(--text-tertiary)] mb-1.5">
                Altri animali?
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['alone', 'other-cats', 'dogs', 'other-cats-dogs'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHomeContext(prev => ({ ...prev, otherAnimals: prev.otherAnimals === opt ? '' : opt }))}
                    className={`tag text-xs ${homeContext.otherAnimals === opt ? 'tag-accent' : ''}`}
                  >
                    {HOME_CONTEXT_LABELS.otherAnimals[opt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Family */}
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1.5">
                Tipo di famiglia?
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['single', 'couple', 'family', 'family-kids'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHomeContext(prev => ({ ...prev, family: prev.family === opt ? '' : opt }))}
                    className={`tag text-xs ${homeContext.family === opt ? 'tag-accent' : ''}`}
                  >
                    {HOME_CONTEXT_LABELS.family[opt]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Baseline Section - only show when editing and cat has baseline */}
          {editCat && editCat.baseline && editCat.baseline.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <span>🎯</span> Baseline comportamentale
                {editCat.baselineComplete && (
                  <span className="tag tag-success text-xs">Completa</span>
                )}
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-3">
                {editCat.baseline.length} osservazioni di riferimento
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {editCat.baseline.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-2 bg-[var(--bg-secondary)] rounded-lg group"
                  >
                    {entry.imageUrl && (
                      <img
                        src={entry.imageUrl}
                        alt="Baseline"
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getMoodEmoji(entry.mood)}</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {getMoodLabel(entry.mood)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">
                        {entry.context} • {new Date(entry.date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Rimuovere questa osservazione dalla baseline?')) {
                          removeBaselineEntry(editCat.id, entry.id);
                          // Force re-render by closing and reopening modal
                          // (In a real app, you'd want proper state management here)
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[var(--error)] text-sm transition-opacity"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete button for existing profiles */}
        {editCat && onDelete && (
          <button
            onClick={() => {
              if (confirm(`Sei sicuro di voler eliminare il profilo di ${editCat.name}? Questa azione non può essere annullata.`)) {
                onDelete();
                onClose();
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium mt-6"
            type="button"
          >
            🗑️ Elimina profilo di {editCat.name}
          </button>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1" type="button">
            Annulla
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSave(name.trim(), color, homeContext, photoUrl);
                onClose();
              }
            }}
            disabled={!name.trim()}
            className="btn-primary flex-1"
            type="button"
          >
            {editCat ? 'Salva' : 'Crea'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CatAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'video' | 'image' | null>(null);
  const [progress, setProgress] = useState(0);
  const [catMood, setCatMood] = useState<'neutral' | 'thinking' | 'happy'>('neutral');
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [signals, setSignals] = useState<string[]>([]);
  const [detectedMood, setDetectedMood] = useState<string>('neutral');
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [askCount, setAskCount] = useState(0); // Counter for questions (max 5)
  const [isDragging, setIsDragging] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingCat, setEditingCat] = useState<CatProfile | null>(null);
  const [baselineComparison, setBaselineComparison] = useState<string | null>(null);
  const [showBaselinePrompt, setShowBaselinePrompt] = useState(false);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [quickNoteSaved, setQuickNoteSaved] = useState(false);
  const [quickNoteCatId, setQuickNoteCatId] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<Reminder[]>([]);
  const [newReminderType, setNewReminderType] = useState('vet');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderNotes, setNewReminderNotes] = useState('');
  const [newReminderRecurring, setNewReminderRecurring] = useState<'monthly' | 'quarterly' | 'yearly' | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [chatResetTime, setChatResetTime] = useState<number | null>(null);
  const [buildId, setBuildId] = useState<string>('…');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CHAT_LIMIT = 10;
  const CHAT_RESET_HOURS = 6;

  // Show a visible build/version marker to avoid "is this the new deploy?"
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' as RequestCache });
        if (!res.ok) return;
        const data = (await res.json()) as { shortSha?: string; ref?: string };
        if (!cancelled) {
          const short = data.shortSha || 'unknown';
          const ref = data.ref ? `/${data.ref}` : '';
          setBuildId(`${short}${ref}`);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load cats on mount
  useEffect(() => {
    const loadedCats = getCats();
    setCats(loadedCats);
    const activeId = getActiveCat();
    if (activeId && loadedCats.find(c => c.id === activeId)) {
      setSelectedCatId(activeId);
    } else if (loadedCats.length > 0) {
      setSelectedCatId(loadedCats[0].id);
      setActiveCat(loadedCats[0].id);
    }

    // Load chat rate limit from localStorage
    const savedChatData = localStorage.getItem('shenzy_chat_limit');
    if (savedChatData) {
      try {
        const { count, resetTime } = JSON.parse(savedChatData);
        const now = Date.now();
        if (resetTime && now < resetTime) {
          // Still within limit period
          setChatCount(count || 0);
          setChatResetTime(resetTime);
        } else {
          // Reset period expired, clear limit
          localStorage.removeItem('shenzy_chat_limit');
          setChatCount(0);
          setChatResetTime(null);
        }
      } catch {
        localStorage.removeItem('shenzy_chat_limit');
      }
    }
  }, []);

  // Load reminders when cat changes
  useEffect(() => {
    if (selectedCatId) {
      setReminders(getReminders(selectedCatId));
      setUpcomingReminders(getUpcomingReminders(selectedCatId, 7));
      setOverdueReminders(getOverdueReminders(selectedCatId));
      setCalendarMonth(new Date());
    } else {
      setReminders([]);
      setUpcomingReminders([]);
      setOverdueReminders([]);
    }
  }, [selectedCatId]);

  // Save to diary when analysis completes
  useEffect(() => {
    if (result && selectedCatId) {
      const mood = detectMood(result.analysis);
      setDetectedMood(mood);
      const signalsList = generateSignalsToWatch(mood, result.analysis);
      setSignals(signalsList);

      addDiaryEntry({
        catId: selectedCatId,
        type: 'analysis',
        analysis: result.analysis,
        imageCount: result.imageCount,
        isVideo: result.isVideo,
        mood,
        signals: signalsList,
      });

      const comp = compareToPreviousAnalyses(selectedCatId, mood);
      setComparison(comp);

      // Compare to baseline if available
      const baselineComp = compareToBaseline(selectedCatId, mood);
      setBaselineComparison(baselineComp);

      // Show baseline prompt if cat doesn't have a complete baseline
      const cat = getCats().find(c => c.id === selectedCatId);
      if (cat && !cat.baselineComplete) {
        setShowBaselinePrompt(true);
      }
    }
  }, [result, selectedCatId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    setError(null);
    setResult(null);
    setCatMood('thinking');
    setAskCount(0); // Reset question counter
    setAskAnswer(null);
    setAskQuestion('');

    if (file.type.startsWith('video/')) {
      setPreviewType('video');
      setPreview(URL.createObjectURL(file));
    } else if (file.type.startsWith('image/')) {
      setPreviewType('image');
      setPreview(URL.createObjectURL(file));
    }

    await analyzeFile(file);
  };

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      if (file.type.startsWith('video/')) {
        await analyzeVideo(file);
      } else if (file.type.startsWith('image/')) {
        await analyzeImage(file);
      } else {
        throw new Error('Formato file non supportato. Usa video o immagini.');
      }
    } catch (err: any) {
      setError(err.message || "Errore durante l'analisi");
      setIsAnalyzing(false);
      setProgress(0);
      setCatMood('neutral');
    }
  };

  const MAX_UPLOAD_BYTES = 3_800_000; // safety buffer for serverless body limits

  async function readApiErrorMessage(res: Response): Promise<string> {
    // Vercel/Next can return HTML/text for errors like 413; don't assume JSON.
    if (res.status === 413) {
      return 'File troppo pesante per essere caricato. Prova a usare una foto più leggera o ritagliata (oppure un video più corto).';
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        const msg =
          data?.error ||
          data?.message ||
          data?.error?.message ||
          data?.details ||
          null;
        if (typeof msg === 'string' && msg.trim()) return msg.trim();
      } catch {
        // fall through
      }
    }

    try {
      const text = await res.text();
      if (text && text.trim()) {
        // Avoid dumping HTML pages into UI
        const compact = text.replace(/\s+/g, ' ').trim();
        return compact.length > 160 ? `${compact.slice(0, 160)}…` : compact;
      }
    } catch {
      // ignore
    }

    return `Errore (${res.status}) durante l'upload/analisi.`;
  }

  async function canvasToJpegFile(
    canvas: HTMLCanvasElement,
    fileNameBase: string,
    quality: number
  ): Promise<File> {
    const blob: Blob =
      (await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))) ||
      // Safari fallback
      (await (async () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const r = await fetch(dataUrl);
        return await r.blob();
      })());

    return new File([blob], `${fileNameBase}.jpg`, { type: 'image/jpeg' });
  }

  async function downscaleImageForUpload(file: File): Promise<File> {
    // Some phones produce huge images; resize & compress client-side to avoid 413.
    // If we can't decode it (e.g. HEIC in some browsers), just return original.
    try {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          // Use a real <img> element to avoid conflict with next/image import
          const el = document.createElement('img');
          el.decoding = 'async';
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error('Impossibile leggere immagine'));
          el.src = url;
        });

        const maxDim = 1280;
        const longest = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
        const scale = longest > maxDim ? maxDim / longest : 1;
        const targetW = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
        const targetH = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

        // If already small-ish and below size threshold, keep original
        if (scale === 1 && file.size <= MAX_UPLOAD_BYTES) return file;

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;

        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Quality tuned for iPhone photos while staying small
        const compressed = await canvasToJpegFile(canvas, `upload-${Date.now()}`, 0.82);
        return compressed;
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      return file;
    }
  }

  const analyzeVideo = async (videoFile: File) => {
    try {
      setProgress(10);
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.currentTime = 0;
          resolve(null);
        };
        video.onerror = reject;
      });

      setProgress(30);
      const duration = video.duration;

      if (duration > 20) {
        throw new Error(`Video troppo lungo (${Math.round(duration)}s). Durata massima: 20 secondi.`);
      }

      const framesPerSecond = duration <= 10 ? 2 : 1;
      const maxFrames = Math.min(20, Math.floor(duration * framesPerSecond));
      const frameInterval = duration / maxFrames;

      const frames: File[] = [];
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Impossibile creare canvas');

      setProgress(40);
      for (let i = 0; i < maxFrames; i++) {
        video.currentTime = i * frameInterval;
        await new Promise((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  frames.push(new File([blob], `frame${i}.jpg`, { type: 'image/jpeg' }));
                }
                setProgress(40 + (i / maxFrames) * 20);
                resolve(null);
              },
              'image/jpeg',
              0.8
            );
          };
        });
      }

      URL.revokeObjectURL(video.src);
      if (frames.length === 0) throw new Error('Impossibile estrarre frame dal video');

      setProgress(70);
      const formData = new FormData();
      frames.forEach((frame) => formData.append('images', frame));
      formData.append('isVideo', 'true');

      // Add cat context
      if (selectedCat) {
        formData.append('catName', selectedCat.name);
        if (selectedCat.homeContext) {
          formData.append('homeContext', JSON.stringify({
            living: HOME_CONTEXT_LABELS.living[selectedCat.homeContext.living] || '',
            otherAnimals: HOME_CONTEXT_LABELS.otherAnimals[selectedCat.homeContext.otherAnimals] || '',
            family: HOME_CONTEXT_LABELS.family[selectedCat.homeContext.family] || '',
          }));
        }
      }

      setProgress(80);
      const response = await fetch('/api/cat-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response));
      }

      setProgress(95);
      const data = await response.json();
      setProgress(100);
      setResult(data);
      setCatMood('happy');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const analyzeImage = async (imageFile: File) => {
    try {
      setProgress(30);
      const formData = new FormData();

      const uploadFile = await downscaleImageForUpload(imageFile);
      if (uploadFile.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          'La foto è troppo pesante. Prova a ritagliarla o a scegliere un’immagine con meno megapixel.'
        );
      }

      formData.append('images', uploadFile);
      formData.append('isVideo', 'false');

      // Add cat context
      if (selectedCat) {
        formData.append('catName', selectedCat.name);
        if (selectedCat.homeContext) {
          formData.append('homeContext', JSON.stringify({
            living: HOME_CONTEXT_LABELS.living[selectedCat.homeContext.living] || '',
            otherAnimals: HOME_CONTEXT_LABELS.otherAnimals[selectedCat.homeContext.otherAnimals] || '',
            family: HOME_CONTEXT_LABELS.family[selectedCat.homeContext.family] || '',
          }));
        }
      }

      setProgress(50);
      const response = await fetch('/api/cat-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response));
      }

      setProgress(90);
      const data = await response.json();
      setProgress(100);
      setResult(data);
      setCatMood('happy');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleAskShenzy = async () => {
    if (!askQuestion.trim() || !result) return;
    
    // Check limit (max 5 questions)
    if (askCount >= 5) {
      setError('Hai raggiunto il limite di 5 domande per questa analisi. Fai una nuova analisi per continuare!');
      return;
    }

    setIsAsking(true);
    setAskAnswer(null);

    try {
      const response = await fetch('/api/ask-shenzy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: askQuestion,
          previousAnalysis: result.analysis,
        }),
      });

      if (!response.ok) throw new Error('Errore nella risposta');

      const data = await response.json();
      setAskAnswer(data.answer);
      setAskQuestion('');
      setAskCount(prev => prev + 1); // Increment counter
    } catch (err: any) {
      setError(err.message || 'Errore nella domanda');
    } finally {
      setIsAsking(false);
    }
  };

  const handleSaveQuickNote = (noteText: string) => {
    const targetCatId = selectedCatId || quickNoteCatId || cats[0]?.id || null;
    if (!noteText.trim() || !targetCatId) return;

    addDiaryEntry({
      catId: targetCatId,
      type: 'note',
      note: noteText.trim(),
    });

    setQuickNote('');
    setQuickNoteSaved(true);
    setTimeout(() => {
      setShowQuickNoteModal(false);
      setQuickNoteSaved(false);
    }, 1500);
  };

  const handleAddReminder = () => {
    if (!selectedCatId || !newReminderDate) return;

    const reminderType = REMINDER_TYPES.find((t) => t.id === newReminderType);
    addReminder({
      catId: selectedCatId,
      type: newReminderType as Reminder['type'],
      title: reminderType?.label || 'Promemoria',
      dueDate: new Date(newReminderDate).toISOString(),
      notes: newReminderNotes || undefined,
      recurring: newReminderRecurring,
    });

    // Refresh reminders
    setReminders(getReminders(selectedCatId));
    setUpcomingReminders(getUpcomingReminders(selectedCatId, 7));
    setOverdueReminders(getOverdueReminders(selectedCatId));

    // Reset form
    setNewReminderType('vet');
    setNewReminderDate('');
    setNewReminderNotes('');
    setNewReminderRecurring(null);
    setShowReminderModal(false);
  };

  const handleCompleteReminder = (id: string) => {
    completeReminder(id);
    if (selectedCatId) {
      setReminders(getReminders(selectedCatId));
      setUpcomingReminders(getUpcomingReminders(selectedCatId, 7));
      setOverdueReminders(getOverdueReminders(selectedCatId));
    }
  };

  const handleDeleteReminder = (id: string) => {
    if (confirm('Eliminare questo promemoria?')) {
      deleteReminder(id);
      if (selectedCatId) {
        setReminders(getReminders(selectedCatId));
        setUpcomingReminders(getUpcomingReminders(selectedCatId, 7));
        setOverdueReminders(getOverdueReminders(selectedCatId));
      }
    }
  };


  // Chat handling
  const handleChat = async () => {
    if (!chatInput.trim() || chatCount >= CHAT_LIMIT) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatting(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          catName: selectedCat?.name,
        }),
      });

      if (!response.ok) throw new Error('Errore nella risposta');

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

      // Update chat count and save to localStorage
      const newCount = chatCount + 1;
      setChatCount(newCount);

      // Set reset time if this is the first message
      let resetTime = chatResetTime;
      if (!resetTime) {
        resetTime = Date.now() + (CHAT_RESET_HOURS * 60 * 60 * 1000);
        setChatResetTime(resetTime);
      }

      localStorage.setItem('shenzy_chat_limit', JSON.stringify({
        count: newCount,
        resetTime: resetTime,
      }));
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Mi dispiace, qualcosa è andato storto. Riprova!' }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Quick note templates
  const QUICK_NOTE_TEMPLATES = [
    { emoji: '🤮', label: 'Ha vomitato' },
    { emoji: '🍽️', label: 'Non ha mangiato' },
    { emoji: '💩', label: 'Problemi lettiera' },
    { emoji: '😴', label: 'Dorme molto' },
    { emoji: '🏃', label: 'Molto attivo' },
    { emoji: '😿', label: 'Sembra triste' },
    { emoji: '🤒', label: 'Sembra malato' },
    { emoji: '💊', label: 'Ha preso medicina' },
  ];

  const handleSaveProfile = (name: string, color: string, homeContext?: HomeContext, photoUrl?: string) => {
    if (editingCat) {
      // Update existing cat
      const updated = updateCat(editingCat.id, { name, color, homeContext, photoUrl });
      if (updated) {
        setCats(prev => prev.map(c => c.id === editingCat.id ? updated : c));
        setSelectedCatId(updated.id);
        setActiveCat(updated.id);
      }
    } else {
      // Create new cat
      const newCat = saveCat({ name, color, homeContext, photoUrl });
      setCats(prev => [...prev, newCat]);
      setSelectedCatId(newCat.id);
      setActiveCat(newCat.id);
    }
    setShowProfileModal(false);
    setEditingCat(null);
  };

  const handleDeleteProfile = () => {
    if (editingCat) {
      deleteCat(editingCat.id);
      setCats(cats.filter(c => c.id !== editingCat.id));
      if (selectedCatId === editingCat.id) {
        const remaining = cats.filter(c => c.id !== editingCat.id);
        if (remaining.length > 0) {
          setSelectedCatId(remaining[0].id);
          setActiveCat(remaining[0].id);
        } else {
          setSelectedCatId(null);
          setActiveCat(null);
        }
      }
      setEditingCat(null);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setPreview(null);
    setPreviewType(null);
    setAskCount(0);
    setAskAnswer(null);
    setAskQuestion('');
    setProgress(0);
    setCatMood('neutral');
    setComparison(null);
    setSignals([]);
    setDetectedMood('neutral');
    setBaselineComparison(null);
    setShowBaselinePrompt(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadAnalysis = () => {
    if (!result) return;
    const catName = cats.find(c => c.id === selectedCatId)?.name || 'gatto';
    const content = `Analisi Comportamentale di ${catName} - ${result.isVideo ? 'Video' : 'Foto'}\nData: ${new Date().toLocaleString('it-IT')}\n\n${result.analysis}\n\n---\nGenerato da Shenzy - Cat Behavior Analyzer`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shenzy-${catName}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedCat = cats.find(c => c.id === selectedCatId);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Soft gradient overlays */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FFE8E0] rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E8FAF8] rounded-full blur-3xl opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFF4E5] rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative z-10 container-app py-8 md:py-12">
        {/* Header Navigation */}
        <nav className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShenzyMascot mood={catMood} size="sm" />
            <span className="font-bold text-xl text-[var(--text-primary)]">Shenzy</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/diary" className="btn-ghost">
              <span>Diario</span>
            </Link>
            <Link href="/horoscope" className="btn-ghost">
              <span>Oroscopo</span>
            </Link>
          </div>
        </nav>

        {/* Cat Profile Bar */}
        <div className="card-soft p-4 mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <span className="text-sm text-[var(--text-tertiary)]">Il tuo gatto:</span>
              {cats.length === 0 ? (
                <button
                  onClick={() => {
                    setEditingCat(null);
                    setShowProfileModal(true);
                  }}
                  className="tag tag-accent cursor-pointer"
                  type="button"
                >
                  + Aggiungi gatto
                </button>
              ) : (
                <>
                  {cats.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCatId(cat.id);
                        setActiveCat(cat.id);
                      }}
                      className={`tag transition-all cursor-pointer ${selectedCatId === cat.id ? 'tag-accent' : ''}`}
                      type="button"
                    >
                      {cat.photoUrl ? (
                        <img src={cat.photoUrl} alt={cat.name} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: cat.color }}>🐱</span>
                      )}
                      {cat.name}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setEditingCat(null);
                      setShowProfileModal(true);
                    }}
                    className="tag cursor-pointer"
                    type="button"
                  >
                    +
                  </button>
                </>
              )}
            </div>
            {selectedCat && (
              <button
                onClick={() => {
                  setEditingCat(selectedCat);
                  setShowProfileModal(true);
                }}
                className="text-sm text-[var(--accent-primary)] hover:underline cursor-pointer"
                type="button"
              >
                Modifica
              </button>
            )}
          </div>
        </div>

        {/* Reminder Alerts */}
        {(overdueReminders.length > 0 || upcomingReminders.length > 0) && !result && (
          <div className="space-y-3 mb-6 animate-fadeIn">
            {/* Overdue Reminders */}
            {overdueReminders.map((r) => {
              const type = REMINDER_TYPES.find((t) => t.id === r.type);
              return (
                <div
                  key={r.id}
                  className="card-premium p-4 border-l-4 border-[var(--error)] bg-[var(--error-light)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{type?.emoji || '📌'}</span>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">
                          {r.title} - <span className="text-[var(--error)]">Scaduto!</span>
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Scadeva il {new Date(r.dueDate).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCompleteReminder(r.id)}
                        className="btn-primary text-xs px-3 py-1"
                        type="button"
                      >
                        ✓ Fatto
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Upcoming Reminders */}
            {upcomingReminders.slice(0, 2).map((r) => {
              const type = REMINDER_TYPES.find((t) => t.id === r.type);
              const daysUntil = Math.ceil(
                (new Date(r.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={r.id} className="card-soft p-4 border-l-4 border-[var(--accent-primary)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{type?.emoji || '📌'}</span>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{r.title}</p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {daysUntil === 0
                            ? 'Oggi!'
                            : daysUntil === 1
                            ? 'Domani'
                            : `Tra ${daysUntil} giorni`}
                          {' • '}
                          {new Date(r.dueDate).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCompleteReminder(r.id)}
                      className="btn-secondary text-xs px-3 py-1"
                      type="button"
                    >
                      ✓ Fatto
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hero Section - Only when no preview and no result */}
        {!preview && !result && (
          <div className="text-center mb-12 animate-fadeIn">
            <div className="mb-8">
              <ShenzyMascot mood={catMood} size="lg" />
            </div>

            <h1 className="text-display mb-4">
              <span className="text-gradient">
                {selectedCat ? `Ciao ${selectedCat.name}!` : 'Capisce il tuo gatto'}
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto mb-12">
              Scopri cosa pensa e come si sente il tuo micio con l'intelligenza artificiale
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-4 mb-12 stagger-children max-w-md mx-auto">
              <FeatureCard
                icon="📝"
                title="Nota"
                subtitle="Appunti"
                onClick={() => {
                  // If no cat profile exists yet, guide user to create one first
                  if (cats.length === 0) {
                    setEditingCat(null);
                    setShowProfileModal(true);
                    return;
                  }

                  // Default to the currently selected cat (or first one) so it doesn't feel like "nothing happens"
                  const defaultCatId = selectedCatId || cats[0]?.id || null;
                  if (!selectedCatId && defaultCatId) {
                    setSelectedCatId(defaultCatId);
                    setActiveCat(defaultCatId);
                  }
                  setQuickNoteCatId(defaultCatId);
                  setQuickNoteSaved(false);
                  setQuickNote('');
                  setShowQuickNoteModal(true);
                }}
              />
              <FeatureCard
                icon="🗓️"
                title="Agenda"
                subtitle="Promemoria"
                onClick={() => {
                  if (cats.length === 0) {
                    setEditingCat(null);
                    setShowProfileModal(true);
                    return;
                  }
                  const defaultCatId = selectedCatId || cats[0]?.id || null;
                  if (defaultCatId && !selectedCatId) {
                    setSelectedCatId(defaultCatId);
                    setActiveCat(defaultCatId);
                  }
                  if (defaultCatId) setShowReminderModal(true);
                }}
              />
              <FeatureCard
                icon="🤖"
                title="AI"
                subtitle="Chatta"
                onClick={() => {
                  // Chat is still useful without a profile, but if we have none, create one first for better context
                  if (cats.length === 0) {
                    setEditingCat(null);
                    setShowProfileModal(true);
                    return;
                  }
                  const defaultCatId = selectedCatId || cats[0]?.id || null;
                  if (defaultCatId && !selectedCatId) {
                    setSelectedCatId(defaultCatId);
                    setActiveCat(defaultCatId);
                  }
                  setShowChatModal(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Upload Zone */}
        {!preview && !result && (
          <div className="animate-slideUp">
            <div
              className={`upload-zone p-12 text-center ${isDragging ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                <span className="text-4xl">{isDragging ? '📥' : '📤'}</span>
              </div>

              <h3 className="text-heading mb-2 text-[var(--text-primary)]">
                {isDragging ? 'Rilascia qui!' : 'Carica un file'}
              </h3>
              <p className="text-[var(--text-tertiary)] mb-6">
                Trascina qui o clicca per selezionare
              </p>

              <div className="flex gap-3 justify-center flex-wrap">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    fileInputRef.current?.click(); 
                  }}
                  className="btn-secondary"
                  type="button"
                >
                  <span>📁</span> Scegli File
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-4 text-sm text-[var(--text-muted)]">
                <span>Video: max 20s</span>
                <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                <span>Foto: qualsiasi formato</span>
              </div>
            </div>
          </div>
        )}

        {/* Preview & Loading State */}
        {preview && !result && (
          <div className="card-elevated p-6 animate-scaleIn">
            <div className="rounded-2xl overflow-hidden mb-6 bg-[var(--bg-secondary)]">
              {previewType === 'video' ? (
                <video src={preview} controls className="w-full max-h-[400px] object-contain" />
              ) : (
                <img src={preview} alt="Preview" className="w-full max-h-[400px] object-contain" />
              )}
            </div>

            {isAnalyzing ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <ShenzyMascot mood="thinking" size="sm" />
                </div>
                <LoadingIndicator />
              </div>
            ) : (
              <button onClick={reset} className="btn-secondary w-full">
                Carica un altro file
              </button>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card-premium p-6 mb-6 border-l-4 border-[var(--error)] animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--error-light)] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">😿</span>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">Ops, qualcosa è andato storto</h3>
                <p className="text-[var(--text-secondary)]">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-slideUp">
            {/* Result Header Card */}
            <div className="card-elevated p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <ShenzyMascot mood="happy" size="sm" />
                  <div>
                    <h2 className="text-heading text-[var(--text-primary)]">
                      {selectedCat ? `Analisi di ${selectedCat.name}` : 'Analisi Completata'}
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      {result.isVideo ? `Video (${result.imageCount} frame)` : 'Foto'} analizzata
                    </p>
                  </div>
                </div>
              </div>

              {/* Baseline Comparison */}
              {baselineComparison && (
                <div className={`card-accent p-4 mb-4 ${baselineComparison.includes('⚠️') ? 'border-l-4 border-amber-500' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{baselineComparison.includes('⚠️') ? '⚠️' : '🎯'}</span>
                    <div>
                      <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-1">Rispetto alla baseline</h4>
                      <p className="text-sm text-[var(--text-secondary)]">{baselineComparison.replace('⚠️ ', '')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Comparison */}
              {comparison && comparison.trend !== 'unknown' && (
                <div className="card-accent p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📈</span>
                    <div>
                      <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-1">Confronto nel tempo</h4>
                      <p className="text-sm text-[var(--text-secondary)]">{comparison.summary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Baseline Prompt */}
              {showBaselinePrompt && selectedCat && !selectedCat.baselineComplete && (
                <div className="card-soft p-4 mb-4 border border-dashed border-[var(--accent-primary)]">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🎯</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-1">
                        Costruisci la baseline di {selectedCat.name}
                      </h4>
                      <p className="text-xs text-[var(--text-tertiary)] mb-3">
                        Salva 3-5 analisi in momenti diversi per creare un profilo comportamentale di riferimento.
                        Così Shenzy potrà dirti quando qualcosa è &quot;diverso dal solito&quot;.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {BASELINE_CONTEXTS.map((ctx) => (
                          <button
                            key={ctx.id}
                            type="button"
                            onClick={() => {
                              if (result && preview) {
                                addBaselineEntry(selectedCat.id, {
                                  imageUrl: preview,
                                  analysis: result.analysis,
                                  mood: detectedMood,
                                  context: ctx.label,
                                });
                                // Refresh cats to get updated baseline status
                                setCats(getCats());
                                setShowBaselinePrompt(false);
                              }
                            }}
                            className="tag text-xs hover:tag-accent transition-all"
                          >
                            + {ctx.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBaselinePrompt(false)}
                        className="text-xs text-[var(--text-muted)] mt-2 hover:underline"
                      >
                        Non ora
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview thumbnail */}
              {preview && (
                <div className="rounded-2xl overflow-hidden mb-4 bg-[var(--bg-secondary)]">
                  {previewType === 'video' ? (
                    <video src={preview} controls className="w-full max-h-[200px] object-contain" />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full max-h-[200px] object-contain" />
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={downloadAnalysis} className="btn-secondary flex-1">
                  <span>💾</span> Scarica
                </button>
                <button onClick={reset} className="btn-primary flex-1">
                  <span>🐾</span> Nuova Analisi
                </button>
              </div>
            </div>

            {/* Analysis Content */}
            <div className="card-premium p-6">
              <h3 className="text-subheading text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span>🐱</span> Cosa dice Shenzy
              </h3>
              <div
                className="prose prose-neutral max-w-none text-[var(--text-secondary)] leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: result.analysis
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--accent-primary)] font-semibold">$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br />')
                }}
              />
            </div>


            {/* Ask Shenzy */}
            <div className="card-premium p-6">
              <h3 className="text-subheading text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span>💬</span> Chiedi a Shenzy
              </h3>

              {!askAnswer ? (
                <div className="space-y-4">
                  {askCount >= 5 ? (
                    <div className="card-soft p-4 text-center">
                      <p className="text-[var(--text-secondary)] mb-2">
                        Hai raggiunto il limite di 5 domande per questa analisi.
                      </p>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        Fai una nuova analisi per continuare a chiedere!
                      </p>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={askQuestion}
                        onChange={(e) => setAskQuestion(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isAsking && handleAskShenzy()}
                        placeholder="Vuoi chiedermi qualcosa su questo comportamento?"
                        className="input-premium"
                      />
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleAskShenzy}
                          disabled={!askQuestion.trim() || isAsking}
                          className="btn-primary flex-1"
                        >
                          {isAsking ? 'Shenzy sta pensando...' : 'Chiedi'}
                        </button>
                        <span className="text-sm text-[var(--text-tertiary)] ml-3">
                          {askCount}/5
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="card-soft p-4">
                    <div
                      className="text-[var(--text-secondary)] leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: askAnswer
                          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--accent-primary)] font-semibold">$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                  <button
                    onClick={() => { setAskAnswer(null); setAskQuestion(''); }}
                    className="btn-secondary w-full"
                  >
                    Nuova domanda
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-caption text-[var(--text-muted)] max-w-md mx-auto">
            L'AI puo commettere errori. Non sostituisce la consulenza veterinaria.
            Per problemi di salute, consulta sempre un professionista.
          </p>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            Build: <span className="font-mono">{buildId}</span>
          </p>
        </footer>
      </div>

      {/* Cat Profile Modal */}
      <CatProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setEditingCat(null);
        }}
        onSave={handleSaveProfile}
        onDelete={handleDeleteProfile}
        editCat={editingCat}
      />

      {/* Quick Note Modal */}
      {showQuickNoteModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowQuickNoteModal(false);
              setQuickNote('');
            }
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative card-elevated p-6 w-full max-w-md animate-scaleIn"
            style={{ zIndex: 10000 }}
            onClick={(e) => e.stopPropagation()}
          >
            {quickNoteSaved ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success-light)] flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
                <h3 className="text-heading text-[var(--text-primary)]">Nota salvata!</h3>
              </div>
            ) : cats.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                  <span className="text-3xl">🐱</span>
                </div>
                <h3 className="text-heading text-[var(--text-primary)] mb-2">Nessun profilo salvato</h3>
                <p className="text-sm text-[var(--text-tertiary)] mb-4">
                  Crea prima un profilo per il tuo gatto
                </p>
                <button
                  onClick={() => {
                    setShowQuickNoteModal(false);
                    setShowProfileModal(true);
                  }}
                  className="btn-primary"
                  type="button"
                >
                  ➕ Crea profilo
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-heading text-[var(--text-primary)] mb-2">
                  📝 Nota per {cats.find(c => c.id === (selectedCatId || quickNoteCatId))?.name || 'il tuo gatto'}
                </h2>
                <p className="text-sm text-[var(--text-tertiary)] mb-4">
                  Scrivi liberamente o usa un template
                </p>

                {/* If multiple cats, allow quick switching (default is the selected one) */}
                {cats.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cats.map((cat) => {
                      const isActive = (selectedCatId || quickNoteCatId) === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCatId(cat.id);
                            setActiveCat(cat.id);
                            setQuickNoteCatId(cat.id);
                          }}
                          className={`tag text-xs transition-all ${isActive ? 'tag-accent' : ''}`}
                        >
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cat.color }} /> {cat.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Quick templates */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {QUICK_NOTE_TEMPLATES.map((template) => (
                    <button
                      key={template.label}
                      type="button"
                      onClick={() => setQuickNote(template.label)}
                      className={`tag text-xs transition-all hover:tag-accent ${quickNote === template.label ? 'tag-accent' : ''}`}
                    >
                      {template.emoji} {template.label}
                    </button>
                  ))}
                </div>

                {/* Custom note input */}
                <textarea
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="Scrivi qui la tua nota..."
                  rows={4}
                  className="input-premium resize-none mb-4"
                  autoFocus
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setQuickNote('');
                    }}
                    className="btn-secondary flex-1"
                    type="button"
                  >
                    Pulisci
                  </button>
                  <button
                    onClick={() => handleSaveQuickNote(quickNote)}
                    disabled={!quickNote.trim()}
                    className="btn-primary flex-1"
                    type="button"
                  >
                    💾 Salva
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReminderModal(false);
            }
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative card-elevated p-6 w-full max-w-md animate-scaleIn overflow-y-auto max-h-[90vh]"
            style={{ zIndex: 10000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-heading text-[var(--text-primary)] mb-2">
              🗓️ Nuovo Promemoria
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              Aggiungi un promemoria per {selectedCat?.name || 'il tuo gatto'}
            </p>

            {/* Mini calendario (minimo indispensabile) */}
            {selectedCatId && (
              <div className="card-soft p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  >
                    ←
                  </button>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {calendarMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  >
                    →
                  </button>
                </div>

                {(() => {
                  const ymd = (dt: Date) => {
                    const y = dt.getFullYear();
                    const m = String(dt.getMonth() + 1).padStart(2, '0');
                    const da = String(dt.getDate()).padStart(2, '0');
                    return `${y}-${m}-${da}`;
                  };

                  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
                  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
                  const daysInMonth = monthEnd.getDate();
                  const mondayIndex = (monthStart.getDay() + 6) % 7; // Monday=0

                  const byDay = new Map<string, Reminder[]>();
                  reminders.forEach((r) => {
                    const dayKey = ymd(new Date(r.dueDate));
                    byDay.set(dayKey, [...(byDay.get(dayKey) || []), r]);
                  });

                  const todayKey = ymd(new Date());

                  const cells: Array<{ key: string; label: string; inMonth: boolean }> = [];
                  for (let i = 0; i < mondayIndex; i++) cells.push({ key: `pad-${i}`, label: '', inMonth: false });
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dt = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                    cells.push({ key: ymd(dt), label: String(d), inMonth: true });
                  }
                  while (cells.length % 7 !== 0) cells.push({ key: `pad-end-${cells.length}`, label: '', inMonth: false });

                  const weekDays = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

                  return (
                    <div className="select-none">
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map((w, idx) => (
                          <div key={`${w}-${idx}`} className="text-center text-xs text-[var(--text-muted)] py-1">
                            {w}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {cells.map((c) => {
                          if (!c.inMonth) return <div key={c.key} className="h-10" />;

                          const dayReminders = byDay.get(c.key) || [];
                          const hasPending = dayReminders.some((r) => !r.completed);
                          const isOverdue = dayReminders.some((r) => !r.completed && new Date(r.dueDate).getTime() < Date.now());
                          const isSelected = newReminderDate === c.key;
                          const isToday = c.key === todayKey;

                          return (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => setNewReminderDate(c.key)}
                              className={[
                                'h-10 rounded-lg text-sm flex flex-col items-center justify-center transition-colors',
                                isSelected ? 'bg-[var(--accent-light)] border border-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]',
                                isToday ? 'ring-1 ring-[var(--accent-primary)]' : '',
                              ].join(' ')}
                              title={dayReminders.length ? `${dayReminders.length} promemoria` : 'Nessun promemoria'}
                            >
                              <span className={isOverdue ? 'text-[var(--error)] font-semibold' : 'text-[var(--text-primary)]'}>
                                {c.label}
                              </span>
                              {hasPending && (
                                <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-[var(--error)]' : 'bg-[var(--accent-primary)]'}`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Reminder Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Tipo
              </label>
              <div className="flex flex-wrap gap-2">
                {REMINDER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setNewReminderType(type.id);
                      setNewReminderRecurring(type.defaultRecurring);
                    }}
                    className={`tag transition-all ${newReminderType === type.id ? 'tag-accent' : ''}`}
                  >
                    {type.emoji} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Data scadenza
              </label>
              <input
                type="date"
                value={newReminderDate}
                onChange={(e) => setNewReminderDate(e.target.value)}
                className="input-premium"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Recurring Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Ricorrenza
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setNewReminderRecurring(null)}
                  className={`tag text-xs ${newReminderRecurring === null ? 'tag-accent' : ''}`}
                >
                  Una volta
                </button>
                <button
                  type="button"
                  onClick={() => setNewReminderRecurring('monthly')}
                  className={`tag text-xs ${newReminderRecurring === 'monthly' ? 'tag-accent' : ''}`}
                >
                  Mensile
                </button>
                <button
                  type="button"
                  onClick={() => setNewReminderRecurring('quarterly')}
                  className={`tag text-xs ${newReminderRecurring === 'quarterly' ? 'tag-accent' : ''}`}
                >
                  Trimestrale
                </button>
                <button
                  type="button"
                  onClick={() => setNewReminderRecurring('yearly')}
                  className={`tag text-xs ${newReminderRecurring === 'yearly' ? 'tag-accent' : ''}`}
                >
                  Annuale
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Note (opzionale)
              </label>
              <input
                type="text"
                value={newReminderNotes}
                onChange={(e) => setNewReminderNotes(e.target.value)}
                placeholder="Es: Dott. Rossi, ore 10:00..."
                className="input-premium"
              />
            </div>

            {/* Existing Reminders List */}
            {reminders.filter((r) => !r.completed).length > 0 && (
              <div className="mb-4 pt-4 border-t border-[var(--border-subtle)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Promemoria attivi
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {reminders
                    .filter((r) => !r.completed)
                    .map((r) => {
                      const type = REMINDER_TYPES.find((t) => t.id === r.type);
                      return (
                        <div key={r.id} className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-secondary)] rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <span>{type?.emoji || '📌'}</span>
                            <span className="text-[var(--text-primary)]">{r.title}</span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {new Date(r.dueDate).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteReminder(r.id)}
                            className="text-[var(--error)] text-sm hover:underline"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowReminderModal(false)}
                className="btn-secondary flex-1"
                type="button"
              >
                Chiudi
              </button>
              <button
                onClick={handleAddReminder}
                disabled={!newReminderDate}
                className="btn-primary flex-1"
                type="button"
              >
                ➕ Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Chat Modal */}
      {showChatModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChatModal(false);
            }
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative card-elevated p-6 w-full max-w-md animate-scaleIn flex flex-col"
            style={{ zIndex: 10000, maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ShenzyMascot mood="happy" size="sm" />
                <div>
                  <h2 className="text-heading text-[var(--text-primary)]">Chatta con Shenzy</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {CHAT_LIMIT - chatCount} messaggi rimanenti
                    {chatResetTime && chatCount > 0 && (
                      <span> • Reset tra {Math.ceil((chatResetTime - Date.now()) / (1000 * 60 * 60))}h</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[400px]">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[var(--text-tertiary)] text-sm mb-4">
                    Ciao! Sono Shenzy 🐱<br />
                    Chiedimi qualsiasi cosa sui gatti!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Perché i gatti fanno le fusa?', 'Come capire se il mio gatto è felice?', 'Cosa significa quando miagola?'].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setChatInput(q);
                        }}
                        className="tag text-xs hover:tag-accent transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-[var(--accent-primary)] text-white rounded-br-sm'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-sm'
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                ))
              )}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-2xl rounded-bl-sm">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            {chatCount >= CHAT_LIMIT ? (
              <div className="card-soft p-4 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Hai raggiunto il limite di {CHAT_LIMIT} messaggi.
                  {chatResetTime && (
                    <span className="block mt-1">
                      Potrai chattare di nuovo tra {Math.ceil((chatResetTime - Date.now()) / (1000 * 60 * 60))} ore.
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isChatting && handleChat()}
                  placeholder="Scrivi un messaggio..."
                  className="input-premium flex-1"
                  disabled={isChatting}
                />
                <button
                  onClick={handleChat}
                  disabled={!chatInput.trim() || isChatting}
                  className="btn-primary px-4"
                  type="button"
                >
                  📨
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
