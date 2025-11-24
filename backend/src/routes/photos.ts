import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { buildPublicUrl, createPresignedUpload, objectExists } from "../lib/s3.ts";
import { requireAuth } from "../middlewares/auth.ts";

const router = Router();

const presignUrlSchema = z.object({
  contentType: z.string().startsWith("image/"),
  fileSize: z.int().nonnegative(),
});

// [실습3] Zod
// TODO: 사진 생성 요청을 처리하기 위한 스키마를 정의합니다.
// 다음 조건을 만족해야 합니다:
// - title: 1자 이상 120자 이하의 문자열
// - description: 최대 500자의 문자열 (기본값: 빈 문자열)
// - isPublic: 불리언 값 (기본값: true)
// - imageKey: 1자 이상의 문자열
// 아래에 코드를 작성하세요.
const photoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .default(""),
  isPublic: z
    .boolean()
    .default(true),
  imageKey: z
    .string()
    .min(1),
});
// 위에 코드를 작성하세요.

function toPhotoResponse(photo: {
  id: string;
  title: string;
  description: string | null;
  imageKey: string;
  isPublic: boolean;
  createdAt: Date;
  user: { username: string };
}) {
  return {
    id: photo.id,
    title: photo.title,
    description: photo.description,
    imageUrl: buildPublicUrl(photo.imageKey),
    isPublic: photo.isPublic,
    createdAt: photo.createdAt,
    username: photo.user.username,
  };
}

router.get("/", async (_req, res) => {
  const photos = await prisma.photo.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } } },
  });

  return res.json({ photos: photos.map(toPhotoResponse) });
});

router.get("/user/:username", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: { id: true, username: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const includePrivate = req.user?.id === user.id;
  const photos = await prisma.photo.findMany({
    where: {
      userId: user.id,
      ...(includePrivate ? {} : { isPublic: true }),
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } } },
  });

  return res.json({
    user: { id: user.id, username: user.username },
    photos: photos.map(toPhotoResponse),
  });
});

router.post("/upload-url", requireAuth, async (req, res) => {
  const { contentType, fileSize } = presignUrlSchema.parse(req.body);

  if (fileSize === 0) {
    return res.status(400).json({ message: "Invalid file size" });
  }

  const key = `photos/${req.user!.id}/${crypto.randomUUID()}`;
  const uploadPayload = await createPresignedUpload({
    key,
    contentType,
  });

  return res.json(uploadPayload);
});

router.post("/", requireAuth, async (req, res) => {
  // [실습3] Zod
  // TODO: 사용자의 입력이 유효한지 검증합니다.
  // 아래에 코드를 작성하세요.
  const { title, description, isPublic, imageKey } = photoSchema.parse(req.body);
  // 위에 코드를 작성하세요.
  // 코드를 작성한 후, 바로 아랫줄의 코드를 삭제하세요.
  
  // 바로 윗줄의 코드를 삭제하세요.

  if (!imageKey.startsWith(`photos/${req.user!.id}/`)) {
    return res.status(400).json({ message: "Invalid image key" });
  }

  // [실습2] AWS S3
  // TODO: S3에 실제로 이미지가 존재하는지 확인한 후 DB에 이미지 정보를 저장합니다.
  // 아래에 코드를 작성하세요.
  const imageExists = await objectExists(imageKey);

  if (!imageExists) {
    return res.status(400).json({ message: "Image not found" });
  }

  const photo = await prisma.photo.create({
    data: {
      title,
      description,
      isPublic,
      imageKey,
      userId: req.user!.id,
    },
    include: { user: { select: { username: true } } },
  });
  // 위에 코드를 작성하세요.

  return res.status(201).json({ photo: toPhotoResponse(photo) });
});

export default router;
