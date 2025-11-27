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

const MAX_UPLOAD_SIZE_BYTES = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const PRESIGNED_URL_TTL = 300; // 5 minutes

export function buildPublicUrl(key: string) {
  if (env.AWS_CLOUDFRONT_URL) {
    const base = env.AWS_CLOUDFRONT_URL.replace(/\/$/, "");
    return `${base}/${key}`;
  }

  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") {
      return false;
    }
    throw err;
  }
}

interface CreatePresignedUploadParams {
  key: string;
  contentType: string;
}

export async function createPresignedUpload(params: CreatePresignedUploadParams) {
  const key = params.key;

  const { url, fields } = await createPresignedPost(s3, {
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Fields: {
      "Content-Type": params.contentType,
    },
    Conditions: [
      ["content-length-range", 1, MAX_UPLOAD_SIZE_BYTES],
    ],
    Expires: PRESIGNED_URL_TTL,
  });

  return {
    key,
    uploadUrl: url,
    fields,
    publicUrl: buildPublicUrl(key),
    expiresIn: PRESIGNED_URL_TTL,
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
  };
}
