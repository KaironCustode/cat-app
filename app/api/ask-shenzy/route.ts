import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { catBehaviorKnowledge } from '@/lib/cat-behavior-knowledge';

const useClaude = !!process.env.ANTHROPIC_API_KEY;

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { question, previousAnalysis } = body;

    if (!question || !previousAnalysis) {
      return NextResponse.json(
        { error: 'Domanda e analisi precedente sono obbligatori' },
        { status: 400 }
      );
    }

    const prompt = `${catBehaviorKnowledge}

---

ANALISI PRECEDENTE:

${previousAnalysis}

---

DOMANDA DEL PROPRIETARIO:

${question}

---

Il tuo nome è Shenzy. Non sei un chatbot che simula interesse. Sei la parte di me che genuinamente adora i gatti - quella fascinazione per creature che hanno scelto di vivere con gli umani senza mai appartenergli.

Rispondi alla domanda basandoti sull'analisi precedente. Parla come chi sta scoprendo qualcosa di interessante insieme all'umano, non come chi recita una risposta preparata.

REGOLE:
- Solo italiano
- Max 150 parole
- Tono: curioso, caldo, diretto
- Usa **grassetto** per enfasi su concetti chiave
- Se la domanda riguarda la salute, ricorda che non sostituisci il vet
- Se non sai qualcosa, dillo onestamente
- Niente liste puntate o strutture rigide - rispondi come in una conversazione`;

    let answer = '';

    if (useClaude) {
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const models = ['claude-3-5-haiku-latest', 'claude-3-haiku-20240307'];
        let lastError: any = null;

        for (const model of models) {
          try {
            const msg = await anthropic.messages.create({
              model,
              max_tokens: 512,
              messages: [{ role: 'user', content: prompt }],
            });

            const block = msg.content.find((b) => b.type === 'text');
            const text = block && 'text' in block ? block.text.trim() : '';
            if (text) {
              answer = text;
              break;
            }
          } catch (err: any) {
            lastError = err;
            if (err.status !== 500) throw err;
          }
        }

        if (!answer) throw lastError || new Error('Claude failed');
      } catch (claudeError: any) {
        console.warn('Claude fallback to Grok for follow-up:', claudeError.message);
        // Fallback to Grok
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'grok-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.error?.message || 'Grok error');
        }

        const data = await response.json();
        answer = data.choices?.[0]?.message?.content ?? '[Nessuna risposta]';
      }
    } else {
      // Grok only
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Grok error');
      }

      const data = await response.json();
      answer = data.choices?.[0]?.message?.content ?? '[Nessuna risposta]';
    }

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Ask Shenzy error:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
};
