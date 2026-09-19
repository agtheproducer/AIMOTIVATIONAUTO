import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOTION_ROOT = path.join(__dirname, "..", "..", "remotion");
const OUT_DIR = path.join(__dirname, "..", "..", "render-tmp");

export async function renderCarousel(params: {
  slides: string[];
  id: string;
}): Promise<string[]> {
  await mkdir(OUT_DIR, { recursive: true });

  const bundleLocation = await bundle({
    entryPoint: path.join(REMOTION_ROOT, "Root.tsx"),
  });

  const outputPaths: string[] = [];
  for (let i = 0; i < params.slides.length; i++) {
    const isCta = i === params.slides.length - 1;
    const inputProps = {
      text: params.slides[i],
      slideNumber: i + 1,
      totalSlides: params.slides.length,
      isCta,
    };
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "CarouselSlide",
      inputProps,
    });
    const outputLocation = path.join(OUT_DIR, `${params.id}-slide-${i + 1}.png`);
    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: outputLocation,
      inputProps,
    });
    outputPaths.push(outputLocation);
  }

  return outputPaths;
}
