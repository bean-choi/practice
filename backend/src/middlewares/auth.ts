import type { NextFunction, Request, Response } from "express";
import { env } from "../config.ts";
import { clearSession, decodeSession } from "../lib/session.ts";

const BEARER_PREFIX = "bearer ";

function getTokenFromAuthHeader(req: Request) {
  const header = req.header("authorization");

  return header?.toLowerCase().startsWith(BEARER_PREFIX)
    ? header.slice(BEARER_PREFIX.length).trim()
    : null;
}

export function attachUser(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[env.COOKIE_NAME] ?? getTokenFromAuthHeader(req);

  if (!token) {
    return next();
  }

  // [실습1] Authentication
  // TODO: 토큰을 디코딩하여 사용자 정보를 얻은 후 req.user에 저장합니다.
  // 아래에 코드를 작성하세요.
  const session = decodeSession(token);

  if (!session) {
    clearSession(res);
    return next();
  }

  req.user = {
    id: session.userId,
  };

  // 위에 코드를 작성하세요.

  return next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  return next();
}
