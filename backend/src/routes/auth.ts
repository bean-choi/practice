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
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, digits, and underscores"),
  password: z.string().min(8).max(64),
});

router.post("/register", async (req, res) => {
  const { username, password } = credentialsSchema.parse(req.body);
  const existingUser = await prisma.user.findUnique({ where: { username } });

  if (existingUser) {
    return res.status(409).json({ message: "Username is already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true, createdAt: true },
  });

  issueSession(res, { userId: user.id });
  return res.status(201).json({ user });
});

router.post("/login", async (req, res) => {
  const { username, password } = credentialsSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, passwordHash: true, createdAt: true },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid username" });
  }

  // [실습1] Authentication
  // TODO: 아이디와 비밀번호가 올바른 경우 JWT를 발급한 후 쿠키로 전송합니다.
  // HINT: 비밀번호가 일치하는지 확인하려면 await bcrypt.compare(password, <DB에 저장된 해시값>)를 사용하세요.
  // 아래에 코드를 작성하세요.
  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid password" });
  }

  issueSession(res, { userId: user.id });

  // 위에 코드를 작성하세요.
  return res.json({
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    },
  });
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
