import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { synthesizeSpeech } from "../lib/elevenlabs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOTION_ROOT = path.join(__dirname, "..", "..", "remotion");
const PUBLIC_DIR = path.join(REMOTION_ROOT, "public");
const OUT_DIR = path.join(__dirname, "..", "..", "render-tmp");

export async function renderReel(params: { script: string; id: string }): Promise<string> {
  await mkdir(PUBLIC_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const { audio, words } = await synthesizeSpeech(params.script);
  const audioFilename = `${params.id}.mp3`;
  await writeFile(path.join(PUBLIC_DIR, audioFilename), audio);

  const bundleLocation = await bundle({
    entryPoint: path.join(REMOTION_ROOT, "Root.tsx"),
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "Reel",
    inputProps: { captionWords: words, audioSrc: audioFilename },
  });

  const lastWordEndMs = words.length > 0 ? words[words.length - 1].endMs : 0;
  const durationInFrames = Math.min(
    composition.durationInFrames,
    Math.ceil(((lastWordEndMs + 1000) / 1000) * composition.fps)
  );

  const outputLocation = path.join(OUT_DIR, `${params.id}.mp4`);
  await renderMedia({
    composition: { ...composition, durationInFrames },
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps: { captionWords: words, audioSrc: audioFilename },
  });

  return outputLocation;
}
