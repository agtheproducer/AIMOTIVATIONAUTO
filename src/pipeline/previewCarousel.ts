import "dotenv/config";
import { mkdir, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateContent } from "./generateContent.js";
import { renderCarousel } from "./renderCarousel.js";
import { PILLARS_AVAILABLE_WITHOUT_STORY, type PillarId } from "../config/pillars.js";
import { storyIsReady } from "../config/story.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = path.join(__dirname, "..", "..", "preview-output");

const ALL_PILLARS: PillarId[] = ["protocol", "diagnosis", "fight", "proof"];

// Local, no-network-posting preview: generates text content (Claude API) and
// renders the carousel slides (Remotion) so you can see exactly what the
// pipeline produces, with no Instagram, no R2 upload, no ElevenLabs/voice.
async function main() {
  const arg = process.argv[2] ?? "protocol";
  const pillars: PillarId[] = arg === "all" ? ALL_PILLARS : [arg as PillarId];

  for (const pillar of pillars) {
    if (!ALL_PILLARS.includes(pillar)) {
      console.error(`Unknown pillar "${pillar}". Use one of: ${ALL_PILLARS.join(", ")}, or "all".`);
      process.exit(1);
    }
    if (!PILLARS_AVAILABLE_WITHOUT_STORY.includes(pillar) && !storyIsReady()) {
      console.log(`[skip] "${pillar}" requires the protagonist story -- not ready.`);
      continue;
    }

    console.log(`\n=== ${pillar} ===`);
    const content = await generateContent({ pillar, format: "carousel" });
    if (content.format !== "carousel") continue;

    console.log("Caption:\n" + content.caption + "\n");
    content.slides.forEach((s, i) => {
      console.log(`Slide ${i + 1}: ${s.text}`);
      if (s.citation) console.log(`  Source: ${s.citation}`);
    });
    console.log(`CTA slide: Follow for the daily protocol. / ${content.ctaSubtext}`);

    const id = `preview-${pillar}`;
    const slidePaths = await renderCarousel({
      slides: content.slides,
      ctaSubtext: content.ctaSubtext,
      id,
    });

    await mkdir(PREVIEW_DIR, { recursive: true });
    for (const p of slidePaths) {
      await cp(p, path.join(PREVIEW_DIR, path.basename(p)));
    }
    console.log(`Rendered ${slidePaths.length} slides to preview-output/`);
  }
}

main().catch((err) => {
  console.error("[preview] Failed:", err);
  process.exit(1);
});
