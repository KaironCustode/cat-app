import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildDailyAnchorPrompt, buildLogResponsePrompt, buildSummaryPrompt } from '@/lib/spark-ai';

export const POST = async (request: Request) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const body = await request.json();

    const { messages, contextDocument, mode } = body as {
      messages: { role: string; content: string; imageUrl?: string }[];
      contextDocument: string;
      mode: 'chat' | 'daily-anchor' | 'daily-log-response' | 'emergency' | 'summary';
    };

    let systemPrompt: string;
    let maxTokens: number;

    switch (mode) {
      case 'daily-anchor':
        systemPrompt = buildDailyAnchorPrompt(contextDocument);
        maxTokens = 1000;
        break;
      case 'daily-log-response':
        systemPrompt = buildLogResponsePrompt(contextDocument, messages[messages.length - 1]?.content || '');
        maxTokens = 300;
        break;
      case 'emergency':
        systemPrompt = buildSystemPrompt(contextDocument) + '\n\nThe user is in crisis mode - they are about to relapse. Be grounding, brief, and direct. Remind them of their progress and why they quit. No lectures.';
        maxTokens = 300;
        break;
      case 'summary':
        systemPrompt = buildSummaryPrompt(contextDocument, messages[messages.length - 1]?.content || '');
        maxTokens = 500;
        break;
      default:
        systemPrompt = buildSystemPrompt(contextDocument);
        maxTokens = 500;
    }

    // Build Claude messages - supports Vision image content blocks
    const claudeMessages: Anthropic.MessageParam[] = messages.map((m) => {
      if (m.imageUrl && m.role === 'user') {
        const match = m.imageUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
        if (match) {
          const mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
          const base64Data = match[2];
          const contentBlocks: Anthropic.ContentBlockParam[] = [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data },
            },
          ];
          if (m.content) {
            contentBlocks.push({ type: 'text', text: m.content });
          }
          return { role: 'user' as const, content: contentBlocks };
        }
      }
      return { role: m.role as 'user' | 'assistant', content: m.content };
    });

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
        if (text) {
          content = text;
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        const error = err as { message?: string; status?: number };
        console.warn(`Chat model ${model} failed:`, error.message);
        if (error.status !== 500) throw err;
      }
    }

    if (!content) {
      throw lastError || new Error('AI response failed');
    }

    return NextResponse.json({ response: content });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    );
  }
};
