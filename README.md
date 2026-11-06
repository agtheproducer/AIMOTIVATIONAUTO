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
GitHub Actions (cron, hourly)
  -> src/pipeline/publish.ts
       -> is a slot (7:00 / 20:30 local) due, still inside its 3h catch-up window, AND not already posted today?
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
- **Posts can land late** -- because GitHub's cron is unreliable, a slot is
  published by the first run inside its 3-hour catch-up window rather than
  at an exact time, so the 7:00 post may go out as late as 10:00 local. See
  "Scheduling" below for why that trade-off is the right one.

## Scheduling: why hourly and not every 15 minutes

GitHub's cron is best-effort, not guaranteed. It delays scheduled runs when
the shared queue is busy and silently drops them entirely -- on this repo,
runs from an every-15-minutes cron have landed 2-3 hours apart.

The original design paired that frequent cron with a tight +/-20 minute
window around each slot in `publish.ts`. That combination fails badly: if no
run happens to land inside the 40-minute window, the slot is missed with no
error anywhere, and the next run that does fire sees itself as outside the
window and no-ops.

So the window is now a **catch-up window** instead: a slot is due from its
target time until `CATCHUP_MINUTES` (3 hours) afterwards, and the first run
to land in that range publishes it. Late is better than never. Because
correctness no longer depends on a run landing in a narrow window, the cron
drops to hourly -- 24 no-op checks a day instead of 96 -- and each slot still
gets roughly three chances. It fires at minute 17 because the top of the hour
is the most congested, and therefore the most-dropped, slot in GitHub's queue.

`state/last-post.json` tracks a list of published slot keys
(`YYYY-MM-DD-AM` / `-PM`) rather than a single value, so the AM and PM slots
can't overwrite each other's bookkeeping during a catch-up.

## Troubleshooting

**Every scheduled run fails after 2-3 seconds, and the logs 404.** This is
not a bug in this repo. A job that fails that fast with no step output was
never assigned a runner, which means GitHub refused to start it at the
account level -- almost always a billing problem (a failed payment method or
a spending limit), which suspends Actions across every repo on the account,
public ones included. Check <https://github.com/settings/billing>. Compare a
failing run against a working one in the Actions API: the working job has
`runner_id`, `runner_name`, and a populated `steps` array, and a blocked one
has none of them.

**It posts nothing but every run is green.** Check
`state/last-post.json`. If `postedKeys` is empty, no slot has ever actually
published, and every green run was a no-op that exited at the slot check.
