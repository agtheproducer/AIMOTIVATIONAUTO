# AI Motivation Auto — THE PROTOCOL

Automated content pipeline for THE PROTOCOL, a motivation-focused Instagram
account: it
generates a script/carousel, turns it into a voiced reel or a branded
carousel, and posts it to Instagram twice a day. Runs entirely on GitHub
Actions' scheduler -- no server to maintain, and it keeps running whether or
not this Claude chat is open.

See the business/marketing plan doc for positioning, personas, and the
editorial calendar this pipeline implements.

## How it works

```
GitHub Actions (cron, every 15 min)
  -> src/pipeline/publish.ts
       -> is it within 20 min of a scheduled slot (7:00 / 20:30 local) AND not already posted today?
            no  -> exit (no-op)
            yes -> src/config/calendar.ts: look up today's pillar + format
                -> src/pipeline/generateContent.ts (Claude API): script or carousel slides + caption
                -> reel: src/pipeline/renderReel.ts (ElevenLabs voice -> Remotion video)
                   carousel: src/pipeline/renderCarousel.ts (Remotion stills)
                -> src/lib/storage.ts: upload rendered file(s) to Cloudflare R2 (public URL)
                -> src/lib/instagram.ts: publish via Instagram Graph API
                -> src/state.ts: record that this slot is done, commit back to the repo
```

Every step is real code in this repo, not a Claude agent running the steps
live -- that's what makes it reliable enough to run unattended twice a day,
every day.

## What you need to set up (I can't do these for you)

These require your identity/accounts, so they're yours to create. Once you
have them, hand me the values and I'll wire them in as GitHub Actions
secrets (never committed to the repo).

1. **Instagram Business or Creator account**, linked to a Facebook Page.
   Convert in the Instagram app: Settings -> Account type.
2. **Meta Developer App** at developers.facebook.com, with the Instagram
   Graph API product added. Add your own account as a tester -- this alone
   is enough to publish to your own account without needing Meta's full App
   Review process.
3. **A long-lived access token** with `instagram_basic` and
   `instagram_content_publish` permissions, and your **Instagram user id**
   (`IG_USER_ID` / `IG_ACCESS_TOKEN`). Meta's Graph API Explorer can generate
   and exchange this for a long-lived token (~60 days; needs periodic
   refresh -- I can add a refresh step once this is running).
4. **Anthropic API key** (`ANTHROPIC_API_KEY`) -- console.anthropic.com.
5. **ElevenLabs account + API key + a chosen voice** (`ELEVENLABS_API_KEY`,
   `ELEVENLABS_VOICE_ID`) -- this is the "one consistent voice" for every
   reel. Pick or clone a voice in their dashboard and copy its voice id.
6. **Cloudflare R2 bucket** (free tier is generous) with a public access URL
   -- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. Instagram's API needs a public URL to
   fetch each rendered video/image from before it can post it.
7. **Instagram's native Automations** (in-app or Meta Business Suite):
   set up a comment-keyword automation on "MOTIVATION" that DMs your
   protocol sequence. This is configured in the Instagram app itself, not in
   this repo -- it's the Meta-sanctioned way to do comment-to-DM and avoids
   the ban risk of a custom bot.

Once you have items 1-6, add them as **GitHub repo secrets**: Settings ->
Secrets and variables -> Actions -> New repository secret, one per value
above. Also add a repo **variable** (not secret) named `TIMEZONE` with your
IANA timezone, e.g. `America/New_York`.

## Before it can post anything real

`src/config/story.ts` is intentionally empty. The pipeline refuses to
generate "The Fight" or "The Proof" content until your real story is filled
in there (name, start date, real turning points) -- it will never invent
personal history. "The Protocol" and "The Diagnosis" pillars work without it.

## Testing locally without posting anything

```
npm install
cp .env.example .env   # fill in the keys you have so far
npm run publish:dry-run
```

Dry run generates and logs content but skips rendering, upload, and the
actual Instagram post -- safe to run anytime.

## Triggering a real run manually

Once secrets are set, go to the repo's Actions tab -> "Post to Instagram" ->
Run workflow. This bypasses the schedule and runs immediately (still
respects the slot-window/already-posted check in `publish.ts`).

## Current limitations

- **Stories aren't automated yet** -- Sunday AM in the calendar is a
  Stories slot and is currently skipped by the pipeline (logged, not
  posted). Feasible to add later via the Graph API's Stories endpoint.
- **B-roll is a solid background for now** -- `remotion/ReelComposition.tsx`
  has a placeholder background; swapping in real footage/AI visuals is the
  next visual upgrade once the pipeline is posting reliably.
- **Access token refresh isn't automated** -- long-lived IG tokens expire
  around 60 days; you'll need to regenerate and update the secret
  periodically until a refresh step is added.
- **GitHub Actions minutes**: checking every 15 minutes runs ~96 times/day.
  Each no-op check is fast, but on a private repo this eats into the
  monthly free minutes quota faster than a plain twice-a-day cron would.
  Making the repo public removes that limit, or I can tighten this later.
