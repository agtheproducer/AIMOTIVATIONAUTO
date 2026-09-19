import { writeFile } from "node:fs/promises";

interface PexelsPhoto {
  src: { large2x: string; large: string };
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
}

/** Finds one portrait-oriented photo matching the query and saves it locally. */
export async function fetchAndSaveImage(params: {
  query: string;
  localPath: string;
}): Promise<boolean> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return false;

  const searchUrl = new URL("https://api.pexels.com/v1/search");
  searchUrl.searchParams.set("query", params.query);
  searchUrl.searchParams.set("orientation", "portrait");
  searchUrl.searchParams.set("per_page", "1");

  const searchRes = await fetch(searchUrl, { headers: { Authorization: apiKey } });
  if (!searchRes.ok) {
    console.warn(`[pexels] search failed for "${params.query}": ${searchRes.status}`);
    return false;
  }
  const { photos } = (await searchRes.json()) as PexelsSearchResponse;
  if (photos.length === 0) {
    console.warn(`[pexels] no results for "${params.query}"`);
    return false;
  }

  const imageRes = await fetch(photos[0].src.large2x);
  if (!imageRes.ok) return false;
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  await writeFile(params.localPath, buffer);
  return true;
}
