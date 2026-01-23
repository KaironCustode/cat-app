# 🎬 Istruzioni per Aggiungere Video Hero

Per rendere l'app ancora più professionale e vendibile, puoi aggiungere un video di background animato nell'hero section.

## Come fare:

1. **Crea/Esporta il video con Filmora:**
   - Durata: 10-30 secondi (loop infinito)
   - Risoluzione: 1920x1080 o superiore
   - Formato: MP4 (H.264)
   - Dimensione file: cerca di mantenerlo sotto 5-10MB per performance
   - Contenuto: gatti che si muovono, giocano, o scene carine (evita scene troppo movimentate)

2. **Rinomina il file:**
   - Nome: `hero-cat.mp4`
   - Deve essere esattamente questo nome

3. **Aggiungi il file:**
   - Posizione: `public/hero-cat.mp4`
   - L'app rileverà automaticamente il video e lo userà come background

4. **Ottimizzazione (opzionale ma consigliato):**
   - Usa un tool come HandBrake o FFmpeg per comprimere:
   ```bash
   # Esempio con ffmpeg
   ffmpeg -i input.mp4 -vcodec h264 -crf 28 -preset slow hero-cat.mp4
   ```

## Suggerimenti per il video:

- ✅ Scene calme e rilassanti (gatti che dormono, si stirano, giocano dolcemente)
- ✅ Buona illuminazione
- ✅ Movimenti fluidi
- ✅ Loop perfetto (inizio e fine devono combaciare)
- ❌ Evita scene troppo veloci o caotiche
- ❌ Evita audio (verrà mutato comunque)

## Se non aggiungi il video:

L'app funzionerà perfettamente con un bellissimo gradient di fallback. Il video è completamente opzionale!
