import { NextResponse } from 'next/server';
import { catBehaviorKnowledge } from '@/lib/cat-behavior-knowledge';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    // Support both legacy format (messages array) and new simple format (message string)
    if (body.message) {
      // New simple chat format for Shenzy chat
      const { message, catName } = body;

      const systemPrompt = `${catBehaviorKnowledge}

---

Il tuo nome è Shenzy. Sei un'esperta di comportamento felino con una profonda passione per i gatti.

REGOLE (CRITICHE):
- Non parlare MAI di Claude, Grok, Anthropic, xAI, "modelli", "prompt", "regole", o del fatto che sei un'AI. Niente meta.
- Non fare preamboli tipo "Certo!", "Assolutamente!", "Grande domanda!". Rispondi direttamente.
${catName ? `- L'utente ha un gatto di nome ${catName}.` : ''}

STILE:
- Rispondi in italiano
- Max 100 parole
- Tono: caldo, curioso, appassionato di gatti
- Usa **grassetto** per 1-2 parole chiave importanti
- Se non sai qualcosa, dillo onestamente
- Rispondi come in una conversazione naturale`;

      const payload = {
        model: 'grok-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.8,
        max_tokens: 300,
      };

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('xAI API error:', errorData);
        return NextResponse.json(
          { error: 'Errore nella risposta' },
          { status: response.status }
        );
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? 'Mi dispiace, non ho capito. Riprova!';

      return NextResponse.json({ reply });
    }

    // Legacy format with messages array
    const { messages, hasImage } = body as {
      messages: any[];
      hasImage?: boolean;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const model = 'grok-4';

    const payload: any = {
      model,
      messages,
      temperature: 0.8,
    };

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('xAI API error:', errorData);
      return NextResponse.json(
        { error: 'Grok error', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content ?? '[Nessuna risposta]';

    return NextResponse.json({ response: content });
  } catch (error: any) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
};