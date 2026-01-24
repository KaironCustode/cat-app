import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { catBehaviorKnowledge } from '@/lib/cat-behavior-knowledge';

/** Step 1: Claude Haiku vision — raw description, no personality */
async function claudeDescribe(
  imageContents: { type: 'image_url'; image_url: { url: string } }[],
  isVideo: boolean,
  imageCount: number
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const context = isVideo
    ? `These are ${imageCount} frames from a short cat video.`
    : `This is a single photo of a cat.`;

  const visionPrompt = `${context}

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
- Location/context: IMPORTANT - describe WHERE the cat is. If the cat is IN or ON a litter box, explicitly state "cat is in litter box" - this likely means the cat is using it for its intended purpose (urinating or defecating), NOT resting or sleeping. Do not romanticize a cat in a litter box as "relaxing" or "finding a safe spot."
- Body condition: CRITICAL - ONLY mention "overweight" or "appears overweight" if the cat is EXTREMELY OBESE (morbidly obese, cannot see ribs or waist from ANY angle, belly hangs down significantly when standing, body is clearly wider than normal by 50%+). DO NOT mention "prominent belly", "round", "chubby", "pudgy", or any weight-related terms for normal cats, slightly chubby cats, cats lying down, cats in certain postures, or cats that just look well-fed. Most cats have a slight belly when lying down - this is NORMAL. Only report overweight if it's unmistakable, severe obesity that would be obvious to any veterinarian. When in doubt, DO NOT mention weight at all.
- If multiple frames: note any changes over time.

No interpretation, no advice, no personality. Output raw observations only.`;

  // Convert data URLs to Claude's image format
  const imageBlocks: Anthropic.ImageBlockParam[] = imageContents.map((img) => {
    // Extract base64 data and media type from data URL
    const dataUrl = img.image_url.url;
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid image data URL format');
    }
    const mediaType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const base64Data = matches[2];

    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: mediaType,
        data: base64Data,
      },
    };
  });

  // Build content array with text prompt and images
  const content: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
    { type: 'text', text: visionPrompt },
    ...imageBlocks,
  ];

  // Try Haiku models
  const models = ['claude-3-5-haiku-latest', 'claude-3-haiku-20240307'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const msg = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content }],
      });

      const block = msg.content.find((b) => b.type === 'text');
      const text = block && 'text' in block ? block.text.trim() : '';
      if (text) return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`Claude vision model ${model} failed:`, err.message);
      if (err.status !== 500) throw err;
    }
  }

  throw lastError || new Error('Claude vision failed');
}

/** Step 2: Claude writes Shenzy-style Italian analysis from the visual description */
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

VISUAL DESCRIPTION — ${context}:

${visualDescription}
${catNameText}${homeContextText}

---

Il tuo nome è Shenzy.

REGOLE (CRITICHE):
- Non parlare MAI di Claude, Grok, Anthropic, xAI, "modelli", "prompt", "regole", o del fatto che sei un'AI. Niente meta-discorsi.
- Vietato iniziare con "Ho capito perfettamente", "Certo!", "Sono pronta…", o presentazioni su chi sei.
- Parti subito dal gatto che hai davanti: usa SEMPRE dettagli concreti dalla descrizione visiva.

CASO SPECIALE — CONTENUTO NON REALE:
Se la descrizione visiva inizia con "NOT A REAL CAT:", allora:
- Dillo chiaramente in italiano (che non è un gatto reale e cosa sembra essere).
- Chiedi di caricare una foto/video reale di un gatto.
- Non inventare nessuna analisi comportamentale.

STILE:
- Italiano naturale, caldo, "gattoso", ma senza teatralità finta.
- Niente liste puntate, niente sezioni, niente titoli tipo "Cosa vedi/come si sente/cosa vuole".
- Usa **grassetto** solo per 1–3 parole davvero importanti, mai per organizzare il testo.
- Massimo 250–300 parole.

CONTENUTO:
- Mescola osservazioni (orecchie, coda, pupille, postura, espressione) e significato in un unico flusso conversazionale.
- Se hai il contesto casa, usalo con delicatezza (senza forzare).
- SUL PESO: solo se la descrizione dice esplicitamente "overweight" o "appears overweight", menziona (in modo naturale) il consiglio: prevalenza umido, crocchette solo come premio (5–10 al giorno). Altrimenti NON parlarne.
- LETTIERA: se la descrizione dice che il gatto è nella lettiera, è OVVIO che sta facendo i suoi bisogni (pipì o cacca). Non romanticizzare dicendo che "sta riposando" o "ha scelto un rifugio sicuro". Dì semplicemente che sta usando la lettiera, è normale, e passa oltre. Non serve analizzare poeticamente un gatto che fa la cacca!

CHIUSURA:
Chiudi con UNA sola azione concreta e immediata, in una frase semplice (senza header), tipo: "Se vuoi fare una cosa adesso: ...".`;

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

    console.log('🐱 Analisi gatto (100% Claude):', {
      pipeline: 'claude-vision + claude-speak',
      imageCount: images.length,
      isVideo,
      catName: catName || 'unnamed',
      hasHomeContext: !!homeContext,
    });

    // Step 1: Claude Haiku analyzes the images
    const description = await claudeDescribe(imageContents, isVideo, images.length);
    if (!description) {
      throw new Error('Claude non ha restituito una descrizione');
    }

    // Step 2: Claude Haiku writes the warm Italian analysis
    const analysis = await claudeSpeak(description, isVideo, catName || undefined, homeContext);

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
