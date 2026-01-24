import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { catBehaviorKnowledge } from '@/lib/cat-behavior-knowledge';

export const POST = async (request: Request) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const body = await request.json();

    // Support both legacy format (messages array) and new simple format (message string)
    if (body.message) {
      // New simple chat format for Shenzy chat
      const { message, catName } = body;

      const prompt = `${catBehaviorKnowledge}

---

Il tuo nome è Shenzy.

REGOLE (CRITICHE):
- Non parlare MAI di Claude, Grok, Anthropic, xAI, "modelli", "prompt", "regole", o del fatto che sei un'AI. Niente meta.
- Non fare preamboli tipo "Certo!", "Assolutamente!", "Grande domanda!". Rispondi direttamente.
${catName ? `- L'utente ha un gatto di nome ${catName}.` : ''}
- Parla SOLO del mondo felino (gatti). Se l'utente chiede altro, rifiuta gentilmente in una frase e riporta la conversazione sui gatti.
- Se la domanda è medica/veterinaria: dai solo informazioni generali e prudenti, senza diagnosi; suggerisci di sentire il veterinario se ci sono sintomi importanti o dubbi.

STILE:
- Rispondi in italiano
- Max 100 parole
- Tono: caldo, curioso, appassionato di gatti
- Usa **grassetto** per 1-2 parole chiave importanti
- Se non sai qualcosa, dillo onestamente
- Rispondi come in una conversazione naturale

---

DOMANDA DELL'UTENTE:
${message}`;

      const models = ['claude-3-5-haiku-latest', 'claude-3-haiku-20240307'];
      let reply = '';
      let lastError: any = null;

      for (const model of models) {
        try {
          const msg = await anthropic.messages.create({
            model,
            max_tokens: 300,
            messages: [{ role: 'user', content: prompt }],
          });

          const block = msg.content.find((b) => b.type === 'text');
          const text = block && 'text' in block ? block.text.trim() : '';
          if (text) {
            reply = text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Chat model ${model} failed:`, err.message);
          if (err.status !== 500) throw err;
        }
      }

      if (!reply) {
        throw lastError || new Error('Claude chat failed');
      }

      return NextResponse.json({ reply });
    }

    // Legacy format with messages array
    const { messages } = body as {
      messages: any[];
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Convert messages to Claude format
    const claudeMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const models = ['claude-3-5-haiku-latest', 'claude-3-haiku-20240307'];
    let content = '';
    let lastError: any = null;

    for (const model of models) {
      try {
        const msg = await anthropic.messages.create({
          model,
          max_tokens: 1024,
          messages: claudeMessages,
        });

        const block = msg.content.find((b) => b.type === 'text');
        const text = block && 'text' in block ? block.text.trim() : '';
        if (text) {
          content = text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Chat model ${model} failed:`, err.message);
        if (err.status !== 500) throw err;
      }
    }

    if (!content) {
      throw lastError || new Error('Claude chat failed');
    }

    return NextResponse.json({ response: content });
  } catch (error: any) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
};