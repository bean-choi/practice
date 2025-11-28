import crypto from "node:crypto";
import { Router } from "express";
import { FeedStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middlewares/auth.ts";
import { canViewFeed } from "../services/privacy.ts";
import {
  createPresignedUpload,
  buildPublicUrl,
  objectExists,
} from "../lib/s3.ts";

const router = Router();

// 새 피드(포스트) 생성 요청 body 검증
const feedCreateSchema = z.object({
  placeId: z.string().min(1),
  content: z.string().min(1, "내용을 포함해야 합니다").max(2000, "내용은 2000자 이하여야 합니다"),
  title: z.string().min(1, "제목을 포함해야 합니다").max(100, "제목은 100자 이하여야 합니다"), 
  status: z.nativeEnum(FeedStatus),
  imageKey: z.string().min(1).optional().nullable(),
});

// 댓글 생성 요청 body 검증
const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

// presigned 업로드 URL 생성 요청 body 검증
const uploadUrlSchema = z.object({
  contentType: z.string().startsWith("image/"),
  fileSize: z.number().int().nonnegative(),
});

//
// 1) 이미지 업로드용 presigned POST 생성
//    (프론트: /api/feeds/upload-url → S3로 직접 업로드 → /api/feeds 로 피드 생성)
//
router.post("/upload-url", requireAuth, async (req, res) => {
  const { contentType, fileSize } = uploadUrlSchema.parse(req.body);

  if (fileSize === 0) {
    return res.status(400).json({ message: "Invalid file size" });
  }

  // 유저별 폴더 + 랜덤 UUID를 key로 사용
  const key = `feeds/${req.user!.id}/${crypto.randomUUID()}`;

  const uploadPayload = await createPresignedUpload(key, contentType);

  // { url, fields, key, fileUrl } 형태로 응답
  return res.json(uploadPayload);
});

//
// 2) 새 피드(포스트) 작성
//
router.post("/", requireAuth, async (req, res) => {
  try{
    const { placeId, content, title, status, imageKey } = feedCreateSchema.parse(
      req.body
    );

    // imageKey가 넘어왔으면 실제로 S3에 있는지 한 번 확인
    if (imageKey) {
      const exists = await objectExists(imageKey);
      if (!exists) {
        return res.status(400).json({ message: "Image not found in S3" });
      }
    }

    // 존재하는 place인지 확인 (미리 정의된 장소에만 작성 가능)
    const place = await prisma.place.findUnique({ where: { id: placeId } });
    if (!place) {
      return res
        .status(400)
        .json({
          message: "Invalid place. You can post only to predefined places.",
        });
    }

    // feed 생성
    const feed = await prisma.feed.create({
      data: {
        authorId: req.user!.id,
        placeId,
        content,
        title,
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
        // 응답에 imageKey 추가(프론트에서 그대로 <img src> 로 사용)
        imageKey: feed.imageKey ? buildPublicUrl(feed.imageKey) : null,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]!.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

//
// 3) 피드 상세 조회
//
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
      likes: {
        select: {
          userId: true,
        },
      },
      _count: {
        select: {
          likes: true,  // ← 여기
        },
      },
    },
  });

  if (!feed) {
    return res.status(404).json({ message: "Feed not found" });
  }

  const likedByMe = feed.likes.some((like) => like.userId === viewerId);

  const ok = await canViewFeed(viewerId, feed.authorId, feed.status);
  if (!ok) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({
    feed: {
      ...feed,
      imageKey: feed.imageKey ? buildPublicUrl(feed.imageKey) : null,
      likedByMe,
    },
  });
});

//
// 4) 댓글 작성
//
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

//
// 5) 좋아요 추가
//
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

//
// 6) 좋아요 취소
//
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
