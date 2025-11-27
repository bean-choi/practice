import crypto from "node:crypto";
import { Router } from "express";
import { FeedStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middlewares/auth.ts";
import { canViewFeed } from "../services/privacy.ts";
import { createPresignedUpload, buildPublicUrl, objectExists } from "../lib/s3.ts";

const router = Router();

const feedCreateSchema = z.object({
  placeId: z.string().min(1),
  content: z.string().min(1).max(2000),
  status: z.nativeEnum(FeedStatus),
  imageKey: z.string().min(1).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

const uploadUrlSchema = z.object({
  contentType: z.string().startsWith("image/"),
  fileSize: z.number().int().nonnegative(),
});

// presigned 업로드 URL 발급
router.post("/upload-url", requireAuth, async (req, res) => {
  const { contentType, fileSize } = uploadUrlSchema.parse(req.body);

  if (fileSize === 0) {
    return res.status(400).json({ message: "Invalid file size" });
  }

  const key = `feeds/${req.user!.id}/${crypto.randomUUID()}`;

  const uploadPayload = await createPresignedUpload({
    key,
    contentType,
  });

  return res.json(uploadPayload);
});

// 새 피드 작성
router.post("/", requireAuth, async (req, res) => {
  const { placeId, content, status, imageKey } = feedCreateSchema.parse(req.body);

  if (imageKey) {
    const exists = await objectExists(imageKey);
    if (!exists) {
      return res.status(400).json({ message: "Image not found in S3" });
    }
  }

  const feed = await prisma.feed.create({
    data: {
      authorId: req.user!.id,
      placeId,
      content,
      status,
      imageKey: imageKey ?? null,
    },
    include: {
      author: { select: { id: true, username: true } },
    },
  });

  return res.status(201).json({
    feed: {
      ...feed,
      imageUrl: feed.imageKey ? buildPublicUrl(feed.imageKey) : null,
    },
  });
});

// 피드 상세 조회
router.get("/:feedId", async (req, res) => {
  const { feedId } = req.params;
  const viewerId = req.user?.id;

  const feed = await prisma.feed.findUnique({
    where: { id: feedId },
    include: {
      author: { select: { id: true, username: true } },
      place: true,
      comments: {
        include: { author: { select: { id: true, username: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!feed) {
    return res.status(404).json({ message: "Feed not found" });
  }

  const ok = await canViewFeed(viewerId, feed.authorId, feed.status);
  if (!ok) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({
    feed: {
      ...feed,
      imageUrl: feed.imageKey ? buildPublicUrl(feed.imageKey) : null,
    },
  });
});

// 댓글 작성
router.post("/:feedId/comments", requireAuth, async (req, res) => {
  const { feedId } = req.params;
  if (!feedId) {
    return res.status(400).json({ message: "Invalid feed id" });
  }

  const { content } = commentSchema.parse(req.body);

  const feed = await prisma.feed.findUnique({ where: { id: feedId } });
  if (!feed) {
    return res.status(404).json({ message: "Feed not found" });
  }

  const ok = await canViewFeed(req.user!.id, feed.authorId, feed.status);
  if (!ok) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const comment = await prisma.comment.create({
    data: {
      feedId,
      authorId: req.user!.id,
      content,
    },
    include: {
      author: { select: { id: true, username: true } },
    },
  });

  return res.status(201).json({ comment });
});

// 좋아요
router.post("/:feedId/like", requireAuth, async (req, res) => {
  const { feedId } = req.params;
  if (!feedId) {
    return res.status(400).json({ message: "Invalid feed id" });
  }

  const feed = await prisma.feed.findUnique({ where: { id: feedId } });
  if (!feed) {
    return res.status(404).json({ message: "Feed not found" });
  }

  const ok = await canViewFeed(req.user!.id, feed.authorId, feed.status);
  if (!ok) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.feedLike.upsert({
    where: {
      userId_feedId: {
        userId: req.user!.id,
        feedId,
      },
    },
    update: {},
    create: {
      userId: req.user!.id,
      feedId,
    },
  });

  return res.json({ ok: true });
});

// 좋아요 취소
router.delete("/:feedId/like", requireAuth, async (req, res) => {
  const { feedId } = req.params;
  if (!feedId) {
    return res.status(400).json({ message: "Invalid feed id" });
  }

  await prisma.feedLike.deleteMany({
    where: {
      userId: req.user!.id,
      feedId,
    },
  });

  return res.json({ ok: true });
});

export default router;
