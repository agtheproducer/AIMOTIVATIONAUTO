import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, "..", "state", "last-post.json");

/** How many slot keys to keep before trimming the oldest. */
const HISTORY_LIMIT = 30;

export interface State {
  /** Slot keys already published, e.g. ["2026-09-21-AM"]. Oldest first. */
  postedKeys: string[];
  /**
   * @deprecated Single-slot field used by the original version of this
   * pipeline. Still read (and migrated into `postedKeys`) so an existing
   * state file in the repo keeps working, but no longer written.
   */
  lastPostedKey?: string | null;
}

export async function readState(): Promise<State> {
  let parsed: Partial<State> = {};
  try {
    parsed = JSON.parse(await readFile(STATE_PATH, "utf-8")) as Partial<State>;
  } catch {
    return { postedKeys: [] };
  }

  const postedKeys = Array.isArray(parsed.postedKeys) ? parsed.postedKeys.filter((k) => typeof k === "string") : [];

  // Migrate the old single-value field, if this file predates postedKeys.
  if (typeof parsed.lastPostedKey === "string" && !postedKeys.includes(parsed.lastPostedKey)) {
    postedKeys.push(parsed.lastPostedKey);
  }

  return { postedKeys };
}

export async function writeState(state: State): Promise<void> {
  await mkdir(path.dirname(STATE_PATH), { recursive: true });
  const trimmed: State = { postedKeys: state.postedKeys.slice(-HISTORY_LIMIT) };
  await writeFile(STATE_PATH, JSON.stringify(trimmed, null, 2) + "\n", "utf-8");
}

/** Records `key` as published and persists it. */
export async function markPosted(state: State, key: string): Promise<void> {
  if (state.postedKeys.includes(key)) return;
  await writeState({ postedKeys: [...state.postedKeys, key] });
}
