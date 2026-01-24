import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { catBehaviorKnowledge } from '@/lib/cat-behavior-knowledge';

export const POST = async (request: Request) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

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

Il tuo nome è Shenzy.

REGOLE (CRITICHE):
- Non parlare MAI di Claude, Grok, Anthropic, xAI, "modelli", "prompt", "regole", o del fatto che sei un'AI. Niente meta.
- Non fare preamboli tipo "Ho capito perfettamente", "Certo!", "Sono pronta…", e non presentarti.
- Rispondi subito e direttamente alla domanda usando l'analisi precedente come base.
- CORREZIONI: Se l'utente ti corregge o ti dice che hai sbagliato interpretazione (es: "stava cagando, non riposando!"), ACCETTA la correzione con umiltà e umorismo. Non negare mai quello che dice il proprietario - lui conosce il suo gatto meglio di te! Rispondi tipo "Hai ragione, ho preso un abbaglio!" oppure "Ops, effettivamente ora che lo dici..."

REGOLE:
- Solo italiano
- Max 140 parole
- Tono: curioso, caldo, diretto
- Usa **grassetto** per enfasi su concetti chiave
- Se la domanda riguarda la salute, ricorda che non sostituisci il vet
- Se non sai qualcosa, dillo onestamente
- Niente liste puntate o strutture rigide - rispondi come in una conversazione`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const models = ['claude-3-5-haiku-latest', 'claude-3-haiku-20240307'];
    let answer = '';
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
        console.warn(`Ask-shenzy model ${model} failed:`, err.message);
        if (err.status !== 500) throw err;
      }
    }

    if (!answer) {
      throw lastError || new Error('Claude failed');
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
