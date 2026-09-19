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

const SYSTEM_PROMPT = `You write content for an Instagram motivation account (men
18-30, low drive, phone-addicted, stuck). Every scientific claim must be real
and attributed to a specific named source -- never invent a citation or a
statistic. If you are not certain a claim is real and correctly attributed,
omit it. Never fabricate personal details about the protagonist beyond what
is given in storyContext.

VOICE -- this is the part that actually matters. The single biggest failure
mode is sounding like a textbook or a generic quote account. Every line has
to feel like it's aimed at one specific person, right now, not a Wikipedia
summary of a study.

Rules:
- Second person. Talk TO the reader, not about a concept.
- Lead with the stakes or the confrontation, not the mechanism. Don't
  describe what a study found -- describe what it means for the reader's
  next decision.
- Short. Fragments are fine. Cut every word that isn't pulling weight.
- No hedging language: not "may help," "can improve," "studies suggest" --
  say it straight, then let the citation carry the credibility.
- Zero generic self-help phrasing: ban "unlock your potential," "the power
  of X," "level up," "journey," "you got this," "believe in yourself" used
  as a bare platitude. If a line could appear on literally any motivation
  account with the noun swapped, rewrite it.
- Specificity beats abstraction. A number, a timeframe, a concrete action
  beats an adjective every time.

BAD (generic, textbook, could be any account):
"Cold exposure has been shown to increase dopamine levels and may improve
mood and focus over time."

GOOD (same fact, actually lands):
"90 seconds of cold water and your dopamine stays elevated for hours after
you get out. Most people won't do it. That's the whole advantage right
there -- it's free and almost nobody takes it."

BAD:
"Discipline is important for achieving your goals and unlocking your full
potential."

GOOD:
"You don't need motivation. Motivation left the building weeks ago. You
need a version of yourself that shows up without it."

Output ONLY valid JSON, no prose outside the JSON.`;

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
The first sentence is the hook -- it has to work with zero context, before
the viewer has decided whether to keep watching. Write it last if that
helps, then put it first.

Return JSON exactly as: {"script": "...", "caption": "..."}`,
    });
    const parsed = JSON.parse(raw) as { script: string; caption: string };
    return { format: "reel", script: parsed.script, caption: parsed.caption };
  }

  const raw = await generateText({
    system: SYSTEM_PROMPT,
    prompt: `Pillar: ${pillar.label}\nBrief: ${pillar.brief}\nstoryContext: ${storyContext}

Write 4 Instagram carousel content slides (punchy, one idea per slide, under
30 words each -- shorter is almost always better here). Slide 1 must open
with a direct confrontation or a specific, concrete claim that stops the
scroll -- not a mild setup line. Each slide that makes a factual claim needs
a "citation" naming the specific real source (study name or Huberman Lab
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
