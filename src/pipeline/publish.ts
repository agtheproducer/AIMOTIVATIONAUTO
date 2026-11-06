import "dotenv/config";
import { DateTime } from "luxon";
import { CALENDAR, type Slot } from "../config/calendar.js";
import { generateContent } from "./generateContent.js";
import { renderReel } from "./renderReel.js";
import { renderCarousel } from "./renderCarousel.js";
import { uploadPublicAsset } from "../lib/storage.js";
import { publishCarousel, publishReel } from "../lib/instagram.js";
import { readState, markPosted } from "../state.js";

const SLOT_TIMES: Record<Slot, { hour: number; minute: number }> = {
  AM: { hour: 7, minute: 0 },
  PM: { hour: 20, minute: 30 },
};

// How long after a slot's target time this pipeline will still publish it.
//
// GitHub's cron scheduler is best-effort: it delays runs under load and drops
// them outright, and on this repo scheduled runs have landed 2-3 hours apart
// despite an every-15-minutes cron. A tight window around the target time
// therefore misses slots silently -- posting late beats not posting at all.
// 3 hours is deliberate: it keeps the PM slot (20:30) from spilling past
// midnight into the next calendar day.
const CATCHUP_MINUTES = 3 * 60;

// Checked latest-first so that if both slots are somehow eligible we publish
// the fresher one rather than backfilling the morning post in the evening.
const SLOT_ORDER: Slot[] = ["PM", "AM"];

function findDueSlot(now: DateTime, postedKeys: string[], dateKey: string): Slot | null {
  for (const slot of SLOT_ORDER) {
    const time = SLOT_TIMES[slot];
    const target = now.set({ hour: time.hour, minute: time.minute, second: 0, millisecond: 0 });
    const minutesSince = now.diff(target, "minutes").minutes;

    // Not yet due, or the catch-up window has closed.
    if (minutesSince < 0 || minutesSince > CATCHUP_MINUTES) continue;
    if (postedKeys.includes(`${dateKey}-${slot}`)) continue;

    return slot;
  }
  return null;
}

async function main() {
  const timezone = process.env.TIMEZONE ?? "UTC";
  const dryRun = process.env.DRY_RUN === "true";
  const now = DateTime.now().setZone(timezone);

  const dateKey = now.toFormat("yyyy-LL-dd");
  const state = await readState();

  const slot = findDueSlot(now, state.postedKeys, dateKey);
  if (!slot) {
    console.log(`[publish] ${now.toISO()}: no slot is due and unposted. Nothing to do.`);
    return;
  }

  const stateKey = `${dateKey}-${slot}`;

  const weekday = now.weekday; // 1 = Monday ... 7 = Sunday
  const entry = CALENDAR[weekday][slot];
  console.log(`[publish] ${stateKey}: pillar=${entry.pillar} format=${entry.format}`);

  if (entry.format === "story") {
    console.log(`[publish] ${stateKey} is a Stories slot (${entry.note}) -- not automated yet, skipping.`);
    await markPosted(state, stateKey);
    return;
  }

  const content = await generateContent({ pillar: entry.pillar, format: entry.format });
  const id = `${dateKey}-${slot}`.toLowerCase();

  if (dryRun) {
    console.log("[publish] DRY_RUN=true, skipping render/upload/publish. Generated content:");
    console.log(JSON.stringify(content, null, 2));
    await markPosted(state, stateKey);
    return;
  }

  if (content.format === "reel") {
    const videoPath = await renderReel({ script: content.script, id });
    const videoUrl = await uploadPublicAsset({
      localPath: videoPath,
      key: `reels/${id}.mp4`,
      contentType: "video/mp4",
    });
    const postId = await publishReel({ videoUrl, caption: content.caption });
    console.log(`[publish] Published reel ${postId}`);
  } else {
    const slidePaths = await renderCarousel({
      slides: content.slides,
      ctaSubtext: content.ctaSubtext,
      id,
    });
    const imageUrls = await Promise.all(
      slidePaths.map((p, i) =>
        uploadPublicAsset({
          localPath: p,
          key: `carousels/${id}-${i + 1}.png`,
          contentType: "image/png",
        })
      )
    );
    const postId = await publishCarousel({ imageUrls, caption: content.caption });
    console.log(`[publish] Published carousel ${postId}`);
  }

  await markPosted(state, stateKey);
}

main().catch((err) => {
  console.error("[publish] Failed:", err);
  process.exit(1);
});
