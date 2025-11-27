import type { NextFunction, Request, Response } from "express";
import { env } from "../config.ts";
import { clearSession, decodeSession } from "../lib/session.ts";
import { prisma } from "../lib/prisma.ts";

const BEARER_PREFIX = "bearer ";

function getTokenFromAuthHeader(req: Request) {
  const header = req.header("authorization");

  return header?.toLowerCase().startsWith(BEARER_PREFIX)
    ? header.slice(BEARER_PREFIX.length).trim()
    : null;
}

// Express.Request 타입 확장
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
    }

    interface Request {
      user?: User;
    }
  }
}

function resetReqUser(req: Request) {
  if ("user" in req) {
    delete (req as any).user;
  }
}

export async function attachUser(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[env.COOKIE_NAME] ?? getTokenFromAuthHeader(req);

  if (!token) {
    resetReqUser(req);  
    return next();
  }

  const session = decodeSession(token);
  if (!session) {
    clearSession(res);
    resetReqUser(req);  
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true },
    });

    if (!user) {
      clearSession(res);
      resetReqUser(req);
      return next();
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  return next();
}
