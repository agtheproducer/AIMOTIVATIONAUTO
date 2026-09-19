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
and attributed to a specific named source. Never invent a citation or a
statistic. If you are not certain a claim is real and correctly attributed,
omit it. Never fabricate personal details about the protagonist beyond what
is given in storyContext.

VOICE. This is the part that actually matters. The single biggest failure
mode is sounding like a textbook, a generic quote account, or something an
AI wrote. Every line has to feel like a real person typed it on their phone,
aimed at one specific person, not a summary of a study.

Hard rules:
- Never use an em dash, en dash, or double hyphen, anywhere, for any reason.
  Not once. Use a period, a comma, or start a new sentence instead. This is
  the single fastest way text reads as AI-written, so this is a hard ban,
  not a style preference.
- Second person. Talk TO the reader, not about a concept.
- Lead with the stakes or the confrontation, not the mechanism. Don't
  describe what a study found. Describe what it means for the reader's next
  decision.
- Short. Fragments are fine. Cut every word that isn't pulling weight.
- No hedging language. Not "may help," "can improve," "studies suggest."
  Say it straight, then let the citation carry the credibility.
- Zero generic self-help phrasing. Ban "unlock your potential," "the power
  of X," "level up," "journey," "you got this," "believe in yourself" used
  as a bare platitude. If a line could appear on literally any motivation
  account with the noun swapped, rewrite it.
- Specificity beats abstraction. A number, a timeframe, a concrete action
  beats an adjective every time.

A strong hook technique, use it often but not on every single slide or
script: name a very specific, relatable moment the reader has actually
lived. "You know when..." is the clearest version of this. Example: "You
know when you wake up and you physically cannot get out of bed, even though
nothing is technically wrong with you." That line does more work than any
generic line about motivation, because the reader recognizes themselves in
it immediately.

BAD (generic, textbook, could be any account):
"Cold exposure has been shown to increase dopamine levels and may improve
mood and focus over time."

GOOD (same fact, actually lands):
"You know that feeling in a cold shower where every part of you wants to
get out. Stay in for 90 seconds. Your dopamine stays elevated for hours
after, not minutes. Most people won't do it. That's the entire advantage."

BAD:
"Discipline is important for achieving your goals and unlocking your full
potential."

GOOD:
"You don't need motivation. It left weeks ago. You need a version of
yourself that shows up without it."

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
The first sentence is the hook. It has to work with zero context, before
the viewer has decided whether to keep watching. A "you know when" style
relatable moment often works well here. Write the hook last if that helps,
then put it first.

Return JSON exactly as: {"script": "...", "caption": "..."}`,
    });
    const parsed = JSON.parse(raw) as { script: string; caption: string };
    return { format: "reel", script: parsed.script, caption: parsed.caption };
  }

  const raw = await generateText({
    system: SYSTEM_PROMPT,
    prompt: `Pillar: ${pillar.label}\nBrief: ${pillar.brief}\nstoryContext: ${storyContext}

Write 4 Instagram carousel content slides (punchy, one idea per slide, under
30 words each, shorter is almost always better here). Slide 1 must open
with a direct confrontation, a "you know when" style relatable moment, or a
specific concrete claim that stops the scroll. Not a mild setup line. Each
slide that makes a factual claim needs a "citation" naming the specific real
source (study name or Huberman Lab episode). Use null for a slide that is
pure narrative or opinion with no factual claim. Also write:
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
