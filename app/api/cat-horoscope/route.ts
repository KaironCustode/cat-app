import { NextResponse } from 'next/server';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { guardianName, catName, birthMonth, birthYear, furColor, personality } = body;

    if (!guardianName || !catName || !birthMonth || !furColor) {
      return NextResponse.json(
        { error: 'Nome guardiano, nome gatto, mese di nascita e colore del pelo sono obbligatori' },
        { status: 400 }
      );
    }

    // Costruisci il prompt per l'oroscopo
    const horoscopePrompt = `Il tuo nome è Shenzy. Sei un oracolo felino esperto nell'antica arte dell'astrologia felina, che interpreta le influenze degli astri e delle stelle sul destino dei gatti.

Rivolgiti al guardiano del gatto: ${guardianName}

Informazioni sul gatto:
- Nome del gatto: ${catName}
- Nato in: ${birthMonth}${birthYear ? ` ${birthYear}` : ''}
- Colore del pelo: ${furColor}
${personality ? `- Personalità: ${personality}` : ''}

IMPORTANTE:
- Rispondi SOLO in italiano
- Rivolgiti direttamente a ${guardianName} (il guardiano del gatto), usando "tu" e il suo nome
- L'oroscopo è per ${guardianName}, che riceverà consigli su come prendersi cura del suo gatto ${catName} in base alle influenze astrali
- Tono serio ma accessibile, come un vero oroscopo tradizionale (non ironico o sarcastico)
- Tratta l'oroscopo con rispetto per la tradizione astrologica felina, anche se non è scienza ufficiale
- Usa **grassetto** per evidenziare concetti importanti
- Struttura: breve introduzione astrologica rivolta a ${guardianName}, previsioni per il mese per ${catName} (relazioni con umani/altri gatti, benessere, fortuna, attività/giochi), consigli pratici per ${guardianName} su come prendersi cura di ${catName}
- Massimo 400 parole
- Includi riferimenti a comportamenti felini tipici (cibo, sonno, giochi, territorio) collegati alle influenze astrali
- Puoi parlare di stelle, costellazioni, astri, stelle vagabonde e loro influenze dal punto di vista astrologico/tradizionale
- VIETATO: non fare riferimenti a buchi neri, galassie, viaggi spaziali, esplorazioni spaziali, missili spaziali, astrofisica scientifica, cosmologia moderna
- VIETATO: non usare MAI la parola "pianeta" o "pianeti" - usa invece "astri", "stelle vagabonde", "corpi celesti" o simili
- Puoi usare termini come "firmamento", "stelle", "costellazioni", "astri", "stelle vagabonde" in senso astrologico tradizionale, non scientifico
- Mantieni un tono credibile e rispettoso della tradizione, senza essere troppo serio o troppo scherzoso`;

    const messages = [
      {
        role: 'user',
        content: horoscopePrompt,
      },
    ];

    const payload = {
      model: 'grok-4',
      messages,
      temperature: 0.9, // Più creativo per l'oroscopo
    };

    console.log('🔮 Generazione oroscopo:', { catName, birthMonth, furColor });

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
        { error: 'Errore nella generazione', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '[Nessuna risposta]';

    return NextResponse.json({ 
      horoscope: content,
    });
  } catch (error: any) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
};
