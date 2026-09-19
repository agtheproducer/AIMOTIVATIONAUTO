import type { Format, PillarId } from "./pillars.js";

export type Slot = "AM" | "PM";

export interface CalendarEntry {
  pillar: PillarId;
  format: Format | "story"; // "story" = not handled by this pipeline yet, see README
  note?: string;
}

// Luxon weekday: 1 = Monday ... 7 = Sunday
// Mirrors the "Weekly Editorial Calendar" section of the business/marketing plan doc.
export const CALENDAR: Record<number, Record<Slot, CalendarEntry>> = {
  1: {
    AM: { pillar: "protocol", format: "carousel", note: "New week, new system" },
    PM: { pillar: "fight", format: "reel", note: "Monday motivation" },
  },
  2: {
    AM: { pillar: "diagnosis", format: "reel", note: "Phone addiction/dopamine science" },
    PM: { pillar: "protocol", format: "carousel", note: "Protocol deep-dive part 2" },
  },
  3: {
    AM: { pillar: "diagnosis", format: "carousel", note: "Low-T signs & causes" },
    PM: { pillar: "fight", format: "reel", note: "Mid-week grind" },
  },
  4: {
    AM: { pillar: "protocol", format: "reel", note: "Quick actionable tip" },
    PM: { pillar: "proof", format: "carousel", note: "Stats/proof + comment MOTIVATION CTA" },
  },
  5: {
    AM: { pillar: "protocol", format: "carousel", note: "Weekend-proof plan" },
    PM: { pillar: "fight", format: "reel", note: "Weekly recap" },
  },
  6: {
    AM: { pillar: "diagnosis", format: "reel", note: "Myth-bust, higher reach day" },
    PM: { pillar: "diagnosis", format: "carousel", note: "Lighter/relatable tone" },
  },
  7: {
    // Sunday AM is story-heavy in the plan (polls/Q&A) -- not handled by this
    // pipeline yet; post manually or extend publish.ts to support Stories.
    AM: { pillar: "diagnosis", format: "story", note: "Story-heavy day: polls, Q&A" },
    PM: { pillar: "protocol", format: "carousel", note: "Week-ahead preview + DM CTA" },
  },
};
