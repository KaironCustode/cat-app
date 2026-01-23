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
  addDiaryEntry,
  detectMood,
  generateSignalsToWatch,
  compareToPreviousAnalyses,
  compareToBaseline,
  getMoodEmoji,
  addBaselineEntry,
  CatProfile,
  HomeContext,
  CAT_COLORS,
  HOME_CONTEXT_LABELS,
  BASELINE_CONTEXTS,
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

// Premium progress indicator
const ProgressIndicator = ({ progress }: { progress: number }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          {progress < 40 ? 'Preparazione...' : progress < 70 ? 'Estrazione frame...' : progress < 90 ? 'Analisi in corso...' : 'Quasi fatto...'}
        </span>
        <span className="text-sm font-semibold text-[var(--accent-primary)]">{Math.round(progress)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

// Feature card component
const FeatureCard = ({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick?: () => void }) => (
  <div
    className="card-premium p-6 text-center hover:shadow-lg transition-all duration-300 group cursor-pointer"
    onClick={onClick}
  >
    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
    <p className="text-sm text-[var(--text-tertiary)]">{subtitle}</p>
  </div>
);

// Cat Profile Modal with Home Context
const CatProfileModal = ({
  isOpen,
  onClose,
  onSave,
  editCat,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, homeContext?: HomeContext) => void;
  editCat?: CatProfile | null;
}) => {
  const [name, setName] = useState(editCat?.name || '');
  const [color, setColor] = useState(editCat?.color || CAT_COLORS[0]);
  const [homeContext, setHomeContext] = useState<HomeContext>({
    living: editCat?.homeContext?.living || '',
    otherAnimals: editCat?.homeContext?.otherAnimals || '',
    family: editCat?.homeContext?.family || '',
  });

  useEffect(() => {
    if (editCat) {
      setName(editCat.name);
      setColor(editCat.color);
      setHomeContext({
        living: editCat.homeContext?.living || '',
        otherAnimals: editCat.homeContext?.otherAnimals || '',
        family: editCat.homeContext?.family || '',
      });
    } else {
      setName('');
      setColor(CAT_COLORS[0]);
      setHomeContext({ living: '', otherAnimals: '', family: '' });
    }
  }, [editCat, isOpen]);

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
            <div className="flex gap-2 flex-wrap">
              {CAT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-[var(--accent-primary)] scale-110' : 'hover:scale-105'}`}
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
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1" type="button">
            Annulla
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSave(name.trim(), color, homeContext);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, []);

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
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nell'analisi");
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
      formData.append('images', imageFile);
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nell'analisi");
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

  const handleSaveProfile = (name: string, color: string, homeContext?: HomeContext) => {
    if (editingCat) {
      // Update existing cat
      const updated = updateCat(editingCat.id, { name, color, homeContext });
      if (updated) {
        setCats(cats.map(c => c.id === editingCat.id ? updated : c));
      }
    } else {
      // Create new cat
      const newCat = saveCat({ name, color, homeContext });
      setCats([...cats, newCat]);
      setSelectedCatId(newCat.id);
      setActiveCat(newCat.id);
    }
    setEditingCat(null);
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
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
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
            <div className="grid grid-cols-2 gap-4 mb-12 stagger-children max-w-md mx-auto">
              <FeatureCard
                icon="📁"
                title="Galleria"
                subtitle="Carica file"
                onClick={() => fileInputRef.current?.click()}
              />
              <FeatureCard icon="🤖" title="AI" subtitle="Shenzy" />
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
                  <span className="font-medium text-[var(--text-secondary)]">Shenzy sta analizzando...</span>
                </div>
                <ProgressIndicator progress={progress} />
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
                <div className={`tag ${detectedMood === 'happy' || detectedMood === 'relaxed' ? 'tag-success' : 'tag-accent'}`}>
                  {getMoodEmoji(detectedMood)} {detectedMood === 'happy' ? 'Felice' : detectedMood === 'relaxed' ? 'Rilassato' : detectedMood === 'anxious' ? 'Ansioso' : detectedMood === 'hunting' ? 'In caccia' : detectedMood === 'aggressive' ? 'Irritato' : 'Neutro'}
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

            {/* Signals to Watch */}
            {signals.length > 0 && (
              <div className="card-accent p-6">
                <h3 className="text-subheading text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <span>👀</span> Segnali da osservare
                </h3>
                <ul className="space-y-3">
                  {signals.map((signal, i) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] mt-2 flex-shrink-0" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
        editCat={editingCat}
      />

    </div>
  );
}
