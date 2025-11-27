import { Router } from "express";
import { z } from "zod";
import { FriendshipStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.ts";
import { requireAuth } from "../middlewares/auth.ts";

const router = Router();

const targetSchema = z.object({
  targetId: z.string().min(1),
});

// 친구 요청
router.post("/request", requireAuth, async (req, res) => {
  const { targetId } = targetSchema.parse(req.body);

  if (targetId === req.user!.id) {
    return res.status(400).json({ message: "Cannot send friend request to yourself" });
  }

  const friendship = await prisma.friendship.upsert({
    where: {
      requesterId_targetId: {
        requesterId: req.user!.id,
        targetId,
      },
    },
    update: {
      status: FriendshipStatus.PENDING,
    },
    create: {
      requesterId: req.user!.id,
      targetId,
      status: FriendshipStatus.PENDING,
    },
  });

  return res.json({ friendship });
});

// 친구 수락
router.post("/accept", requireAuth, async (req, res) => {
  const { targetId: requesterId } = targetSchema.parse(req.body);

  const result = await prisma.friendship.updateMany({
    where: {
      requesterId,
      targetId: req.user!.id,
      status: FriendshipStatus.PENDING,
    },
    data: {
      status: FriendshipStatus.FRIEND,
    },
  });

  return res.json({ updated: result.count });
});

// 친한 친구로 설정
router.post("/close-friend", requireAuth, async (req, res) => {
  const { targetId } = targetSchema.parse(req.body);

  const result = await prisma.friendship.updateMany({
    where: {
      requesterId: req.user!.id,
      targetId,
    },
    data: {
      status: FriendshipStatus.CLOSE_FRIEND,
    },
  });

  return res.json({ updated: result.count });
});

// 차단
router.post("/block", requireAuth, async (req, res) => {
  const { targetId } = targetSchema.parse(req.body);

  const friendship = await prisma.friendship.upsert({
    where: {
      requesterId_targetId: {
        requesterId: req.user!.id,
        targetId,
      },
    },
    update: {
      status: FriendshipStatus.BLOCKED,
    },
    create: {
      requesterId: req.user!.id,
      targetId,
      status: FriendshipStatus.BLOCKED,
    },
  });

  return res.json({ friendship });
});

export default router;
