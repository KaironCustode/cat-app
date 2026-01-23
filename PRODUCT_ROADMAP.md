# Product Roadmap — Cat Behavior Analyzer

## Regola d’oro

**Ogni feature deve rispondere ad almeno una di queste tre cose:**

| | |
|---|---|
| **a)** | Aumenta la **fiducia** |
| **b)** | Aumenta l’**attaccamento** |
| **c)** | Aumenta la **ricorrenza** |

Se non fa almeno una delle tre → **fuori**.

---

## Già in prodotto (forte)

### 1. Analisi comportamento (core)
- **Cosa:** Foto/video → Shenzy analizza orecchie, coda, postura, stato emotivo, intenzioni, consigli.
- **Valore:** Portata principale. È ciò che giustifica il prezzo.
- **Regola:** fiducia ✅ | attaccamento ✅ | ricorrenza ⚪

### 2. Oroscopo
- **Cosa:** Guardiano + gatto (nome, mese, colore, etc.) → oroscopo mensile in italiano.
- **Valore:** Non è fuffa: è **rituale**. Non serve che sia vero, serve che sia **atteso**.
- **Regola:** attaccamento ✅ | ricorrenza ✅ (ritorno mensile)

---

## Pacchetto “giusto” — 5 feature prioritarie

### 3. Diario del gatto 🐾 *(fondamentale)*
- **Cosa:** Log minimo: **data** | **tipo** (analisi / nota manuale) | **breve riassunto**. Automatico + manuale.
- **Perché:** Crea **continuità**, fa percepire **crescita nel tempo**, trasforma l’app da “tool” a “**compagnia**”.  
  Es.: *“Ah, è già la terza volta questo mese che è agitato.”*
- **Regola:** attaccamento ✅ | ricorrenza ✅
- **Impl. (MVP):** `localStorage` → array di `{ date, type, summary, catId? }`. Poi backend + DB.

### 4. Segnali da osservare *(educazione soft)*
- **Cosa:** Dopo ogni analisi, blocco tipo: *“Tieni d’occhio questi segnali nei prossimi giorni:”*  
  – cambiamenti di appetito · grooming eccessivo · isolamento · vocalizzazioni.  
  **Non diagnosi. Attenzione guidata.**
- **Perché:** Aumenta **fiducia**, **utilità**, **percezione di professionalità**.
- **Regola:** fiducia ✅
- **Impl.:** Prompt Shenzy: fine analisi con sezione “Segnali da osservare…”. UI: evidenziare quel blocco (es. card dedicata).

### 5. Confronto leggero nel tempo 📈
- **Cosa:** Niente grafici da nerd. Es.: *“Nelle ultime 4 osservazioni: più curioso / meno teso / stabile”*  
  oppure *“Comportamento simile all’ultima analisi del 12 marzo.”*
- **Perché:** Il cervello adora il **confronto**. Dà senso di **evoluzione** e **ritorno**.
- **Regola:** fiducia ✅ | ricorrenza ✅
- **Impl.:** Dipende da **Diario**. Usare ultime N analisi → sintesi (Shenzy o euristiche) + riga di confronto in UI.

### 6. Modalità “più gatti” *(multi‑gatto)*
- **Cosa:** Profilo per gatto: **nome** · **colore** · **età** (o mese). Selettore “quale gatto?” prima di analisi / oroscopo / diario.
- **Perché:** Chi ha 2+ gatti è più coinvolto, spende di più, ha più domande. Ottimo per **piano a pagamento** e **differenziazione**.
- **Regola:** attaccamento ✅ | ricorrenza ✅
- **Impl.:** Lista gatti (MVP: `localStorage` o stato). Ogni analisi / voce diario / oroscopo legata a `catId`.

### 7. “Chiedi a Shenzy” *(follow‑up testuale)*
- **Cosa:** Dopo l’analisi: *“Vuoi chiedermi qualcosa su questo comportamento?”* → **una sola** domanda testuale. Niente chat infinita.
- **Perché:** Aumenta **engagement**, **giustifica il prezzo**, dà senso di **dialogo**.
- **Regola:** fiducia ✅ | attaccamento ✅
- **Impl.:** Input + bottone “Chiedi” → API che riceve (ultima analisi + domanda) → Shenzy risponde. Nessun storico chat.

---

## Altre idee (da inserire quando ha senso)

| Feature | Cosa | Regola | Note |
|--------|------|--------|------|
| **Momenti speciali** 🎂 | Compleanno gatto, “anniversario adozione”, cambio stagione → messaggio breve / micro‑oroscopo / consiglio stagionale | attaccamento ✅ | Zero costo, alto affetto. Serve calendario + notifiche o “oggi è…” in app. |
| **Modalità “calma”** | Colori più soft, animazioni rallentate, meno testo. Per chi apre l’app preoccupato. | fiducia ✅ · attaccamento ✅ | UX toggle. Design emotivo. |
| **Disclaimer intelligente** | Non “Non sostituisce il veterinario”, ma es. *“Quando qualcosa ti preoccupa davvero, Shenzy ti aiuta a capirlo prima.”* | fiducia ✅ | Copy + posizionamento. |

---

## Ordine di implementazione suggerito

1. **Segnali da osservare** — Solo prompt + UI. Nessun storage. Impatto alto / sforzo basso.
2. **Chiedi a Shenzy** — Un follow‑up Q&A dopo l’analisi. Nuova (o estesa) API + UI.
3. **Diario del gatto** — Log analisi + note manuali. Base per confronto e multi‑gatto. MVP con `localStorage`.
4. **Confronto nel tempo** — Dopo che il Diario esiste. Sintesi “ultime N” + messaggio di confronto.
5. **Multi‑gatto** — Profili gatto + selettore. Legare analisi, oroscopo, diario a `catId`.

In parallelo (quick wins):
- **Disclaimer intelligente** (copy + footer).
- **Modalità calma** (tema UX opzionale).

---

## TL;DR

- **Regola:** fiducia / attaccamento / ricorrenza. Altrimenti fuori.
- **Core già forte:** Analisi + Oroscopo.
- **Pacchetto giusto:** Diario · Segnali · Confronto · Multi‑gatto · Chiedi a Shenzy.
- **Prossimi passi:** Segnali + Chiedi a Shenzy (senza DB), poi Diario → Confronto → Multi‑gatto.
