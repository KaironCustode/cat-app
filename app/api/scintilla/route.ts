import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  buildScintillaSystemPrompt,
  buildScintillaCravingPrompt,
  buildScintillaLogPrompt,
  buildScintillaEmergencyPrompt,
} from '@/lib/scintilla-ai';

export const POST = async (request: Request) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY non configurata');
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const body = await request.json();

    const { messages, contextDocument, mode, logEntry } = body as {
      messages: { role: string; content: string }[];
      contextDocument: string;
      mode: 'chat' | 'craving' | 'log' | 'emergency';
      logEntry?: string;
    };

    let systemPrompt: string;
    let maxTokens: number;

    switch (mode) {
      case 'craving':
        systemPrompt = buildScintillaCravingPrompt(contextDocument);
        maxTokens = 250;
        break;
      case 'log':
        systemPrompt = buildScintillaLogPrompt(contextDocument, logEntry || '');
        maxTokens = 250;
        break;
      case 'emergency':
        systemPrompt = buildScintillaEmergencyPrompt(contextDocument);
        maxTokens = 200;
        break;
      default:
        systemPrompt = buildScintillaSystemPrompt(contextDocument);
        maxTokens = 400;
    }

    const claudeMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const models = ['claude-sonnet-4-20250514', 'claude-3-5-haiku-latest'];
    let content = '';
    let lastError: unknown = null;

    for (const model of models) {
      try {
        const msg = await anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: claudeMessages,
        });
        const block = msg.content.find((b) => b.type === 'text');
        const text = block && 'text' in block ? block.text.trim() : '';
        if (text) { content = text; break; }
      } catch (err: unknown) {
        lastError = err;
        const e = err as { status?: number };
        if (e.status !== 500) throw err;
      }
    }

    if (!content) throw lastError || new Error('Risposta AI non disponibile');

    return NextResponse.json({ response: content });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Scintilla API error:', err);
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 });
  }
};
