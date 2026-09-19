import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY must be set");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Uploads a local file to R2 and returns its public URL. The Instagram
 * Graph API needs a publicly fetchable URL for video_url/image_url, so
 * every rendered asset passes through here before publishing.
 */
export async function uploadPublicAsset(params: {
  localPath: string;
  key: string;
  contentType: string;
}): Promise<string> {
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (!bucket) throw new Error("R2_BUCKET is not set");
  if (!publicBase) throw new Error("R2_PUBLIC_BASE_URL is not set");

  const body = await readFile(params.localPath);
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: body,
      ContentType: params.contentType,
    })
  );

  return `${publicBase.replace(/\/$/, "")}/${params.key}`;
}
