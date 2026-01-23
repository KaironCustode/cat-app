// Cat Profile & Diary Storage System
// Manages cat profiles, analysis history, and comparisons

export interface HomeContext {
  living: 'indoor' | 'outdoor' | 'mixed' | '';
  otherAnimals: 'alone' | 'other-cats' | 'dogs' | 'other-cats-dogs' | 'other' | '';
  family: 'single' | 'couple' | 'family' | 'family-kids' | '';
}

export interface BaselineEntry {
  id: string;
  imageUrl: string; // base64 thumbnail
  analysis: string;
  mood: string;
  date: string;
  context: string; // "rilassato", "gioco", "dopo mangiato", etc.
}

export interface CatProfile {
  id: string;
  name: string;
  color: string; // hex color for UI
  birthDate?: string; // ISO date
  adoptionDate?: string; // ISO date
  photoUrl?: string; // base64 or blob URL
  createdAt: string;
  // New fields
  homeContext?: HomeContext;
  baseline?: BaselineEntry[]; // 3-5 reference analyses
  baselineComplete?: boolean;
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

export interface Reminder {
  id: string;
  catId: string;
  type: 'vet' | 'nails' | 'flea' | 'vaccine' | 'grooming' | 'other';
  title: string;
  dueDate: string; // ISO date
  completed: boolean;
  completedDate?: string;
  notes?: string;
  recurring?: 'monthly' | 'quarterly' | 'yearly' | null;
}

export const REMINDER_TYPES = [
  { id: 'vet', label: 'Visita veterinario', emoji: '🏥', defaultRecurring: 'yearly' as const },
  { id: 'nails', label: 'Taglio unghie', emoji: '✂️', defaultRecurring: 'monthly' as const },
  { id: 'flea', label: 'Antipulci', emoji: '🦟', defaultRecurring: 'monthly' as const },
  { id: 'vaccine', label: 'Vaccino', emoji: '💉', defaultRecurring: 'yearly' as const },
  { id: 'grooming', label: 'Toelettatura', emoji: '🛁', defaultRecurring: 'monthly' as const },
  { id: 'other', label: 'Altro', emoji: '📌', defaultRecurring: null },
];

const STORAGE_KEYS = {
  CATS: 'shenzy_cats',
  DIARY: 'shenzy_diary',
  ACTIVE_CAT: 'shenzy_active_cat',
  SETTINGS: 'shenzy_settings',
  REMINDERS: 'shenzy_reminders',
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

// Home context labels
export const HOME_CONTEXT_LABELS = {
  living: {
    '': 'Non specificato',
    indoor: 'Solo indoor',
    outdoor: 'Solo outdoor',
    mixed: 'Indoor + Outdoor',
  },
  otherAnimals: {
    '': 'Non specificato',
    alone: 'Vive solo',
    'other-cats': 'Con altri gatti',
    dogs: 'Con cani',
    'other-cats-dogs': 'Con gatti e cani',
    other: 'Altri animali',
  },
  family: {
    '': 'Non specificato',
    single: 'Persona singola',
    couple: 'Coppia',
    family: 'Famiglia',
    'family-kids': 'Famiglia con bambini',
  },
};

// Baseline context options
export const BASELINE_CONTEXTS = [
  { id: 'relaxed', label: 'Rilassato / A riposo' },
  { id: 'playing', label: 'Durante il gioco' },
  { id: 'after-food', label: 'Dopo mangiato' },
  { id: 'alert', label: 'Attento / In allerta' },
  { id: 'grooming', label: 'Durante la pulizia' },
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

/**
 * Smart mood detection that avoids false positives from negations.
 * E.g., "non sembra irritato" should NOT trigger 'aggressive'
 */
export function detectMood(analysis: string): string {
  const lowerAnalysis = analysis.toLowerCase();

  // Helper: check if keyword appears WITHOUT being negated
  // Negation words in Italian that typically negate what follows
  const negationPatterns = [
    /\bnon\s+(?:\w+\s+){0,3}/g, // "non" followed by up to 3 words
    /\bnessun[oa]?\s+(?:\w+\s+){0,2}/g, // "nessun/nessuna/nessuno"
    /\bsenza\s+(?:\w+\s+){0,2}/g, // "senza"
    /\bniente\s+(?:\w+\s+){0,2}/g, // "niente"
    /\bmai\s+(?:\w+\s+){0,2}/g, // "mai"
    /\bnon\s+c'è\s+/g, // "non c'è"
    /\bnon\s+sembra\s+/g, // "non sembra"
    /\bnon\s+appare\s+/g, // "non appare"
    /\bnon\s+mostra\s+/g, // "non mostra"
  ];

  // Remove negated phrases from analysis before checking keywords
  let cleanedAnalysis = lowerAnalysis;

  // Find and remove negation contexts (phrases starting with negation words)
  // We'll replace them with spaces to avoid false matches
  const negationStarts = ['non ', 'nessun', 'senza ', 'niente ', 'mai '];

  for (const neg of negationStarts) {
    let idx = cleanedAnalysis.indexOf(neg);
    while (idx !== -1) {
      // Find the end of this phrase (next punctuation or ~30 chars)
      const phraseEnd = cleanedAnalysis.substring(idx).search(/[.,:;!?\n]|$/);
      const endIdx = Math.min(idx + phraseEnd, idx + 40); // Max 40 chars from negation

      // Only remove if the negated phrase contains negative mood keywords
      const negatedPhrase = cleanedAnalysis.substring(idx, endIdx);
      const negativeKeywords = ['aggressiv', 'arrabbiat', 'irritat', 'ansios', 'stress', 'paura', 'teso', 'nervos', 'inquiet'];

      const hasNegativeKeyword = negativeKeywords.some(kw => negatedPhrase.includes(kw));

      if (hasNegativeKeyword) {
        // Replace the negated phrase with spaces
        cleanedAnalysis = cleanedAnalysis.substring(0, idx) + ' '.repeat(endIdx - idx) + cleanedAnalysis.substring(endIdx);
      }

      // Look for next occurrence
      idx = cleanedAnalysis.indexOf(neg, idx + 1);
    }
  }

  // Now check for moods in the cleaned analysis (negated phrases removed)

  // Aggressive/Irritated - only if NOT negated
  if (cleanedAnalysis.includes('aggressiv') || cleanedAnalysis.includes('arrabbiat') || cleanedAnalysis.includes('irritat')) {
    return 'aggressive';
  }

  // Anxious - only if NOT negated
  if (cleanedAnalysis.includes('ansios') || cleanedAnalysis.includes('stress') || cleanedAnalysis.includes('paura') || cleanedAnalysis.includes('teso')) {
    return 'anxious';
  }

  // Hunting - usually not negated, check original
  if (lowerAnalysis.includes('caccia') || lowerAnalysis.includes('predat') || lowerAnalysis.includes('allerta')) {
    return 'hunting';
  }

  // Happy - check original (positive moods are rarely negated in context)
  if (lowerAnalysis.includes('felic') || lowerAnalysis.includes('content') || lowerAnalysis.includes('giocos')) {
    return 'happy';
  }

  // Relaxed - these are the most common positive states
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

// ============ BASELINE ============

export function addBaselineEntry(
  catId: string,
  entry: Omit<BaselineEntry, 'id' | 'date'>
): BaselineEntry | null {
  const cat = getCat(catId);
  if (!cat) return null;

  const newEntry: BaselineEntry = {
    ...entry,
    id: `baseline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  };

  const baseline = cat.baseline || [];
  baseline.push(newEntry);

  // Mark as complete if we have 3+ entries
  const baselineComplete = baseline.length >= 3;

  updateCat(catId, { baseline, baselineComplete });
  return newEntry;
}

export function removeBaselineEntry(catId: string, entryId: string): boolean {
  const cat = getCat(catId);
  if (!cat || !cat.baseline) return false;

  const filtered = cat.baseline.filter((e) => e.id !== entryId);
  if (filtered.length === cat.baseline.length) return false;

  updateCat(catId, {
    baseline: filtered,
    baselineComplete: filtered.length >= 3,
  });
  return true;
}

export function getBaselineSummary(catId: string): string | null {
  const cat = getCat(catId);
  if (!cat || !cat.baseline || cat.baseline.length === 0) return null;

  const moods = cat.baseline.map((e) => e.mood);
  const moodCounts: Record<string, number> = {};
  moods.forEach((m) => {
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  });

  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const contexts = cat.baseline.map((e) => e.context).join(', ');

  return `Baseline di ${cat.name}: mood prevalente "${getMoodLabel(dominantMood || 'neutral')}" basato su ${cat.baseline.length} osservazioni (${contexts})`;
}

export function compareToBaseline(catId: string, currentMood: string): string | null {
  const cat = getCat(catId);
  if (!cat || !cat.baseline || cat.baseline.length < 2) return null;

  const baselineMoods = cat.baseline.map((e) => e.mood);
  const isTypical = baselineMoods.includes(currentMood);

  if (isTypical) {
    return `Questo comportamento rientra nella baseline di ${cat.name} - è il suo modo di essere.`;
  }

  // Check if current mood is concerning compared to baseline
  const positiveBaseline = baselineMoods.every(
    (m) => m === 'happy' || m === 'relaxed' || m === 'neutral'
  );
  const currentNegative = currentMood === 'anxious' || currentMood === 'aggressive';

  if (positiveBaseline && currentNegative) {
    return `⚠️ Attenzione: questo comportamento è diverso dalla baseline di ${cat.name}. Di solito è più sereno. Vale la pena osservare.`;
  }

  return `Comportamento leggermente diverso dalla baseline di ${cat.name}, ma niente di preoccupante.`;
}

// ============ REMINDERS ============

export function getReminders(catId?: string): Reminder[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
  const reminders: Reminder[] = data ? JSON.parse(data) : [];

  if (catId) {
    return reminders.filter((r) => r.catId === catId);
  }
  return reminders;
}

export function addReminder(reminder: Omit<Reminder, 'id' | 'completed'>): Reminder {
  const reminders = getReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    completed: false,
  };
  reminders.push(newReminder);
  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  return newReminder;
}

export function updateReminder(id: string, updates: Partial<Reminder>): Reminder | null {
  const reminders = getReminders();
  const index = reminders.findIndex((r) => r.id === id);
  if (index === -1) return null;

  reminders[index] = { ...reminders[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  return reminders[index];
}

export function completeReminder(id: string): Reminder | null {
  const reminders = getReminders();
  const index = reminders.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const reminder = reminders[index];
  reminder.completed = true;
  reminder.completedDate = new Date().toISOString();

  // If recurring, create next occurrence
  if (reminder.recurring) {
    const nextDate = new Date(reminder.dueDate);
    switch (reminder.recurring) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    const newReminder: Reminder = {
      ...reminder,
      id: `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dueDate: nextDate.toISOString(),
      completed: false,
      completedDate: undefined,
    };
    reminders.push(newReminder);
  }

  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  return reminder;
}

export function deleteReminder(id: string): boolean {
  const reminders = getReminders();
  const filtered = reminders.filter((r) => r.id !== id);
  if (filtered.length === reminders.length) return false;

  localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
  return true;
}

export function getUpcomingReminders(catId?: string, daysAhead: number = 7): Reminder[] {
  const reminders = getReminders(catId);
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return reminders
    .filter((r) => {
      if (r.completed) return false;
      const due = new Date(r.dueDate);
      return due >= now && due <= futureDate;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getOverdueReminders(catId?: string): Reminder[] {
  const reminders = getReminders(catId);
  const now = new Date();

  return reminders
    .filter((r) => {
      if (r.completed) return false;
      const due = new Date(r.dueDate);
      return due < now;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}
