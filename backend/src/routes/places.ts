import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middlewares/auth.ts";
import { canViewFeed } from "../services/privacy.ts";

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

// 장소 생성 (간단히 requireAuth만; 필요하면 관리자 체크 추가)
router.post("/", requireAuth, async (req, res) => {
  const parsed = placeSchema.parse(req.body);

  const place = await prisma.place.create({
    data: {
      name: parsed.name,
      xCoord: parsed.xCoord,
      yCoord: parsed.yCoord,
      description: parsed.description ?? null,  // ⬅️ 핵심
    },
  });

  return res.status(201).json({ place });
});

// 특정 장소의 최근 24시간 피드 조회
router.get("/:placeId/feeds", async (req, res) => {
  const { placeId } = req.params;
  const viewerId = req.user?.id;
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

  return res.json({ feeds: visible });
});

export default router;
