/**
 * Instagram Graph API (Content Publishing) client.
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing
 *
 * Flow for any post: create a media container, then publish it by its
 * creation id. Carousels create one child container per item first.
 */

const GRAPH_VERSION = "v21.0";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

async function graphPost(path: string, params: Record<string, string>): Promise<{ id: string }> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const json = (await res.json()) as { id?: string; error?: { message: string } };
  if (!res.ok || !json.id) {
    throw new Error(`Instagram Graph API error: ${json.error?.message ?? JSON.stringify(json)}`);
  }
  return { id: json.id };
}

function auth(): { igUserId: string; accessToken: string } {
  return {
    igUserId: requireEnv("IG_USER_ID"),
    accessToken: requireEnv("IG_ACCESS_TOKEN"),
  };
}

export async function publishReel(params: { videoUrl: string; caption: string }): Promise<string> {
  const { igUserId, accessToken } = auth();
  const container = await graphPost(`${igUserId}/media`, {
    media_type: "REELS",
    video_url: params.videoUrl,
    caption: params.caption,
    access_token: accessToken,
  });
  return publishContainer(container.id);
}

export async function publishCarousel(params: {
  imageUrls: string[];
  caption: string;
}): Promise<string> {
  const { igUserId, accessToken } = auth();
  if (params.imageUrls.length < 2 || params.imageUrls.length > 10) {
    throw new Error("Carousel needs between 2 and 10 images");
  }

  const children = await Promise.all(
    params.imageUrls.map((imageUrl) =>
      graphPost(`${igUserId}/media`, {
        image_url: imageUrl,
        is_carousel_item: "true",
        access_token: accessToken,
      })
    )
  );

  const container = await graphPost(`${igUserId}/media`, {
    media_type: "CAROUSEL",
    children: children.map((c) => c.id).join(","),
    caption: params.caption,
    access_token: accessToken,
  });
  return publishContainer(container.id);
}

async function publishContainer(creationId: string): Promise<string> {
  const { igUserId, accessToken } = auth();
  const published = await graphPost(`${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: accessToken,
  });
  return published.id;
}
