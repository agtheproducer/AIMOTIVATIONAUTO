// The protagonist's real transformation story. Left empty on purpose: the
// content pipeline must never invent personal history. Fill this in once
// the founder's real story has been captured (see the business/marketing
// plan doc, "Brand Persona / Protagonist" section).
//
// Until `turningPoints` is non-empty, generateContent.ts will skip the
// "Fight" and "Proof" pillars (which depend on the real narrative) and only
// generate "Protocol" and "Diagnosis" content, which don't require it.

export interface StoryConfig {
  protagonistName: string | null;
  startDate: string | null; // ISO date, "Day 1" of the story
  summary: string | null;
  turningPoints: string[];
}

export const story: StoryConfig = {
  protagonistName: null,
  startDate: null,
  summary: null,
  turningPoints: [],
};

export const storyIsReady = (): boolean => story.turningPoints.length > 0;
