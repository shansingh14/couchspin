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

Two layers. `localStorage` (key `couchspin.library.v1`) is always written, so the app
opens instantly and keeps working offline. If cloud sync is switched on, that same
shelf is also kept in Supabase, which is the durable copy.

**Without sync configured**, localStorage is all there is — and it is genuinely
fragile. Clearing site data wipes it, and Safari evicts localStorage for sites you
haven't opened in about a week. It also can't reach your other devices. The **Back
up** button on the shelf writes a JSON file you own; **Restore** merges one back in.

**With sync configured**, you sign in with a one-time emailed link and the shelf
follows you to any device you sign in on. Clearing a browser no longer loses
anything.

### Turning sync on

1. Create a project at [supabase.com](https://supabase.com) (the free tier is far
   more than enough — the whole shelf is a few tens of KB).
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). It
   creates one `libraries` table and the row-level-security policies that keep each
   row readable only by the user it belongs to.
3. In **Settings → API**, copy the *Project URL* and the *anon / public* key.
4. Add them to Vercel under **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Redeploy. For local dev, put the same two in `.env.local` (see `.env.example`).

The anon key is meant to ship in the browser bundle; row-level security is what
protects the data, not the secrecy of that key.

### How conflicts resolve

Every entry carries an `updatedAt`. Merges run per title, newest wins — so two
devices that edited *different* titles while offline both keep their changes rather
than one overwriting the other wholesale. Pushes re-read the remote row and merge
before writing, and the first sign-in on a device merges local and cloud in both
directions, so connecting a phone that already has a shelf won't discard either side.

## Adding titles

`src/data/titles.ts` is a plain list. There are three helpers — `film()`, `saga()`,
and `show()` — and each entry is one line:

```ts
film('the-thing', 'The Thing', 1982, 109, ['Horror', 'Sci-Fi'], 'Practical effects at their nastiest.'),
```

Genres must come from `GENRES` in `src/lib/types.ts`. The `id` is what the shelf
stores, so renaming one resets that title's history — change the `name`, not the `id`.

## Stack

React 19 + TypeScript + Vite, deployed on Vercel, with Supabase for optional sync.
No UI framework and no CSS library; the whole look is one hand-written stylesheet,
and the valley background is layered CSS gradients rather than an image, so it stays
sharp at any size and costs nothing to load.

Fonts are Instrument Serif and DM Sans.
