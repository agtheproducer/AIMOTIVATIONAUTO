export type PillarId = "protocol" | "fight" | "diagnosis" | "proof";
export type Format = "carousel" | "reel";

export interface Pillar {
  id: PillarId;
  label: string;
  /** Does this pillar require the real protagonist story to be filled in? */
  requiresStory: boolean;
  /** Instructions injected into the content-generation prompt. */
  brief: string;
}

export const PILLARS: Record<PillarId, Pillar> = {
  protocol: {
    id: "protocol",
    label: "The Protocol",
    requiresStory: false,
    brief:
      "An actionable, science-backed protocol the reader can start today " +
      "(cold exposure, sunlight/dopamine regulation, sleep, phone/screen " +
      "limits, testosterone fundamentals). Every claim must cite a specific, " +
      "real, named source (a named study or a specific Huberman Lab episode) " +
      "-- never a vague 'studies show'.",
  },
  diagnosis: {
    id: "diagnosis",
    label: "The Diagnosis",
    requiresStory: false,
    brief:
      "Explain, with real cited science, why the reader feels low drive, " +
      "phone-addicted, or unmotivated (dopamine loops, sleep debt, low " +
      "testosterone signs, depression signs). Educational and diagnostic, " +
      "not just motivational. Cite a specific named source for every claim.",
  },
  fight: {
    id: "fight",
    label: "The Fight",
    requiresStory: true,
    brief:
      "Raw, blunt, tough-love motivation narrated from the protagonist's " +
      "real day-by-day transformation. Ground it in a specific real detail " +
      "from the protagonist's story (see storyContext) -- never invent " +
      "details not present in storyContext.",
  },
  proof: {
    id: "proof",
    label: "The Proof",
    requiresStory: true,
    brief:
      "Evidence the system works: a real, specific progress marker from the " +
      "protagonist's story (see storyContext). Never fabricate numbers or " +
      "outcomes not present in storyContext.",
  },
};

export const PILLARS_AVAILABLE_WITHOUT_STORY: PillarId[] = ["protocol", "diagnosis"];
