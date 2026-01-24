# Cat App - Project Checkpoint
**Date:** January 24, 2026

## Project Overview
**Shenzy** is a cat behavior analyzer app built with Next.js. Users upload photos or videos of their cats, and an AI (powered by Claude Haiku) analyzes the cat's body language, mood, and behavior, providing insights in a warm, conversational Italian tone.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom CSS variables
- **AI:** Anthropic Claude Haiku (vision + text)
- **Storage:** localStorage (client-side)
- **Deployment:** Vercel (pending)

## Repository
- **GitHub:** https://github.com/KaironCustode/cat-app
- **Branch:** main

---

## Core Features

### 1. Cat Profile Management
- Create, edit, and delete cat profiles
- Each profile includes:
  - Name
  - Color (visual identifier)
  - Photo (optional)
  - Home context (living situation, other animals, family members)
- Profiles stored in localStorage

### 2. Photo/Video Analysis
- Upload photos or short videos of cats
- Two-step AI pipeline:
  1. **Claude Vision** - Neutral observation of cat's physical state (ears, tail, pupils, posture, location)
  2. **Claude Speak** - Transforms observations into warm Italian analysis as "Shenzy"
- Supports drag & drop and file picker
- Video processing extracts frames for analysis

### 3. Ask Shenzy (Follow-up Questions)
- After analysis, users can ask up to 3 follow-up questions
- AI responds based on the previous analysis context
- Accepts corrections gracefully ("Hai ragione, ho preso un abbaglio!")

### 4. Quick Notes
- Free-text notes saved to specific cat profiles
- Quick templates available (food, behavior, health, etc.)
- Two-step flow: select cat first, then write note

### 5. Agenda/Reminders
- Schedule reminders for vet visits, medications, grooming, etc.
- Recurring options: monthly, quarterly, yearly
- Shows upcoming (7 days) and overdue reminders
- Mark as completed or delete

### 6. AI Chat
- General chat about cats with Shenzy
- Rate limited: 10 messages per 6 hours (stored in localStorage)
- Shows remaining messages and reset time

### 7. Baseline Comparison
- Save a "baseline" analysis when cat is healthy
- Future analyses compare against baseline
- Alerts if significant changes detected

---

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/cat-analysis` | Main vision analysis (photo/video) |
| `/api/ask-shenzy` | Follow-up questions after analysis |
| `/api/chat` | General cat chat |

All routes use Claude Haiku with fallback models:
1. `claude-3-5-haiku-latest`
2. `claude-3-haiku-20240307`

---

## Key Files

```
cat-app/
├── app/
│   ├── api/
│   │   ├── cat-analysis/route.ts   # Vision + personality pipeline
│   │   ├── ask-shenzy/route.ts     # Follow-up Q&A
│   │   └── chat/route.ts           # General chat
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── CatAnalyzer.tsx             # Main UI component (~2000 lines)
├── lib/
│   ├── cat-behavior-knowledge.ts   # Shenzy's knowledge base
│   └── cat-storage.ts              # localStorage helpers
├── .env.local                      # ANTHROPIC_API_KEY (not in repo)
└── CHECKPOINT.md                   # This file
```

---

## Recent Changes (This Session)

### Migrated from Grok to 100% Claude
- Removed all Grok/xAI dependencies
- Now uses Claude Haiku for both vision and text generation

### UI/UX Improvements
- Replaced progress bar with simple "Shenzy sta analizzando, un attimino!"
- Enlarged color selection buttons (w-8 -> w-12)
- Removed automatic mood detection tag
- Removed "Segnali da osservare" section (too paranoid/negative)
- Added delete profile button

### Behavior Fixes
- **Litter box fix:** Vision prompt now explicitly identifies cats in litter boxes; Shenzy doesn't romanticize cats pooping
- **Weight comments:** Only mentions weight for extremely obese cats (morbid obesity)
- **Correction acceptance:** Shenzy now accepts user corrections with humility

### Feature Fixes
- **Quick Note:** Now asks which cat profile first, then allows free text
- **AI Chat:** Working with 10 messages/6 hours rate limit
- **Agenda:** Verified working

### Removed Features
- Camera capture (didn't work on mobile)

---

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Deployment Status

- **GitHub:** Pushed to https://github.com/KaironCustode/cat-app
- **Vercel:** Pending setup (need to add ANTHROPIC_API_KEY as environment variable)

### Vercel Setup Steps
1. Go to vercel.com
2. Login with GitHub
3. Import `cat-app` repository
4. Add environment variable: `ANTHROPIC_API_KEY`
5. Deploy

---

## Shenzy Personality Guidelines

- Name: **Shenzy**
- Language: Italian only
- Tone: Warm, curious, direct, "gattoso"
- Never mentions AI, Claude, Anthropic, prompts, or rules
- No preambles ("Certo!", "Ho capito!")
- Uses **bold** sparingly for emphasis
- Max 250-300 words for analysis, 100 words for chat
- Accepts corrections gracefully
- Health advice always reminds: not a substitute for vet

---

## Known Considerations

1. **localStorage limitations:** Data is device-specific, no sync
2. **API costs:** Each analysis = 2 Claude calls (vision + speak)
3. **Rate limiting:** Chat is client-side only (can be bypassed)
4. **No authentication:** Anyone with the URL can use the app

---

## Next Steps

1. Complete Vercel deployment
2. Test on mobile devices
3. Consider adding:
   - Data export/import
   - Push notifications for reminders
   - Multi-language support
   - Server-side rate limiting

---

*Checkpoint created by Claude Opus 4.5 - January 24, 2026*
