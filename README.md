# CouchSpin

A quiet way to decide what to watch tonight — spin a wheel of the pop-culture canon,
then keep a shelf of what you've seen and what you thought.

Built because "what should we watch?" shouldn't cost forty minutes of scrolling.

## What it does

- **A wheel per category.** Films & series (franchises like LOTR, Rocky, or the MCU
  finale occupy one slot so the wheel doesn't fill with sequels) and Television.
- **Ten slots at a time**, dealt from the filtered pool — never the whole catalogue,
  which would be unreadable. Mark something watched and only *that* slot refills
  from the pool; the other nine stay put, so one decision doesn't reshuffle the
  choices you were still weighing. "Reshuffle the wheel" re-deals all ten.
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

**With sync configured**, you sign in with an email and password and the shelf
follows you to any device you sign in on. Clearing a browser no longer loses
anything.

### Turning sync on

1. Create a project at [supabase.com](https://supabase.com) (the free tier is far
   more than enough — the whole shelf is a few tens of KB).
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). It
   creates one `libraries` table and the row-level-security policies that keep each
   row readable only by the user it belongs to.
3. In **Settings → API keys**, take the **publishable** key (`sb_publishable_…`).
   That is the browser-safe one — it replaced the legacy `anon` key.

   > Do **not** use the *secret* or *service* keys. They bypass row-level security
   > completely, and any `VITE_`-prefixed variable is compiled into the JavaScript
   > every visitor downloads. Putting one there hands anyone who opens devtools full
   > read/write on the whole database.

4. Add both to Vercel under **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL` — e.g. `https://yourproject.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Optional but recommended for a personal app: in Supabase under **Authentication
   → Sign In / Providers → Email**, turn **Confirm email** off. Sign-up then works
   immediately. Left on, Supabase emails a confirmation link first — and the free
   tier's built-in mail is rate-limited to a couple of messages an hour, which is
   an unpleasant way to get stuck.
6. Redeploy. For local dev, put the same two variables in `.env.local` (see
   `.env.example`).

Authentication is plain email + password (`signInWithPassword`). Supabase stores
only a salted hash — the app never sees or keeps the password, and the session
token it does keep is refreshed automatically.

The publishable key is meant to ship in the browser bundle; row-level security is
what protects the data, not the secrecy of that key.

### How conflicts resolve

Every entry carries an `updatedAt`. Merges run per title, newest wins — so two
devices that edited *different* titles while offline both keep their changes rather
than one overwriting the other wholesale. Pushes re-read the remote row and merge
before writing, and the first sign-in on a device merges local and cloud in both
directions, so connecting a phone that already has a shelf won't discard either side.

## Where the title data comes from

Two layers, deliberately.

`src/data/titles.ts` is the **curated spine** — a hand-picked canon. It decides what
is on the wheel, and owns the genres the filters run on and the one-line blurbs.
This is editorial on purpose: a live "popular" feed would fill the wheel with
whatever released last month, which is the opposite of what this app is for.

`src/data/enriched.json` is **generated** by `npm run enrich` and merged over the
top at module load. It only overwrites facts a database knows better than a person
does — year, runtime, season count, poster art. Genres and blurbs are never touched.

```bash
npm run enrich
```

- **Television → TVmaze.** No API key, and it tracks season counts properly.
- **Films and franchises → TMDB.** Needs a free credential in `TMDB_API_KEY`
  (environment or `.env.local`); get one instantly at
  [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). Either
  works — the short v3 **API Key** or the long v4 **API Read Access Token**; the
  script detects which you pasted and authenticates accordingly. Without one it
  still runs, does every show, and reports the films it skipped.

The output is committed, so **the deployed app makes no API calls and needs no
key** — posters come from the providers' public image CDNs.

Why it exists: I originally wrote all the metadata from memory, and 12 of 80 season
counts were wrong. Letterboxd would have been the natural source given the app links
out to it, but [their API is request-only](https://letterboxd.com/api-beta/) with no
self-service signup, and its OAuth2 client secret couldn't live in a browser bundle
anyway — it would need a serverless proxy.

The script prints anything worth a second look: weak title matches, and cases where
a provider disagreed wildly with the curated data. That last check earns its keep —
TVmaze dates Avatar: The Last Airbender as ending in 2026, and folds *El Camino* into
Breaking Bad's run. When a provider's end year is implausible the curated run is kept
instead. To force a specific film match, add `tmdb: <id>` to its entry; for titles
filed under another name (Money Heist is *La Casa de Papel*), add an alias to
`SEARCH_ALIASES` in the script.

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
