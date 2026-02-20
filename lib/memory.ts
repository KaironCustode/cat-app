import { Message, Conversation, MemoryStore } from './types';

const STORAGE_KEY = 'spark_memory';

export function loadMemory(): MemoryStore {
  if (typeof window === 'undefined') return { conversations: [], currentConversationId: null };

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { conversations: [], currentConversationId: null };

  try {
    return JSON.parse(stored);
  } catch {
    return { conversations: [], currentConversationId: null };
  }
}

export function saveMemory(memory: MemoryStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function createConversation(): Conversation {
  return {
    id: Date.now().toString(),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function addMessage(conversation: Conversation, message: Message): Conversation {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: Date.now(),
  };
}

export function getCurrentConversation(memory: MemoryStore): Conversation {
  if (memory.currentConversationId) {
    const current = memory.conversations.find(c => c.id === memory.currentConversationId);
    if (current) return current;
  }
  return createConversation();
}

export function updateConversation(memory: MemoryStore, conversation: Conversation): MemoryStore {
  const exists = memory.conversations.find(c => c.id === conversation.id);

  if (exists) {
    return {
      ...memory,
      conversations: memory.conversations.map(c =>
        c.id === conversation.id ? conversation : c
      ),
      currentConversationId: conversation.id,
    };
  } else {
    return {
      ...memory,
      conversations: [...memory.conversations, conversation],
      currentConversationId: conversation.id,
    };
  }
}
