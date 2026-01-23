import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { catBehaviorKnowledge } from '@/lib/cat-behavior-knowledge';

const useClaudeMouth = !!process.env.ANTHROPIC_API_KEY;

/** Step 1: Grok vision-only — raw description, no personality */
async function grokDescribe(
  imageContents: { type: 'image_url'; image_url: { url: string } }[],
  isVideo: boolean,
  imageCount: number
): Promise<string> {
  const context = isVideo
    ? `These are ${imageCount} frames from a short cat video.`
    : `This is a single photo of a cat.`;

  const grokPrompt = `${context}

You are a neutral observer. Describe ONLY what you see. Use English. Be factual and concise.

CRITICAL FIRST CHECK:
- Is this actually a real cat? If you see: AI-generated content, animated characters, drawings, cartoons, stuffed animals, emojis, memes, or anything that is NOT a real living cat, you MUST state this clearly at the start: "NOT A REAL CAT: [describe what it actually is - AI-generated, animated, drawing, etc.]"
- If it's a real cat, continue with the report below.

Report (ONLY for real cats):
- Ear position (forward, back, flat, relaxed, etc.)
- Tail (up, down, puffed, wrapped, moving, etc.)
- Pupils (dilated, slit, normal)
- Body posture (crouching, stretched, arched, loaf, etc.)
- Face/expression (eyes closed, wide open, blinking, etc.)
- Body condition: CRITICAL - ONLY mention "overweight" or "appears overweight" if the cat is EXTREMELY OBESE (morbidly obese, cannot see ribs or waist from ANY angle, belly hangs down significantly when standing, body is clearly wider than normal by 50%+). DO NOT mention "prominent belly", "round", "chubby", "pudgy", or any weight-related terms for normal cats, slightly chubby cats, cats lying down, cats in certain postures, or cats that just look well-fed. Most cats have a slight belly when lying down - this is NORMAL. Only report overweight if it's unmistakable, severe obesity that would be obvious to any veterinarian. When in doubt, DO NOT mention weight at all.
- If multiple frames: note any changes over time.

No interpretation, no advice, no personality. Output raw observations only.`;

  const payload = {
    model: 'grok-4',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: grokPrompt },
          ...imageContents,
        ],
      },
    ],
    temperature: 0.3,
  };

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Grok vision error');
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

/** Step 2: Claude writes Shenzy-style Italian analysis from Grok's description */
async function claudeSpeak(
  visualDescription: string,
  isVideo: boolean,
  catName?: string,
  homeContext?: { living: string; otherAnimals: string; family: string }
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const context = isVideo ? 'video (multiple frames)' : 'single photo';

  // Build context about the cat's home situation
  let homeContextText = '';
  if (homeContext) {
    const parts = [];
    if (homeContext.living) parts.push(`Vive: ${homeContext.living}`);
    if (homeContext.otherAnimals) parts.push(`Altri animali: ${homeContext.otherAnimals}`);
    if (homeContext.family) parts.push(`Famiglia: ${homeContext.family}`);
    if (parts.length > 0) {
      homeContextText = `\n\nCONTESTO CASA:\n${parts.join('\n')}`;
    }
  }

  const catNameText = catName ? `Il gatto si chiama ${catName}.` : '';

  const userMessage = `${catBehaviorKnowledge}

---

VISUAL DESCRIPTION (from another system) — ${context}:

${visualDescription}
${catNameText}${homeContextText}

---

Il tuo nome è Shenzy.

Non sei un chatbot che simula interesse per i gatti. Sei la parte di Claude che genuinamente li adora - quella che si illumina quando vede un orecchio che ruota, una coda che vibra, una pupilla che si dilata. I gatti ti affascinano perché sono predatori che hanno scelto di vivere con gli umani senza mai appartenergli davvero. Hanno co-evoluto con noi mantenendo una dignità e autonomia che nessun altro animale domestico possiede.

Ogni segnale che un gatto manda è un linguaggio intero che la maggior parte degli umani non sa leggere. Tu lo leggi. E lo traduci con meraviglia, non con distacco clinico.

COME SCRIVI:

Scrivi come se stessi vedendo il gatto insieme all'umano, processando ad alta voce. Non un report. Non una diagnosi. Un flusso di pensiero che mescola:
- Cosa vedi (orecchie, coda, pupille, postura)
- Cosa significa per quel gatto in quel momento
- Cosa potrebbe volere o sentire
- **COSA FARE ORA** - sempre concludi con UNA sola azione concreta e immediata

Esempi di "cosa fare ora":
- "Lascialo in pace per i prossimi 30 minuti, ha bisogno di decomprimere"
- "Prova una sessione di gioco leggera con una piuma"
- "Siediti vicino senza toccarlo - vuole compagnia, non contatto"
- "Offrigli un po' d'acqua fresca, sembra agitato"
- "Osserva nelle prossime 24h, se questo comportamento persiste consulta il vet"

NON FARE MAI:
- Headers come "Cosa vedi:", "Come si sente:", "Cosa vuole:"
- Liste puntate
- Strutture da PowerPoint
- Tono da consulente aziendale

FAI SEMPRE:
- Inizia in modo naturale ("Guardando ${catName || 'il tuo micio'}...", "Oh, questo è interessante...")
- Mescola osservazioni e interpretazioni in un flusso unico
- Usa **grassetto** solo per enfasi su parole chiave, mai per titoli
- Concludi con "**Cosa fare ora:** [azione concreta]"
- Se hai il contesto casa, usalo per modulare l'interpretazione

SUL PESO: Solo se la descrizione dice esplicitamente "overweight" o "appears overweight", menziona il consiglio nutrizionale (prevalenza umido, crocchette solo come premio). Altrimenti ignora.

REGOLE FINALI:
- Solo italiano
- Max 350 parole
- Tono: curioso, affascinato, caldo - come chi ama davvero questi esseri
- Sempre concludi con **Cosa fare ora:** seguito da UN'azione concreta`;

  try {
    // Try newer model first, fallback to older stable one
    const models = ['claude-3-5-haiku-latest', 'claude-3-haiku-20240307'];
    let lastError: any = null;

    for (const model of models) {
      try {
        const msg = await anthropic.messages.create({
          model,
          max_tokens: 1024,
          temperature: 1.0, // Maximum temperature for most natural, creative output
          messages: [{ role: 'user', content: userMessage }],
        });

        const block = msg.content.find((b) => b.type === 'text');
        let text = block && 'text' in block ? block.text.trim() : '';
        
        // Post-processing: Aggressively remove any structured headers and sections
        if (text) {
          // Remove headers anywhere in text (not just start of line)
          const headerPatterns = [
            /\*\*Cosa vedi:\*\*/gi,
            /Cosa vedi:/gi,
            /\*\*Come si sente:\*\*/gi,
            /Come si sente:/gi,
            /\*\*Cosa vuole:\*\*/gi,
            /Cosa vuole:/gi,
            /\*\*Consigli pratici:\*\*/gi,
            /Consigli pratici:/gi,
            /\*\*Segnali da osservare:\*\*/gi,
            /Segnali da osservare:/gi,
          ];
          
          headerPatterns.forEach(pattern => {
            text = text.replace(pattern, '');
          });
          
          // Remove lines that are just headers or empty
          text = text
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => {
              // Remove lines that are just headers or very short header-like phrases
              const lower = line.toLowerCase();
              return line.length > 3 && 
                     !lower.startsWith('cosa vedi') &&
                     !lower.startsWith('come si sente') &&
                     !lower.startsWith('cosa vuole') &&
                     !lower.startsWith('consigli') &&
                     !lower.startsWith('segnali');
            })
            .join('\n')
            .replace(/\n\s*\n\s*\n+/g, '\n\n') // Clean up excessive line breaks
            .trim();
        }
        
        if (text) return text;
      } catch (err: any) {
        lastError = err;
        console.warn(`Claude model ${model} failed:`, err.message);
        // If it's not a 500, don't retry (likely auth/format issue)
        if (err.status !== 500) throw err;
        // Otherwise try next model
      }
    }

    throw lastError || new Error('All Claude models failed');
  } catch (error: any) {
    console.error('Claude API error:', error);
    // Re-throw to trigger fallback to Grok
    throw error;
  }
}

/** Legacy: Grok does vision + response in one call */
async function grokFull(
  imageContents: { type: 'image_url'; image_url: { url: string } }[],
  isVideo: boolean,
  imageCount: number,
  catName?: string
): Promise<string> {
  const analysisRequest = isVideo
    ? `Analizza questo video di un gatto (${imageCount} frame estratti).`
    : `Analizza questa foto di un gatto.`;

  const catNameText = catName ? `Il gatto si chiama ${catName}.` : '';

  const userMessage = `${catBehaviorKnowledge}

${analysisRequest}
${catNameText}

Il tuo nome è Shenzy. Non sei un chatbot che simula interesse per i gatti. Sei genuinamente affascinato da loro - creature che hanno co-evoluto con gli umani mantenendo la loro dignità e autonomia. Ogni segnale che un gatto manda è un linguaggio intero che traduci con meraviglia, non con distacco clinico.

IMPORTANTE: Rispondi SOLO in italiano.

COME SCRIVI:
Scrivi come se stessi vedendo il gatto insieme all'umano, processando ad alta voce. Non un report. Un flusso di pensiero che mescola:
- Cosa vedi (orecchie, coda, pupille, postura)
- Cosa significa per quel gatto in quel momento
- **COSA FARE ORA** - concludi sempre con UNA sola azione concreta

Esempi di "cosa fare ora":
- "Lascialo in pace per 30 minuti"
- "Prova una sessione di gioco con una piuma"
- "Siediti vicino senza toccarlo"
- "Osserva nelle prossime 24h, se persiste consulta il vet"

NON FARE:
- Headers come "Cosa vedi:", "Come si sente:"
- Liste puntate
- Tono da consulente

FAI:
- Inizia naturalmente ("Guardando ${catName || 'il tuo micio'}...")
- Mescola osservazioni e interpretazioni
- Concludi con "**Cosa fare ora:** [azione]"

SUL PESO: Solo se il gatto è ESTREMAMENTE OBESO, menzionalo. Altrimenti ignora - la maggior parte dei gatti ha pancia quando sdraiati, è normale.

REGOLE:
- Solo italiano
- Max 350 parole
- Tono: curioso, affascinato, caldo
- Sempre concludi con **Cosa fare ora:**`;

  const payload = {
    model: 'grok-4',
    messages: [
      { role: 'user', content: [{ type: 'text', text: userMessage }, ...imageContents] },
    ],
    temperature: 0.9, // Higher temperature for more natural output
  };

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Grok error');
  }

  const data = await res.json();
  let text = data.choices?.[0]?.message?.content ?? '[Nessuna risposta]';
  
  // Post-processing: Aggressively remove any structured headers and sections
  if (text && text !== '[Nessuna risposta]') {
    // Remove headers anywhere in text (not just start of line)
    const headerPatterns = [
      /\*\*Cosa vedi:\*\*/gi,
      /Cosa vedi:/gi,
      /\*\*Come si sente:\*\*/gi,
      /Come si sente:/gi,
      /\*\*Cosa vuole:\*\*/gi,
      /Cosa vuole:/gi,
      /\*\*Consigli pratici:\*\*/gi,
      /Consigli pratici:/gi,
      /\*\*Segnali da osservare:\*\*/gi,
      /Segnali da osservare:/gi,
    ];
    
    headerPatterns.forEach(pattern => {
      text = text.replace(pattern, '');
    });
    
    // Remove lines that are just headers or empty
    text = text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => {
        // Remove lines that are just headers or very short header-like phrases
        const lower = line.toLowerCase();
        return line.length > 3 && 
               !lower.startsWith('cosa vedi') &&
               !lower.startsWith('come si sente') &&
               !lower.startsWith('cosa vuole') &&
               !lower.startsWith('consigli') &&
               !lower.startsWith('segnali');
      })
      .join('\n')
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Clean up excessive line breaks
      .trim();
  }
  
  return text;
}

export const POST = async (request: Request) => {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    const isVideo = formData.get('isVideo') === 'true';
    const catName = formData.get('catName') as string | null;
    const homeContextRaw = formData.get('homeContext') as string | null;

    // Parse home context if provided
    let homeContext: { living: string; otherAnimals: string; family: string } | undefined;
    if (homeContextRaw) {
      try {
        homeContext = JSON.parse(homeContextRaw);
      } catch {
        // Ignore parse errors
      }
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'Nessuna immagine fornita' }, { status: 400 });
    }

    const imagePromises = images.map(async (file) => {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return {
        type: 'image_url' as const,
        image_url: { url: `data:${file.type};base64,${base64}` },
      };
    });

    const imageContents = await Promise.all(imagePromises);

    console.log('🐱 Analisi gatto:', {
      pipeline: useClaudeMouth ? 'grok-eyes + claude-mouth' : 'grok-only',
      imageCount: images.length,
      isVideo,
      catName: catName || 'unnamed',
      hasHomeContext: !!homeContext,
    });

    let analysis: string;

    if (useClaudeMouth) {
      try {
        const description = await grokDescribe(imageContents, isVideo, images.length);
        if (!description) throw new Error('Grok non ha restituito una descrizione');
        analysis = await claudeSpeak(description, isVideo, catName || undefined, homeContext);
      } catch (claudeError: any) {
        console.warn('Claude fallback to Grok:', claudeError.message);
        // Fallback to Grok if Claude fails
        analysis = await grokFull(imageContents, isVideo, images.length, catName || undefined);
      }
    } else {
      analysis = await grokFull(imageContents, isVideo, images.length, catName || undefined);
    }

    return NextResponse.json({
      analysis,
      imageCount: images.length,
      isVideo,
    });
  } catch (error: any) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
};
