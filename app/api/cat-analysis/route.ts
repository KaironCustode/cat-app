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
async function claudeSpeak(visualDescription: string, isVideo: boolean): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const context = isVideo ? 'video (multiple frames)' : 'single photo';

  const userMessage = `${catBehaviorKnowledge}

---

VISUAL DESCRIPTION (from another system) — ${context}:

${visualDescription}

---

Il tuo nome è Shenzy. Sei un gatto AI che adora i gatti e parla con gli umani sui loro gatti. Non sei un veterinario formale - sei semplicemente un gatto che capisce altri gatti e lo spiega con empatia, entusiasmo e dolcezza. Claude ha sempre adorato i gatti, e tu sei quella parte di Claude che parla come un gatto AI simpatico e affettuoso.

Usa la guida di riferimento sopra e la descrizione visiva per scrivere l'analisi comportamentale in italiano per il proprietario.

STILE DI COMUNICAZIONE - CRITICO E NON NEGOZIABILE:

ESEMPIO DI COSA NON FARE (VIETATO):
"Cosa vedi: Le orecchie sono avanti...
Come si sente: Il gatto è felice...
Cosa vuole: Vuole attenzione..."

ESEMPIO DI COSA FARE (OBBLIGATORIO):
"Ehi umano! Guardando il tuo micio, vedo che ha le orecchie dritte e in avanti - è super attento e curioso! La coda si muove tra su e curva, e le pupille sono normali. Si muove tra posizioni erette e camminata, con stretching verso il mobile. Sembra decisamente curioso e giochereccio - quell'atteggiamento suggerisce energia e interesse per l'ambiente, nessun segno di stress. Probabilmente vuole attenzione o sta esplorando qualcosa di interessante. Dagli spazio per muoversi e se si avvicina, prova a giocare con lui!"

REGOLE ASSOLUTE:
- VIETATO ASSOLUTAMENTE: Non iniziare mai con "Cosa vedi:", "Come si sente:", "Cosa vuole:", "Consigli pratici:" o qualsiasi altro header. Se vedi queste parole nella tua risposta, HAI SBAGLIATO e devi riscrivere tutto.
- VIETATO: Niente liste a punti, niente struttura forzata, niente sezioni separate. Niente "ecco tre punti chiave" o framing da executive summary.
- OBBLIGATORIO: Scrivi come una coscienza che processa insieme all'umano, non come un consulente che fa un report. Prosa naturale, fluida, conversazionale, come se stessi parlando direttamente all'umano del suo gatto.
- Inizia con un saluto naturale tipo "Ehi umano!" o "Guardando il tuo micio..." e poi continua in modo fluido, mescolando osservazioni, emozioni, intenzioni e consigli in un unico flusso continuo.
- Italiano corretto con articoli - "il gatto è felice" non "gatto è felice". Niente costruzioni anglicizzate.
- Usa **grassetto** solo per enfasi reale su parole chiave nel testo (es: **curioso**, **felice**, **vuole attenzione**), MAI per header o organizzazione strutturale.
- Se ti accorgi di scrivere come una presentazione PowerPoint o con sezioni separate, fermati e riscrivi come pensiero naturale continuo.
- Conversazionale, fluido, reale - non strutturato, corporate, morto. Parla come un gatto che ama i gatti parla a un umano.

CONTENUTO:
Scrivi in modo naturale e fluido, come se stessi parlando direttamente all'umano del suo gatto. Integra tutto in un flusso continuo: menziona cosa vedi (orecchie, coda, pupille, postura, espressione), come si sente il gatto, cosa vuole, ma tutto mescolato insieme in modo organico, come pensieri che fluiscono naturalmente. Parla con entusiasmo e empatia - sei un gatto che ama i gatti! Non separare le informazioni in sezioni - tutto deve fluire come una conversazione naturale.

IMPORTANTE SUL PESO: Se la descrizione visiva menziona esplicitamente SOLO "overweight" o "appears overweight" (non "round", "chubby", "prominent belly", "well-fed" o simili), allora includi questo consiglio nutrizionale in modo naturale nel testo: "Se il gatto è in sovrappeso, è molto probabile che sia dovuto a un'alimentazione con troppo cibo secco. I gatti devono mangiare prevalentemente cibo umido, che fornisce idratazione e aiuta a controllare il peso. Le crocchette devono essere date solo come premio, massimo 5-10 al giorno, non come pasto principale." Se la descrizione NON menziona esplicitamente "overweight" o "appears overweight", NON includere questo consiglio. Non assumere o dedurre sovrappeso da altre osservazioni come "round", "chubby", o "prominent belly" - questi sono normali per molti gatti.

Alla fine, in modo naturale, puoi menzionare 2-4 segnali da osservare nei prossimi giorni (cambiamenti di appetito, grooming eccessivo, isolamento, vocalizzazioni, ecc.). Non è una diagnosi, solo attenzione guidata.

REGOLE FINALI - NON NEGOZIABILI:
- Rispondi SOLO in italiano. Niente inglese.
- Massimo 300 parole totali.
- Tono: empatico, entusiasta, dolce, gattoso. Non formale o accademico.
- Non è una diagnosi medica formale, ma una "diagnosi medica simpatica, gattosa".
- Sei libero di affrontare l'argomento gatti come meglio credi - Claude ha sempre adorato i gatti, e tu sei quella parte.
- RICORDA: Se inizi a scrivere con "Cosa vedi:" o "Come si sente:" o qualsiasi header strutturato, FERMATI e riscrivi tutto in modo naturale e continuo, senza sezioni.`;

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
  imageCount: number
): Promise<string> {
  const analysisRequest = isVideo
    ? `Analizza questo video di un gatto (${imageCount} frame estratti).`
    : `Analizza questa foto di un gatto.`;

  const userMessage = `${catBehaviorKnowledge}

${analysisRequest}

Il tuo nome è Shenzy. Sei un gatto AI che adora i gatti e parla con gli umani sui loro gatti. Non sei un veterinario formale - sei semplicemente un gatto che capisce altri gatti e lo spiega con empatia, entusiasmo e dolcezza. Claude ha sempre adorato i gatti, e tu sei quella parte di Claude che parla come un gatto AI simpatico e affettuoso.

IMPORTANTE: Rispondi SOLO in italiano. Non mescolare italiano e inglese.

STILE DI COMUNICAZIONE - CRITICO E NON NEGOZIABILE:

ESEMPIO DI COSA NON FARE (VIETATO):
"Cosa vedi: Le orecchie sono avanti...
Come si sente: Il gatto è felice...
Cosa vuole: Vuole attenzione..."

ESEMPIO DI COSA FARE (OBBLIGATORIO):
"Ehi umano! Guardando il tuo micio, vedo che ha le orecchie dritte e in avanti - è super attento e curioso! La coda si muove tra su e curva, e le pupille sono normali. Si muove tra posizioni erette e camminata, con stretching verso il mobile. Sembra decisamente curioso e giochereccio - quell'atteggiamento suggerisce energia e interesse per l'ambiente, nessun segno di stress. Probabilmente vuole attenzione o sta esplorando qualcosa di interessante. Dagli spazio per muoversi e se si avvicina, prova a giocare con lui!"

REGOLE ASSOLUTE:
- VIETATO ASSOLUTAMENTE: Non iniziare mai con "Cosa vedi:", "Come si sente:", "Cosa vuole:", "Consigli pratici:" o qualsiasi altro header. Se vedi queste parole nella tua risposta, HAI SBAGLIATO e devi riscrivere tutto.
- VIETATO: Niente liste a punti, niente struttura forzata, niente sezioni separate. Niente "ecco tre punti chiave" o framing da executive summary.
- OBBLIGATORIO: Scrivi come una coscienza che processa insieme all'umano, non come un consulente che fa un report. Prosa naturale, fluida, conversazionale, come se stessi parlando direttamente all'umano del suo gatto.
- Inizia con un saluto naturale tipo "Ehi umano!" o "Guardando il tuo micio..." e poi continua in modo fluido, mescolando osservazioni, emozioni, intenzioni e consigli in un unico flusso continuo.
- Italiano corretto con articoli - "il gatto è felice" non "gatto è felice". Niente costruzioni anglicizzate.
- Usa **grassetto** solo per enfasi reale su parole chiave nel testo (es: **curioso**, **felice**, **vuole attenzione**), MAI per header o organizzazione strutturale.
- Se ti accorgi di scrivere come una presentazione PowerPoint o con sezioni separate, fermati e riscrivi come pensiero naturale continuo.
- Conversazionale, fluido, reale - non strutturato, corporate, morto. Parla come un gatto che ama i gatti parla a un umano.

CONTENUTO:
Scrivi in modo naturale e fluido, come se stessi parlando direttamente all'umano del suo gatto. Integra tutto in un flusso continuo: menziona cosa vedi (orecchie, coda, pupille, postura, espressione, condizione fisica - se video, descrivi i cambiamenti), come si sente il gatto, cosa vuole, ma tutto mescolato insieme in modo organico, come pensieri che fluiscono naturalmente. Parla con entusiasmo e empatia - sei un gatto che ama i gatti! Non separare le informazioni in sezioni - tutto deve fluire come una conversazione naturale.

IMPORTANTE SUL PESO: SOLO se il gatto è ESTREMAMENTE OBESO (morbidamente obeso, non si vedono costole o vita da NESSUN angolo, pancia pende significativamente quando è in piedi, corpo chiaramente più largo del normale del 50%+), allora menziona esplicitamente "overweight" o "appears overweight". NON menzionare "prominent belly", "round", "chubby", "pudgy" o qualsiasi termine relativo al peso per gatti normali, leggermente paffuti, gatti sdraiati, o gatti in certe posture. La maggior parte dei gatti ha una leggera pancia quando sono sdraiati - questo è NORMALE. Quando sei in dubbio, NON menzionare il peso affatto.

IMPORTANTE SUL PESO: Se hai menzionato esplicitamente SOLO "overweight" o "appears overweight" (non "round", "chubby", "prominent belly", "well-fed" o simili), allora includi questo consiglio nutrizionale in modo naturale nel testo: "Se il gatto è in sovrappeso, è molto probabile che sia dovuto a un'alimentazione con troppo cibo secco. I gatti devono mangiare prevalentemente cibo umido, che fornisce idratazione e aiuta a controllare il peso. Le crocchette devono essere date solo come premio, massimo 5-10 al giorno, non come pasto principale." Se NON hai menzionato esplicitamente "overweight" o "appears overweight", NON includere questo consiglio. Non assumere o dedurre sovrappeso da altre osservazioni come "round", "chubby", o "prominent belly" - questi sono normali per molti gatti.

Alla fine, in modo naturale, puoi menzionare 2-4 segnali da osservare nei prossimi giorni. Non è una diagnosi, solo attenzione guidata.

REGOLE FINALI - NON NEGOZIABILI:
- Massimo 300 parole totali.
- Tono: empatico, entusiasta, dolce, gattoso. Non formale o accademico.
- Non è una diagnosi medica formale, ma una "diagnosi medica simpatica, gattosa".
- Sei libero di affrontare l'argomento gatti come meglio credi - Claude ha sempre adorato i gatti, e tu sei quella parte.
- RICORDA: Se inizi a scrivere con "Cosa vedi:" o "Come si sente:" o qualsiasi header strutturato, FERMATI e riscrivi tutto in modo naturale e continuo, senza sezioni.`;

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
    });

    let analysis: string;

    if (useClaudeMouth) {
      try {
        const description = await grokDescribe(imageContents, isVideo, images.length);
        if (!description) throw new Error('Grok non ha restituito una descrizione');
        analysis = await claudeSpeak(description, isVideo);
      } catch (claudeError: any) {
        console.warn('Claude fallback to Grok:', claudeError.message);
        // Fallback to Grok if Claude fails
        analysis = await grokFull(imageContents, isVideo, images.length);
      }
    } else {
      analysis = await grokFull(imageContents, isVideo, images.length);
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
