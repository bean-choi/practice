import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { clearSession, issueSession } from "../lib/session.ts";
import { requireAuth } from "../middlewares/auth.ts";

const router = Router();

const credentialsSchema = z.object({
  username: z
    .string()
    .min(3, "Username은 3글자 이상이여야 합니다")
    .max(16, "Username은 16글자 이하여야 합니다")
    .regex(/^[a-zA-Z0-9_]+$/, "Username은 영어 알파벳, 숫자, 언더바(_)만 포함할 수 있습니다"),
  password: z.string().min(8, "비밀번호는 8글자 이상이여야 합니다").max(32, "비밀번호는 32글자 이하여야 합니다"),
});

router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = credentialsSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ message: "사용중인 Username입니다" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true, createdAt: true },
    });

    issueSession(res, { userId: user.id });

    return res.status(201).json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]!.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = credentialsSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ message: "부적절한 username 혹은 비밀번호입니다" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "부적절한 username 혹은 비밀번호입니다" });
    }

    issueSession(res, { userId: user.id });

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.issues[0]!.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", requireAuth, async (_req, res) => {
  clearSession(res);
  return res.status(204).end();
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, username: true, createdAt: true },
  });

  return res.json({ user });
});

export default router;
