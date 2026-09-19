import { generateText } from "../lib/anthropic.js";
import { PILLARS, type PillarId, type Format } from "../config/pillars.js";
import { story, storyIsReady } from "../config/story.js";

export interface ReelContent {
  format: "reel";
  script: string; // narration text, fed to TTS
  caption: string;
}

export interface CarouselSlideContent {
  text: string;
  citation: string | null; // named source; only content slides carry one
}

export interface CarouselContent {
  format: "carousel";
  slides: CarouselSlideContent[]; // content slides only -- CTA slide is separate
  ctaSubtext: string; // second line on the CTA slide
  caption: string;
}

export type GeneratedContent = ReelContent | CarouselContent;

const SYSTEM_PROMPT = `You write content for an Instagram motivation account aimed at
men 18-30 who feel low drive, phone-addicted, and stuck. Voice: blunt, direct,
David Goggins-style intensity, but every scientific claim must be real and
attributed to a specific named source (a named study or a specific Huberman
Lab episode) -- never invent a citation or a statistic. If you are not certain
a claim is real and correctly attributed, omit it rather than guess.
Never fabricate personal details about the protagonist beyond what is given
to you in storyContext. Output ONLY valid JSON, no prose outside the JSON.`;

function buildStoryContext(): string {
  if (!storyIsReady()) return "No protagonist story provided yet. Do not invent one.";
  return JSON.stringify(story, null, 2);
}

export async function generateContent(params: {
  pillar: PillarId;
  format: Format;
}): Promise<GeneratedContent> {
  const pillar = PILLARS[params.pillar];
  if (pillar.requiresStory && !storyIsReady()) {
    throw new Error(
      `Pillar "${pillar.id}" requires the protagonist story (src/config/story.ts) to be filled in`
    );
  }

  const storyContext = buildStoryContext();

  if (params.format === "reel") {
    const raw = await generateText({
      system: SYSTEM_PROMPT,
      prompt: `Pillar: ${pillar.label}\nBrief: ${pillar.brief}\nstoryContext: ${storyContext}

Write a 30-45 second reel voiceover script (120-160 words) and an Instagram
caption (2-4 sentences, include 3-5 relevant hashtags, end with a line
inviting comments of the word MOTIVATION for the daily protocol via DM).

Return JSON exactly as: {"script": "...", "caption": "..."}`,
    });
    const parsed = JSON.parse(raw) as { script: string; caption: string };
    return { format: "reel", script: parsed.script, caption: parsed.caption };
  }

  const raw = await generateText({
    system: SYSTEM_PROMPT,
    prompt: `Pillar: ${pillar.label}\nBrief: ${pillar.brief}\nstoryContext: ${storyContext}

Write 4 Instagram carousel content slides (short, punchy, one idea per
slide, under 40 words each). Each slide that makes a factual claim needs a
"citation" naming the specific real source (study name or Huberman Lab
episode) -- use null for a slide that is pure narrative/opinion with no
factual claim. Also write:
- "ctaSubtext": one short line for the follow/CTA slide, e.g. "Comment
  MOTIVATION for today's task via DM." (this account posts twice a day)
- "caption": an Instagram caption (2-4 sentences, 3-5 hashtags)

Return JSON exactly as:
{"slides": [{"text": "...", "citation": "..."|null}, ...four of these...],
 "ctaSubtext": "...", "caption": "..."}`,
  });
  const parsed = JSON.parse(raw) as {
    slides: CarouselSlideContent[];
    ctaSubtext: string;
    caption: string;
  };
  return {
    format: "carousel",
    slides: parsed.slides,
    ctaSubtext: parsed.ctaSubtext,
    caption: parsed.caption,
  };
}
