# CouchSpin

A quiet way to decide what to watch tonight — spin a wheel of the pop-culture canon,
then keep a shelf of what you've seen and what you thought.

Built because "what should we watch?" shouldn't cost forty minutes of scrolling.

## What it does

- **A wheel per category.** Films & series (franchises like LOTR, Rocky, or the MCU
  finale occupy one slot so the wheel doesn't fill with sequels) and Television.
- **Filters.** Sixteen genres, plus an *Include rewatches* toggle. By default the
  wheel skips anything you've marked watched, so it always suggests something new.
- **A shelf.** Every title carries a status (Not started / Partly / Watched), a
  five-star rating, a free-text note, and a "logged on Letterboxd" checkbox — for
  the nights you forget to log it there.
- **Day and dusk.** The valley behind everything shifts with the theme.

## Running it

```bash
npm install && npm run dev
```

Then open http://localhost:5173.

## Where your data lives

Everything is stored in `localStorage` under `couchspin.library.v1` — no account, no
backend, works offline, nothing leaves the browser. The trade-off is that your shelf
doesn't follow you between devices, so the shelf has **Back up** and **Restore**
buttons that round-trip a JSON file.

If you later want real cross-device sync, `src/lib/storage.ts` is the only module
that touches persistence — swapping it for Supabase means reimplementing
`loadLibrary` / `saveLibrary` against a `library` table keyed by user id, and
wrapping `useLibrary` in an auth check. Nothing else in the app needs to change.

## Adding titles

`src/data/titles.ts` is a plain list. There are three helpers — `film()`, `saga()`,
and `show()` — and each entry is one line:

```ts
film('the-thing', 'The Thing', 1982, 109, ['Horror', 'Sci-Fi'], 'Practical effects at their nastiest.'),
```

Genres must come from `GENRES` in `src/lib/types.ts`. The `id` is what the shelf
stores, so renaming one resets that title's history — change the `name`, not the `id`.

## Stack

React 19 + TypeScript + Vite, deployed on Vercel. No UI framework and no CSS
library; the whole look is one hand-written stylesheet, and the valley background
is layered CSS gradients rather than an image, so it stays sharp at any size and
costs nothing to load.

Fonts are Instrument Serif and DM Sans.
