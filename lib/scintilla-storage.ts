// Scintilla - nicotine companion for dad
// All storage keys prefixed 'scintilla_' to never collide with Spark II

export interface ScintillaProfile {
  id: string;
  name: string;
  quitDate: string;           // ISO date string (YYYY-MM-DD)
  cigarettesPerDay: number;   // old daily habit
  whyIQuit: string;           // motivation (can be empty)
  aiNotes: string;            // running AI observations
  createdAt: string;
  updatedAt: string;
}

export interface ScintillaCraving {
  id: string;
  timestamp: string;
  outcome: 'resistito' | 'fumato' | 'pending';
}

export interface ScintillaLog {
  id: string;
  date: string;               // YYYY-MM-DD
  cigarettesSmoked: number;   // actual cigarettes smoked (mapped from button tap)
  mood: 1 | 2 | 3 | 4;       // 1=difficile 2=così così 3=bene 4=benissimo
  notes: string;
  aiResponse?: string;
  createdAt: string;
}

const KEYS = {
  PROFILE: 'scintilla_profile',
  CRAVINGS: 'scintilla_cravings',
  LOGS: 'scintilla_logs',
};

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---- Profile ----

export function getScintillaProfile(): ScintillaProfile | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveScintillaProfile(profile: Partial<ScintillaProfile>): ScintillaProfile {
  const existing = getScintillaProfile();
  const now = new Date().toISOString();
  const updated: ScintillaProfile = {
    id: existing?.id || generateId('user'),
    name: '',
    quitDate: '',
    cigarettesPerDay: 20,
    whyIQuit: '',
    aiNotes: '',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...existing,
    ...profile,
  };
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(updated));
  return updated;
}

export function appendScintillaAiNotes(note: string): void {
  const profile = getScintillaProfile();
  if (!profile) return;
  const timestamp = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const updated = profile.aiNotes
    ? `${profile.aiNotes}\n[${timestamp}] ${note}`
    : `[${timestamp}] ${note}`;
  saveScintillaProfile({ aiNotes: updated });
}

// ---- Cravings ----

export function getScintillaCravings(): ScintillaCraving[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(KEYS.CRAVINGS);
  return data ? JSON.parse(data) : [];
}

export function addScintillaCraving(outcome: ScintillaCraving['outcome'] = 'pending'): ScintillaCraving {
  const cravings = getScintillaCravings();
  const entry: ScintillaCraving = {
    id: generateId('craving'),
    timestamp: new Date().toISOString(),
    outcome,
  };
  cravings.unshift(entry);
  localStorage.setItem(KEYS.CRAVINGS, JSON.stringify(cravings));
  return entry;
}

export function updateScintillaCraving(id: string, outcome: ScintillaCraving['outcome']): void {
  const cravings = getScintillaCravings();
  const idx = cravings.findIndex(c => c.id === id);
  if (idx !== -1) {
    cravings[idx] = { ...cravings[idx], outcome };
    localStorage.setItem(KEYS.CRAVINGS, JSON.stringify(cravings));
  }
}

// ---- Daily Logs ----

export function getScintillaLogs(limit?: number): ScintillaLog[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(KEYS.LOGS);
  const logs: ScintillaLog[] = data ? JSON.parse(data) : [];
  return limit ? logs.slice(0, limit) : logs;
}

export function getTodayScintillaLog(): ScintillaLog | null {
  const today = new Date().toISOString().split('T')[0];
  return getScintillaLogs().find(l => l.date === today) || null;
}

export function saveScintillaLog(log: Omit<ScintillaLog, 'id' | 'createdAt'>): ScintillaLog {
  const logs = getScintillaLogs();
  const existingIdx = logs.findIndex(l => l.date === log.date);

  if (existingIdx >= 0) {
    logs[existingIdx] = { ...logs[existingIdx], ...log };
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    return logs[existingIdx];
  }

  const newLog: ScintillaLog = {
    ...log,
    id: generateId('log'),
    createdAt: new Date().toISOString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  return newLog;
}

// ---- Computed stats ----

export function getScintillaDayCount(): number {
  const profile = getScintillaProfile();
  if (!profile?.quitDate) return 0;
  const [y, m, d] = profile.quitDate.split('-').map(Number);
  const quit = new Date(y, m - 1, d);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((todayMidnight.getTime() - quit.getTime()) / (1000 * 60 * 60 * 24)));
}

export function getScintillaCigarettesNotSmoked(): number {
  const profile = getScintillaProfile();
  if (!profile) return 0;
  const days = getScintillaDayCount();
  const expected = days * profile.cigarettesPerDay;
  const logs = getScintillaLogs();
  const totalSmoked = logs.reduce((sum, l) => sum + l.cigarettesSmoked, 0);
  return Math.max(0, expected - totalSmoked);
}

export function getScintillaConsecutiveCleanDays(): number {
  const logs = getScintillaLogs();
  let count = 0;
  for (const log of logs) {
    if (log.cigarettesSmoked === 0) count++;
    else break;
  }
  return count;
}

export function getScintillaTodayCravings(): number {
  const today = new Date().toISOString().split('T')[0];
  return getScintillaCravings().filter(c => c.timestamp.startsWith(today)).length;
}

export function getScintillaResisted7Days(): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return getScintillaCravings()
    .filter(c => new Date(c.timestamp) >= cutoff && c.outcome === 'resistito')
    .length;
}

// ---- Context document for AI ----

export function generateScintillaContext(): string {
  const profile = getScintillaProfile();
  if (!profile) return 'Nuovo utente. Nessun profilo ancora.';

  const days = getScintillaDayCount();
  const notSmoked = getScintillaCigarettesNotSmoked();
  const cleanDays = getScintillaConsecutiveCleanDays();
  const recentLogs = getScintillaLogs(7);
  const resisted7 = getScintillaResisted7Days();
  const todayCravings = getScintillaTodayCravings();

  // Internal phase (not shown to user)
  let phase = 'Mantenimento';
  if (days <= 7) phase = 'Astinenza acuta (primi giorni critici)';
  else if (days <= 30) phase = 'Adattamento (rottura delle abitudini)';
  else if (days <= 90) phase = 'Consolidamento (nuove routine)';

  let doc = `## Profilo
Nome: ${profile.name}
Data di smissione: ${profile.quitDate || 'Non ancora fissata'}
Giorni senza fumo: ${days}
Fase: ${phase}
Sigarette al giorno (prima): ${profile.cigarettesPerDay}
Sigarette non fumate (stima): circa ${notSmoked}
Giorni consecutivi senza sigarette: ${cleanDays}
Motivazione: "${profile.whyIQuit || 'Non specificata'}"`;

  if (recentLogs.length > 0) {
    doc += `\n\n## Ultimi 7 giorni`;
    for (const log of recentLogs) {
      const moodLabel = ['', 'difficile', 'così così', 'bene', 'benissimo'][log.mood];
      doc += `\n- ${log.date}: ${log.cigarettesSmoked} sigarette, umore: ${moodLabel}`;
      if (log.notes) doc += `, nota: "${log.notes}"`;
    }
  }

  doc += `\n\n## Voglie (ultimi 7 giorni)
Resistite: ${resisted7}
Oggi: ${todayCravings}`;

  if (profile.aiNotes) {
    doc += `\n\n## Note precedenti\n${profile.aiNotes}`;
  }

  return doc;
}
