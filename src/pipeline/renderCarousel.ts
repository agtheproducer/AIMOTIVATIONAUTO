import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CarouselSlideContent } from "./generateContent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REMOTION_ROOT = path.join(__dirname, "..", "..", "remotion");
const OUT_DIR = path.join(__dirname, "..", "..", "render-tmp");

interface SlideProps extends Record<string, unknown> {
  text: string;
  citation: string | null;
  subtext: string | null;
  slideNumber: number;
  totalSlides: number;
  isCta: boolean;
}

export async function renderCarousel(params: {
  slides: CarouselSlideContent[]; // content slides only
  ctaSubtext: string;
  id: string;
}): Promise<string[]> {
  await mkdir(OUT_DIR, { recursive: true });

  const bundleLocation = await bundle({
    entryPoint: path.join(REMOTION_ROOT, "Root.tsx"),
  });

  const totalSlides = params.slides.length + 1; // + the CTA slide
  const allSlideProps: SlideProps[] = [
    ...params.slides.map((s, i) => ({
      text: s.text,
      citation: s.citation,
      subtext: null,
      slideNumber: i + 1,
      totalSlides,
      isCta: false,
    })),
    {
      text: "Follow for the daily protocol.",
      citation: null,
      subtext: params.ctaSubtext,
      slideNumber: totalSlides,
      totalSlides,
      isCta: true,
    },
  ];

  const outputPaths: string[] = [];
  for (let i = 0; i < allSlideProps.length; i++) {
    const inputProps = allSlideProps[i];
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
