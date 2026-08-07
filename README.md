# NeoLingo 🇸🇪

A Swedish course for a German speaker, from absolute beginner to fluent. Installable
as a PWA, works offline, and nags you until you've done a lesson.

## What's in it

| | |
|---|---|
| **Vocabulary** | 1,200+ Swedish words, frequency-ordered, each with German + English, part of speech, full noun/verb morphology, and false-friend warnings aimed at German speakers |
| **Course** | 47 lessons across 16 units, A1 → C1, mixing hand-written grammar drills with generated vocabulary practice |
| **Grammar** | 32 reference topics covering everything from `en/ett` to the s-passive, each with tables, examples and a "for German speakers" trap note |
| **Flashcards** | SM-2 spaced repetition with archive, star, review counts and per-button interval previews |
| **Scenarios** | 12 roleplay situations plus free chat, with a streaming AI partner that stays in character and corrects one mistake per turn |
| **Speech** | Swedish TTS on every word and example, plus speech-recognition exercises |
| **Reminders** | Web push several times a day, which stops as soon as a lesson is done |

## Stack

- **Next.js 16** (App Router) + React 19, no UI framework
- **Upstash Redis** for cloud sync — one JSON snapshot per profile
- **OpenAI** for chat, translation, grading, TTS and transcription
- **web-push** for the daily reminders

There is no Supabase and no ORM. State lives in the browser; the network is an
optimisation, not a dependency.

## Running it

```bash
npm install
cp .env.example .env.local   # fill in OPENAI_API_KEY at minimum
npm run dev
```

The app is fully usable with only `OPENAI_API_KEY` set. Without Redis it keeps
everything in `localStorage` and shows "Nur auf diesem Gerät"; without VAPID keys
the reminders section explains that push isn't configured.

### Scripts

```bash
npm run check    # content integrity + typecheck
npm run icons    # regenerate the Swedish flag PNGs
npm run vapid    # generate a VAPID key pair for push
```

`npm run check` verifies that every word a lesson references exists in the corpus
and every `grammarId` resolves to a real topic — these are plain strings, so a typo
would otherwise silently drop a drill.

## Deploying

1. Push to GitHub and import the repo on Vercel.
2. Add the **Upstash for Redis** integration from the Vercel Marketplace. It injects
   `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. Set `OPENAI_API_KEY`.
4. For reminders, run `npm run vapid` and set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`. Set `CRON_SECRET` too.

### Sync model

Everything is local-first. Progress is written to `localStorage` immediately and
flushed to Redis after six seconds of idle, plus on `visibilitychange`. The server
does a read-merge-write rather than an overwrite, and merges **per record** — each
card keeps whichever copy was reviewed most recently — so a session finished on the
phone survives a stale laptop tab flushing afterwards.

That works out to a handful of Redis commands per session rather than one per
answered card.

### Reminders on iOS

iOS only exposes the Push API to PWAs launched from the Home Screen. On iPhone the
app must be installed via **Share → Add to Home Screen** and opened from there;
the settings screen explains this rather than failing silently in a Safari tab.

`vercel.json` schedules `/api/notify/run` four times a day. The endpoint checks each
subscriber's **local** calendar day, skips anyone who has already completed a lesson,
respects quiet hours (before 08:00 and after 22:00), and escalates its tone as the
day goes on. All four nudges share a notification tag, so a later one replaces the
earlier rather than stacking up on the lock screen.

> Vercel's Hobby plan limits cron jobs to one invocation per day. On Hobby, either
> keep a single entry or point an external scheduler at
> `/api/notify/run` with the `x-cron-secret` header.

## Content authoring

Vocabulary lives in `content/words/*.ts` as pipe-delimited lines grouped into themed
blocks:

```
sv | de | en | pos | forms | note
```

Only the first four fields are required. `forms` carries morphology
(`en bil, bilen, bilar, bilarna` for nouns, `äta, äter, åt, ätit` for verbs) and
`note` carries a German-speaker warning. The block header supplies the CEFR level and
the theme tags, and each tag maps to a flashcard deck — adding words to a block grows
the matching deck automatically.

Lessons reference vocabulary by Swedish headword, so `npm run check` is the guardrail
against typos.
