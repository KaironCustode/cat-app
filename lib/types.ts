export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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