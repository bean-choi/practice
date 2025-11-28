// backend/src/lib/s3.ts
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { env } from "../config.ts";

// 공통 S3 클라이언트
export const s3 = new S3Client({
  region: env.AWS_REGION,
});

/**
 * S3 object key로부터 public URL(CloudFront 기준)을 만든다.
 * - env.AWS_CLOUDFRONT_URL 이 있으면 그걸 우선 사용
 * - 없으면 S3 기본 URL 사용
 */
export function buildPublicUrl(key: string): string {
  if (env.AWS_CLOUDFRONT_URL) {
    // 예: https://dxxxxx.cloudfront.net/feeds/...
    return `${env.AWS_CLOUDFRONT_URL}/${key}`;
  }
  // 예: https://my-bucket.s3.ap-northeast-2.amazonaws.com/feeds/...
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * 주어진 key에 대한 presigned POST 업로드 정보를 생성한다.
 * - `key`: S3 object key (예: "feeds/abc123.png")
 * - `contentType`: MIME type (예: "image/png")
 * - `maxBytes`: 최대 업로드 크기 (바이트 단위, 선택)
 *
 * 반환값:
 * - url: presigned POST URL
 * - fields: formData에 넣어야 하는 hidden 필드들
 * - key: 업로드될 S3 object key
 * - fileUrl: 최종 접근 가능한 URL (CloudFront or S3)
 */
export async function createPresignedUpload(
  key: string,
  contentType: string,
  maxBytes?: number
): Promise<{
  url: string;
  fields: Record<string, string>;
  key: string;
  fileUrl: string;
}> {
  const limit = maxBytes ?? env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

  const presigned = await createPresignedPost(s3, {
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Fields: {
      "Content-Type": contentType,
    },
    Conditions: [
      ["starts-with", "$Content-Type", "image/"],
      ["content-length-range", 0, limit],
    ],
    Expires: 60 * 5, // 5분
  });

  const fileUrl = buildPublicUrl(key);

  return {
    url: presigned.url,
    fields: presigned.fields,
    key,
    fileUrl,
  };
}

/**
 * 주어진 key의 객체가 S3에 존재하는지 확인한다.
 */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (e: any) {
    if (e?.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw e;
  }
}

/**
 * "피드 이미지" 전용 헬퍼
 * - 내부적으로 createPresignedUpload 를 그대로 래핑해도 되고,
 *   추가 정책이 필요하면 여기에서 넣을 수 있습니다.
 */
export async function createFeedImageUpload(
  key: string,
  contentType: string,
  maxBytes?: number
) {
  return createPresignedUpload(key, contentType, maxBytes);
}

/**
 * imageKey -> URL 변환 헬퍼
 * (null/undefined 안전 처리 포함)
 */
export function imageKeyToUrl(
  key: string | null | undefined
): string | null {
  if (!key) return null;
  return buildPublicUrl(key);
}
