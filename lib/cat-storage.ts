// Cat Profile & Diary Storage System
// Manages cat profiles, analysis history, and comparisons

export interface CatProfile {
  id: string;
  name: string;
  color: string; // hex color for UI
  birthDate?: string; // ISO date
  adoptionDate?: string; // ISO date
  photoUrl?: string; // base64 or blob URL
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  catId: string;
  type: 'analysis' | 'note' | 'milestone';
  date: string; // ISO date

  // For analysis entries
  analysis?: string;
  imageCount?: number;
  isVideo?: boolean;
  mood?: string; // detected mood: happy, anxious, hunting, aggressive, relaxed
  signals?: string[]; // signals to watch

  // For manual notes
  note?: string;

  // For milestones
  milestone?: string; // birthday, adoption-anniversary, etc.
}

export interface CatComparison {
  trend: 'improving' | 'stable' | 'concerning' | 'unknown';
  moodHistory: { date: string; mood: string }[];
  lastSimilarEntry?: DiaryEntry;
  summary: string;
}

const STORAGE_KEYS = {
  CATS: 'shenzy_cats',
  DIARY: 'shenzy_diary',
  ACTIVE_CAT: 'shenzy_active_cat',
  SETTINGS: 'shenzy_settings',
};

// Default cat colors (warm palette)
export const CAT_COLORS = [
  '#FFFFFF', // white
  '#000000', // black
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#10B981', // emerald
  '#3B82F6', // blue
  '#EC4899', // pink
  '#F97316', // orange
  '#6366F1', // indigo
];

// ============ CAT PROFILES ============

export function getCats(): CatProfile[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.CATS);
  return data ? JSON.parse(data) : [];
}

export function getCat(id: string): CatProfile | undefined {
  return getCats().find(cat => cat.id === id);
}

export function saveCat(cat: Omit<CatProfile, 'id' | 'createdAt'>): CatProfile {
  const cats = getCats();
  const newCat: CatProfile = {
    ...cat,
    id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  cats.push(newCat);
  localStorage.setItem(STORAGE_KEYS.CATS, JSON.stringify(cats));
  return newCat;
}

export function updateCat(id: string, updates: Partial<CatProfile>): CatProfile | null {
  const cats = getCats();
  const index = cats.findIndex(cat => cat.id === id);
  if (index === -1) return null;

  cats[index] = { ...cats[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.CATS, JSON.stringify(cats));
  return cats[index];
}

export function deleteCat(id: string): boolean {
  const cats = getCats();
  const filtered = cats.filter(cat => cat.id !== id);
  if (filtered.length === cats.length) return false;

  localStorage.setItem(STORAGE_KEYS.CATS, JSON.stringify(filtered));

  // Also delete diary entries for this cat
  const diary = getDiary();
  const filteredDiary = diary.filter(entry => entry.catId !== id);
  localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(filteredDiary));

  return true;
}

// ============ ACTIVE CAT ============

export function getActiveCat(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CAT);
}

export function setActiveCat(catId: string | null): void {
  if (catId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CAT, catId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CAT);
  }
}

// ============ DIARY ============

export function getDiary(catId?: string): DiaryEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.DIARY);
  const diary: DiaryEntry[] = data ? JSON.parse(data) : [];

  if (catId) {
    return diary.filter(entry => entry.catId === catId);
  }
  return diary;
}

export function addDiaryEntry(entry: Omit<DiaryEntry, 'id' | 'date'>): DiaryEntry {
  const diary = getDiary();
  const newEntry: DiaryEntry = {
    ...entry,
    id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  };
  diary.unshift(newEntry); // Most recent first
  localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(diary));
  return newEntry;
}

export function deleteDiaryEntry(id: string): boolean {
  const diary = getDiary();
  const filtered = diary.filter(entry => entry.id !== id);
  if (filtered.length === diary.length) return false;

  localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(filtered));
  return true;
}

// ============ MOOD DETECTION ============

export function detectMood(analysis: string): string {
  const lowerAnalysis = analysis.toLowerCase();

  if (lowerAnalysis.includes('aggressiv') || lowerAnalysis.includes('arrabbiat') || lowerAnalysis.includes('irritat')) {
    return 'aggressive';
  }
  if (lowerAnalysis.includes('ansios') || lowerAnalysis.includes('stress') || lowerAnalysis.includes('paura') || lowerAnalysis.includes('teso')) {
    return 'anxious';
  }
  if (lowerAnalysis.includes('caccia') || lowerAnalysis.includes('predat') || lowerAnalysis.includes('allerta')) {
    return 'hunting';
  }
  if (lowerAnalysis.includes('felic') || lowerAnalysis.includes('content') || lowerAnalysis.includes('giocos')) {
    return 'happy';
  }
  if (lowerAnalysis.includes('rilassat') || lowerAnalysis.includes('tranquill') || lowerAnalysis.includes('sereno') || lowerAnalysis.includes('calmo')) {
    return 'relaxed';
  }

  return 'neutral';
}

export function getMoodEmoji(mood: string): string {
  const moods: Record<string, string> = {
    happy: '😺',
    relaxed: '😌',
    anxious: '😰',
    hunting: '🐈',
    aggressive: '😾',
    neutral: '🐱',
  };
  return moods[mood] || '🐱';
}

export function getMoodLabel(mood: string): string {
  const labels: Record<string, string> = {
    happy: 'Felice',
    relaxed: 'Rilassato',
    anxious: 'Ansioso',
    hunting: 'In caccia',
    aggressive: 'Irritato',
    neutral: 'Neutro',
  };
  return labels[mood] || 'Neutro';
}

// ============ SIGNALS TO WATCH ============

export function generateSignalsToWatch(mood: string, analysis: string): string[] {
  const signals: string[] = [];
  const lowerAnalysis = analysis.toLowerCase();

  // Base signals by mood
  if (mood === 'anxious') {
    signals.push('Cambiamenti di appetito nei prossimi giorni');
    signals.push('Grooming eccessivo (leccarsi troppo)');
    signals.push('Tendenza a nascondersi');
  }

  if (mood === 'aggressive') {
    signals.push('Reazioni improvvise a stimoli normali');
    signals.push('Cambiamenti nella routine della lettiera');
    signals.push('Evita il contatto fisico');
  }

  if (mood === 'hunting') {
    signals.push('Comportamento notturno più attivo');
    signals.push('Agguati frequenti (anche giocosi)');
  }

  if (mood === 'happy' || mood === 'relaxed') {
    signals.push('Ottimo! Mantieni la routine attuale');
    if (lowerAnalysis.includes('cibo') || lowerAnalysis.includes('fame')) {
      signals.push('Monitora che mangi regolarmente');
    }
  }

  // Context-specific signals
  if (lowerAnalysis.includes('coda') && (lowerAnalysis.includes('gonfi') || lowerAnalysis.includes('arriccia'))) {
    signals.push('Coda gonfia/arruffata potrebbe indicare paura o eccitazione');
  }

  if (lowerAnalysis.includes('orecchie') && lowerAnalysis.includes('indietro')) {
    signals.push('Orecchie appiattite frequentemente = possibile disagio');
  }

  if (lowerAnalysis.includes('pupill') && lowerAnalysis.includes('dilat')) {
    signals.push('Pupille dilatate in piena luce potrebbero indicare stress');
  }

  // Limit to 3-4 signals
  return signals.slice(0, 4);
}

// ============ TIME COMPARISON ============

export function compareToPreviousAnalyses(catId: string, currentMood: string): CatComparison {
  const diary = getDiary(catId).filter(e => e.type === 'analysis');

  if (diary.length <= 1) {
    return {
      trend: 'unknown',
      moodHistory: [],
      summary: 'Prima analisi per questo gatto. Continua a osservare!',
    };
  }

  // Get last 5 analyses (excluding current which was just added)
  const recentEntries = diary.slice(1, 6);
  const moodHistory = recentEntries.map(e => ({
    date: e.date,
    mood: e.mood || 'neutral',
  }));

  // Count moods
  const moodCounts: Record<string, number> = {};
  recentEntries.forEach(e => {
    const m = e.mood || 'neutral';
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  });

  // Find dominant previous mood
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  // Determine trend
  let trend: CatComparison['trend'] = 'stable';
  let summary = '';

  const positiveMovement =
    (dominantMood === 'anxious' || dominantMood === 'aggressive') &&
    (currentMood === 'relaxed' || currentMood === 'happy');

  const negativeMovement =
    (dominantMood === 'relaxed' || dominantMood === 'happy') &&
    (currentMood === 'anxious' || currentMood === 'aggressive');

  if (positiveMovement) {
    trend = 'improving';
    summary = `Ottimo! Rispetto alle ultime ${recentEntries.length} osservazioni, sembra più sereno.`;
  } else if (negativeMovement) {
    trend = 'concerning';
    summary = `Attenzione: rispetto alle ultime osservazioni, sembra più teso. Vale la pena monitorare.`;
  } else if (currentMood === dominantMood) {
    trend = 'stable';
    summary = `Comportamento stabile rispetto alle ultime ${recentEntries.length} osservazioni.`;
  } else {
    trend = 'stable';
    summary = `Leggera variazione rispetto al solito, niente di preoccupante.`;
  }

  // Find last similar entry
  const lastSimilar = recentEntries.find(e => e.mood === currentMood);

  return {
    trend,
    moodHistory,
    lastSimilarEntry: lastSimilar,
    summary,
  };
}

// ============ SPECIAL MOMENTS ============

export function checkSpecialMoments(cat: CatProfile): { type: string; message: string } | null {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Check birthday
  if (cat.birthDate) {
    const birth = new Date(cat.birthDate);
    if (birth.getMonth() === todayMonth && birth.getDate() === todayDay) {
      const age = today.getFullYear() - birth.getFullYear();
      return {
        type: 'birthday',
        message: `Buon compleanno ${cat.name}! Oggi compie ${age} anni! 🎂`,
      };
    }
  }

  // Check adoption anniversary
  if (cat.adoptionDate) {
    const adoption = new Date(cat.adoptionDate);
    if (adoption.getMonth() === todayMonth && adoption.getDate() === todayDay) {
      const years = today.getFullYear() - adoption.getFullYear();
      if (years > 0) {
        return {
          type: 'adoption',
          message: `Oggi è l'anniversario di adozione di ${cat.name}! ${years} anni insieme! 🏠💕`,
        };
      }
    }
  }

  return null;
}

// ============ SETTINGS ============

export interface AppSettings {
  calmMode: boolean;
  notificationsEnabled: boolean;
}

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return { calmMode: false, notificationsEnabled: true };
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : { calmMode: false, notificationsEnabled: true };
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const newSettings = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  return newSettings;
}
