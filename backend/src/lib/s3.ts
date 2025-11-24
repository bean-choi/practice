import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { env } from "../config.ts";

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const KEY_PREFIX = "gallery/";
const MAX_UPLOAD_SIZE_BYTES = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const PRESIGNED_URL_TTL = 300; // 5 minutes

function toS3Key(key: string) {
  return `${KEY_PREFIX}${key}`;
}

export async function objectExists(key: string) {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: toS3Key(key),
      }),
    );
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === "NotFound") {
      return false;
    }
    throw err;
  }
}

export function buildPublicUrl(key: string) {
  const bucketUrl = env.AWS_CLOUDFRONT_URL
    ? env.AWS_CLOUDFRONT_URL
    : `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;

  return `${bucketUrl}/${toS3Key(key)}`;
}

export async function createPresignedUpload(params: { key: string; contentType: string }) {
  const s3Key = toS3Key(params.key);
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: env.AWS_S3_BUCKET,
    Key: s3Key,
    Fields: {
      "Content-Type": params.contentType,
    },
    Conditions: [
      ["eq", "$Content-Type", params.contentType],
      ["content-length-range", 1, MAX_UPLOAD_SIZE_BYTES],
    ],
    Expires: PRESIGNED_URL_TTL,
  });

  return {
    key: params.key,
    uploadUrl: url,
    fields,
    publicUrl: buildPublicUrl(params.key),
    expiresIn: PRESIGNED_URL_TTL,
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
  };
}
