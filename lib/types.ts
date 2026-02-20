// ============ CHAT TYPES ============

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface MemoryStore {
  conversations: Conversation[];
  currentConversationId: string | null;
}

// ============ SPARK DOMAIN TYPES ============

export type JourneyPhase = 'preparation' | 'acute' | 'early' | 'growth' | 'maintenance';

export interface UserProfile {
  id: string;
  name: string;
  quitDate: string;
  substanceHistory: string;
  primarySubstance: 'cannabis' | 'tobacco' | 'both';
  triggers: string[];
  replacementActivities: string[];
  journeyPhase: JourneyPhase;
  aiNotes: string;
  whyIQuit: string;
  createdAt: string;
  updatedAt: string;
}

export interface CravingEntry {
  id: string;
  timestamp: string;
  intensity: number;
  trigger: string;
  haltState: {
    hungry: boolean;
    angry: boolean;
    lonely: boolean;
    tired: boolean;
  };
  waited: boolean;
  waitedMinutes?: number;
  outcome: 'resisted' | 'used' | 'pending';
  notes?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  cannabisCount: number;
  tobaccoCount: number;
  symptoms: string[];
  mood: number;
  energyLevel?: number;
  sleepQuality?: number;
  notes: string;
  aiResponse?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  timestamp: string;
  content: string;
  aiResponse?: string;
  context: 'daily-anchor' | 'emergency' | 'chat' | 'reflection';
}

// ============ CONSTANTS ============

export const TRIGGER_OPTIONS = [
  'Boredom',
  'Stress',
  'Social situation',
  'Evening routine',
  'After meals',
  'Anxiety',
  'Celebration',
  'Loneliness',
  'Physical pain',
  'Habit / Autopilot',
  'Other',
] as const;

export const SYMPTOM_OPTIONS = [
  { id: 'insomnia', label: 'Insomnia / Sleep issues' },
  { id: 'irritability', label: 'Irritability' },
  { id: 'appetite_changes', label: 'Appetite changes' },
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'vivid_dreams', label: 'Vivid dreams' },
  { id: 'sweating', label: 'Night sweats' },
  { id: 'headache', label: 'Headache' },
  { id: 'brain_fog', label: 'Brain fog' },
  { id: 'depression', label: 'Low mood / Depression' },
  { id: 'cravings', label: 'Strong cravings' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'fatigue', label: 'Fatigue' },
] as const;

export const JOURNEY_PHASES: Record<JourneyPhase, { label: string; description: string; daysRange: string }> = {
  preparation: {
    label: 'Preparation',
    description: 'Mapping your triggers, installing replacements. Getting ready.',
    daysRange: 'Before Day 1',
  },
  acute: {
    label: 'Acute Withdrawal',
    description: 'The hardest part. Your body is adjusting. Every symptom is temporary.',
    daysRange: 'Days 1-14',
  },
  early: {
    label: 'Early Recovery',
    description: 'Withdrawal fading. New patterns forming. Stay vigilant.',
    daysRange: 'Days 15-90',
  },
  growth: {
    label: 'Growth Phase',
    description: 'Brain healing accelerating. Emotional regulation improving.',
    daysRange: 'Days 91-180',
  },
  maintenance: {
    label: 'Maintenance',
    description: 'New baseline established. Occasional cravings are normal.',
    daysRange: 'Day 180+',
  },
};
