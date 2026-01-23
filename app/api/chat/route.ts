import { NextResponse } from 'next/server';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { messages, hasImage } = body as {
      messages: any[];
      hasImage?: boolean;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Log per debug: verifica che il context sia presente
    if (messages.length > 0) {
      const firstMsg = messages[0];
      console.log('🔥 Primo messaggio (context?):', firstMsg.role, firstMsg.content?.substring(0, 150));
    }

    // Forza Grok-4 (o il modello più potente disponibile)
    const model = 'grok-4';

    const payload: any = {
      model,
      messages,
      temperature: 0.8, // Aumentato per più creatività/fluido
      // max_tokens: 8192, // opzionale, xAI gestisce bene senza
    };
    
    console.log('🔥 Invio a xAI:', {
      model,
      messageCount: messages.length,
      hasImage: !!hasImage,
    });

    // Vision supportata nativamente
    // messages già contiene image_url se hasImage === true

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