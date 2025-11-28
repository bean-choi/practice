// backend/src/routers/places.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middlewares/auth.ts";
import { canViewFeed } from "../services/privacy.ts";
import { buildPublicUrl } from "../lib/s3.ts";

const router = Router();

const placeSchema = z.object({
  name: z.string().min(1).max(100),
  xCoord: z.number().int(),
  yCoord: z.number().int(),
  description: z.string().max(255).optional(),
});

// 모든 장소 조회
router.get("/", async (_req, res) => {
  const places = await prisma.place.findMany({
    orderBy: { name: "asc" },
  });

  return res.json({ places });
});

// (관리자용이라면) 장소 생성
router.post("/", requireAuth, async (req, res) => {
  const parsed = placeSchema.parse(req.body);

  const place = await prisma.place.create({
    data: {
      name: parsed.name,
      xCoord: parsed.xCoord,
      yCoord: parsed.yCoord,
      description: parsed.description ?? null,
    },
  });

  return res.status(201).json({ place });
});

// 특정 장소의 최근 피드들 조회 (MapPage에서 사용)
// GET /api/places/:placeId/feeds
router.get("/:placeId/feeds", requireAuth, async (req, res) => {
  const { placeId } = req.params;
  const viewerId = req.user!.id;

  if (!placeId) {
    return res.status(400).json({ message: "Invalid place id" });
  }

  // 최근 24시간 기준 (기존 코드에 맞춰 since 계산)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const feeds = await prisma.feed.findMany({
    where: {
      placeId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  const visible: typeof feeds = [];
  for (const feed of feeds) {
    const ok = await canViewFeed(viewerId, feed.authorId, feed.status);
    if (ok) visible.push(feed);
  }

  // 여기서 imageKey 을 붙여서 반환
  return res.json({
    feeds: visible.map((feed) => ({
      ...feed,
      imageKey: feed.imageKey ? buildPublicUrl(feed.imageKey) : null,
    })),
  });
});

export default router;
