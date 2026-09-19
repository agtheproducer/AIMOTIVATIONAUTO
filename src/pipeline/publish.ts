import "dotenv/config";
import { DateTime } from "luxon";
import { CALENDAR, type Slot } from "../config/calendar.js";
import { generateContent } from "./generateContent.js";
import { renderReel } from "./renderReel.js";
import { renderCarousel } from "./renderCarousel.js";
import { uploadPublicAsset } from "../lib/storage.js";
import { publishCarousel, publishReel } from "../lib/instagram.js";
import { readState, writeState } from "../state.js";

const SLOT_TIMES: Record<Slot, { hour: number; minute: number }> = {
  AM: { hour: 7, minute: 0 },
  PM: { hour: 20, minute: 30 },
};
const WINDOW_MINUTES = 20; // how close to the target time this run must be to act

function findDueSlot(now: DateTime): Slot | null {
  for (const [slot, time] of Object.entries(SLOT_TIMES) as [Slot, { hour: number; minute: number }][]) {
    const target = now.set({ hour: time.hour, minute: time.minute, second: 0, millisecond: 0 });
    if (Math.abs(now.diff(target, "minutes").minutes) <= WINDOW_MINUTES) {
      return slot;
    }
  }
  return null;
}

async function main() {
  const timezone = process.env.TIMEZONE ?? "UTC";
  const dryRun = process.env.DRY_RUN === "true";
  const now = DateTime.now().setZone(timezone);

  const slot = findDueSlot(now);
  if (!slot) {
    console.log(`[publish] ${now.toISO()} is not within a posting window. Nothing to do.`);
    return;
  }

  const dateKey = now.toFormat("yyyy-LL-dd");
  const stateKey = `${dateKey}-${slot}`;
  const state = await readState();
  if (state.lastPostedKey === stateKey) {
    console.log(`[publish] Already handled ${stateKey}. Skipping.`);
    return;
  }

  const weekday = now.weekday; // 1 = Monday ... 7 = Sunday
  const entry = CALENDAR[weekday][slot];
  console.log(`[publish] ${stateKey}: pillar=${entry.pillar} format=${entry.format}`);

  if (entry.format === "story") {
    console.log(`[publish] ${stateKey} is a Stories slot (${entry.note}) -- not automated yet, skipping.`);
    await writeState({ lastPostedKey: stateKey });
    return;
  }

  const content = await generateContent({ pillar: entry.pillar, format: entry.format });
  const id = `${dateKey}-${slot}`.toLowerCase();

  if (dryRun) {
    console.log("[publish] DRY_RUN=true, skipping render/upload/publish. Generated content:");
    console.log(JSON.stringify(content, null, 2));
    await writeState({ lastPostedKey: stateKey });
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
    const slidePaths = await renderCarousel({ slides: content.slides, id });
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

  await writeState({ lastPostedKey: stateKey });
}

main().catch((err) => {
  console.error("[publish] Failed:", err);
  process.exit(1);
});
