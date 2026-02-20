import {
  UserProfile,
  CravingEntry,
  DailyLog,
  JournalEntry,
  JourneyPhase,
  JOURNEY_PHASES,
} from './types';

const STORAGE_KEYS = {
  PROFILE: 'spark_profile',
  CRAVINGS: 'spark_cravings',
  DAILY_LOGS: 'spark_daily_logs',
  JOURNAL: 'spark_journal',
  SETTINGS: 'spark_settings',
};

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ============ USER PROFILE ============

export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: Partial<UserProfile>): UserProfile {
  const existing = getProfile();
  const now = new Date().toISOString();

  const updated: UserProfile = {
    id: existing?.id || generateId('user'),
    name: '',
    quitDate: '',
    substanceHistory: '',
    primarySubstance: 'cannabis',
    triggers: [],
    replacementActivities: [],
    journeyPhase: 'preparation',
    aiNotes: '',
    whyIQuit: '',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...existing,
    ...profile,
  };

  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  return updated;
}

export function updateProfile(updates: Partial<UserProfile>): UserProfile | null {
  const existing = getProfile();
  if (!existing) return null;

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  return updated;
}

export function appendDailySummary(summary: string): void {
  const profile = getProfile();
  if (!profile) return;

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const separator = '\n---\n';
  const entry = `[SESSION SUMMARY - ${today}]\n${summary}`;

  const updatedNotes = profile.aiNotes
    ? `${profile.aiNotes}${separator}${entry}`
    : entry;

  updateProfile({ aiNotes: updatedNotes });
}

export function appendAiNotes(note: string): void {
  const profile = getProfile();
  if (!profile) return;

  const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const updatedNotes = profile.aiNotes
    ? `${profile.aiNotes}\n[${timestamp}] ${note}`
    : `[${timestamp}] ${note}`;

  updateProfile({ aiNotes: updatedNotes });
}

// ============ CRAVINGS ============

export function getCravings(limit?: number): CravingEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.CRAVINGS);
  const cravings: CravingEntry[] = data ? JSON.parse(data) : [];
  return limit ? cravings.slice(0, limit) : cravings;
}

export function addCraving(entry: Omit<CravingEntry, 'id' | 'timestamp'>): CravingEntry {
  const cravings = getCravings();
  const newEntry: CravingEntry = {
    ...entry,
    id: generateId('craving'),
    timestamp: new Date().toISOString(),
  };
  cravings.unshift(newEntry);
  localStorage.setItem(STORAGE_KEYS.CRAVINGS, JSON.stringify(cravings));
  return newEntry;
}

export function updateCraving(id: string, updates: Partial<CravingEntry>): CravingEntry | null {
  const cravings = getCravings();
  const index = cravings.findIndex(c => c.id === id);
  if (index === -1) return null;

  cravings[index] = { ...cravings[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.CRAVINGS, JSON.stringify(cravings));
  return cravings[index];
}

// ============ DAILY LOGS ============

export function getDailyLogs(limit?: number): DailyLog[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
  const logs: DailyLog[] = data ? JSON.parse(data) : [];
  return limit ? logs.slice(0, limit) : logs;
}

export function getTodayLog(): DailyLog | null {
  const today = new Date().toISOString().split('T')[0];
  const logs = getDailyLogs();
  return logs.find(l => l.date === today) || null;
}

export function saveDailyLog(log: Omit<DailyLog, 'id' | 'createdAt'>): DailyLog {
  const logs = getDailyLogs();
  const existingIndex = logs.findIndex(l => l.date === log.date);

  if (existingIndex >= 0) {
    logs[existingIndex] = {
      ...logs[existingIndex],
      ...log,
    };
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    return logs[existingIndex];
  }

  const newLog: DailyLog = {
    ...log,
    id: generateId('log'),
    createdAt: new Date().toISOString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
  return newLog;
}

// ============ JOURNAL ============

export function getJournal(limit?: number): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.JOURNAL);
  const entries: JournalEntry[] = data ? JSON.parse(data) : [];
  return limit ? entries.slice(0, limit) : entries;
}

export function addJournalEntry(entry: Omit<JournalEntry, 'id' | 'timestamp'>): JournalEntry {
  const journal = getJournal();
  const newEntry: JournalEntry = {
    ...entry,
    id: generateId('journal'),
    timestamp: new Date().toISOString(),
  };
  journal.unshift(newEntry);
  localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journal));
  return newEntry;
}

// ============ COMPUTED / ANALYTICS ============

export function getDayCount(): number {
  const profile = getProfile();
  if (!profile?.quitDate) return 0;

  // Parse quit date as local midnight (not UTC) to avoid timezone drift
  const [y, m, d] = profile.quitDate.split('-').map(Number);
  const quit = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today.getTime() - quit.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function getCurrentPhase(): JourneyPhase {
  const days = getDayCount();
  if (days === 0) return 'preparation';
  if (days <= 14) return 'acute';
  if (days <= 90) return 'early';
  if (days <= 180) return 'growth';
  return 'maintenance';
}

export function getCleanDays(): number {
  const logs = getDailyLogs();
  let cleanDays = 0;

  for (const log of logs) {
    if (log.cannabisCount === 0) {
      cleanDays++;
    } else {
      break;
    }
  }
  return cleanDays;
}

export function getRecentCravingPatterns(days: number = 7) {
  const cravings = getCravings();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recent = cravings.filter(c => new Date(c.timestamp) >= cutoff);

  const triggers: Record<string, number> = {};
  const haltCounts = { hungry: 0, angry: 0, lonely: 0, tired: 0 };
  let totalIntensity = 0;

  for (const c of recent) {
    triggers[c.trigger] = (triggers[c.trigger] || 0) + 1;
    totalIntensity += c.intensity;
    if (c.haltState.hungry) haltCounts.hungry++;
    if (c.haltState.angry) haltCounts.angry++;
    if (c.haltState.lonely) haltCounts.lonely++;
    if (c.haltState.tired) haltCounts.tired++;
  }

  return {
    triggers,
    averageIntensity: recent.length > 0 ? Math.round(totalIntensity / recent.length) : 0,
    totalCount: recent.length,
    resistedCount: recent.filter(c => c.outcome === 'resisted').length,
    haltBreakdown: haltCounts,
  };
}

export function getWeekSummary() {
  const logs = getDailyLogs(7);
  const cravings = getRecentCravingPatterns(7);

  let totalMood = 0;
  let usageDays = 0;
  const allSymptoms: Record<string, number> = {};

  for (const log of logs) {
    totalMood += log.mood;
    if (log.cannabisCount > 0) usageDays++;
    for (const s of log.symptoms) {
      allSymptoms[s] = (allSymptoms[s] || 0) + 1;
    }
  }

  const topSymptoms = Object.entries(allSymptoms)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  return {
    avgMood: logs.length > 0 ? Math.round((totalMood / logs.length) * 10) / 10 : 0,
    totalCravings: cravings.totalCount,
    resistedCravings: cravings.resistedCount,
    usageDays,
    cleanDays: logs.length - usageDays,
    topSymptoms,
  };
}

// ============ CONTEXT DOCUMENT ============

export function generateContextDocument(): string {
  const profile = getProfile();
  if (!profile) return 'No user profile yet. This is a new user.';

  const dayCount = getDayCount();
  const phase = getCurrentPhase();
  const phaseInfo = JOURNEY_PHASES[phase];
  const week = getWeekSummary();
  const patterns = getRecentCravingPatterns(7);
  const recentLogs = getDailyLogs(7);

  let doc = `## User Profile
Name: ${profile.name}
Quit Date: ${profile.quitDate || 'Not set yet'}
Day Count: ${dayCount}
Phase: ${phaseInfo.label} (${phaseInfo.daysRange})
Primary Substance: ${profile.primarySubstance}
History: ${profile.substanceHistory || 'Not shared yet'}
Why They Quit: "${profile.whyIQuit || 'Not shared yet'}"
Known Triggers: ${profile.triggers.length > 0 ? profile.triggers.join(', ') : 'None identified yet'}
Replacement Activities: ${profile.replacementActivities.length > 0 ? profile.replacementActivities.join(', ') : 'None yet'}`;

  if (recentLogs.length > 0) {
    doc += `\n\n## Last 7 Days`;
    for (const log of recentLogs) {
      doc += `\n- ${log.date}: mood ${log.mood}/10, cannabis: ${log.cannabisCount}, tobacco: ${log.tobaccoCount}`;
      if (log.symptoms.length > 0) doc += `, symptoms: ${log.symptoms.join(', ')}`;
      if (log.notes) doc += ` | "${log.notes}"`;
    }
  }

  if (patterns.totalCount > 0) {
    doc += `\n\n## Craving Patterns (Last 7 Days)
Total cravings: ${patterns.totalCount}
Resisted: ${patterns.resistedCount}/${patterns.totalCount}
Average intensity: ${patterns.averageIntensity}/10`;

    const topTrigger = Object.entries(patterns.triggers).sort((a, b) => b[1] - a[1])[0];
    if (topTrigger) doc += `\nTop trigger: ${topTrigger[0]} (${topTrigger[1]} times)`;

    const topHalt = Object.entries(patterns.haltBreakdown).sort((a, b) => b[1] - a[1])[0];
    if (topHalt && topHalt[1] > 0) doc += `\nMost common HALT state: ${topHalt[0]}`;
  }

  if (week.avgMood > 0) {
    doc += `\n\n## Week Summary
Average mood: ${week.avgMood}/10
Clean days: ${week.cleanDays}/7
Top symptoms: ${week.topSymptoms.length > 0 ? week.topSymptoms.join(', ') : 'None reported'}`;
  }

  if (profile.aiNotes) {
    doc += `\n\n## AI Observations\n${profile.aiNotes}`;
  }

  return doc;
}

// ============ DATA MANAGEMENT ============

export function exportAllData(): string {
  return JSON.stringify({
    profile: getProfile(),
    cravings: getCravings(),
    dailyLogs: getDailyLogs(),
    journal: getJournal(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  localStorage.removeItem('spark_memory');
}
