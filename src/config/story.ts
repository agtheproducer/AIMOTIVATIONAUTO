// The protagonist's real transformation story, as told by the founder.
// Nothing here is invented -- every field traces back to what was actually
// said. Identity stays anonymous by choice: narrated as "I/me", never a
// real name, even though the account itself is branded THE PROTOCOL.
//
// Until `turningPoints` is non-empty, generateContent.ts will skip the
// "Fight" and "Proof" pillars (which depend on the real narrative) and only
// generate "Protocol" and "Diagnosis" content, which don't require it.

export interface StoryConfig {
  // Deliberately null: the narrator is never named on the account.
  protagonistName: string | null;
  // Free text, not a precise date -- exact date was never given.
  startDate: string | null;
  summary: string | null;
  turningPoints: string[];
  // A standalone belief worth quoting on its own, not just background.
  corePhilosophy: string | null;
}

export const story: StoryConfig = {
  protagonistName: null,
  startDate: "Right after high school graduation",
  summary:
    "When everyone else went off to university, I stayed back and tried to " +
    "follow -- and felt insecure, lost, and weak. No idea how to 'do life,' " +
    "no future I could picture for myself. Goggins content is what first cut " +
    "through that. What actually changed things was taking care of myself: " +
    "sports (not alone -- collective, team-based training), self-teaching " +
    "things like coding and engineering with no program forcing me to, and " +
    "deliberately working on self-confidence. Goggins, Huberman, and other " +
    "creators fed the mindset, but the real engine was training with other " +
    "people and building myself outside of any required path. Now I'm doing " +
    "my bachelor's degree, working part-time in IT, and still training -- " +
    "CrossFit regularly, BJJ sometimes.",
  turningPoints: [
    "Didn't follow the default path (university like everyone else) once it clearly wasn't working -- chose to figure life out on my own terms instead, even while still feeling lost.",
    "Started training with other people instead of alone -- collective sports became the anchor habit that rebuilt consistency and confidence, more than any solo routine had.",
    "Began self-teaching outside of any formal program -- coding and engineering, driven by curiosity, not a requirement.",
    "Built a personal protocol out of small compounding habits: lift, read, stay open-minded, work on genuinely being charismatic -- not chasing one big goal.",
    "Now running a full schedule -- bachelor's degree, part-time IT job, CrossFit, occasional BJJ -- proof the system holds up under real life, not just when things were empty.",
  ],
  corePhilosophy:
    "Life doesn't have to be a straight-line plan. Don't build your life to " +
    "make other people happy -- being 'selfish' about your own growth early " +
    "on is not just okay, it's necessary.",
};

export const storyIsReady = (): boolean => story.turningPoints.length > 0;
