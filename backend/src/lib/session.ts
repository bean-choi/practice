import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import ms from "ms";
import { env } from "../config.ts";

interface SessionPayload {
  userId: string;
}

const JWT_TTL = env.JWT_EXPIRES_IN as ms.StringValue;

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: ms(JWT_TTL),
};

export function issueSession(res: Response, payload: SessionPayload) {
  const token = jwt.sign({ sub: payload.userId }, env.JWT_SECRET, {
    expiresIn: JWT_TTL,
  });

  res.cookie(env.COOKIE_NAME, token, COOKIE_OPTIONS);
  return token;
}

export function clearSession(res: Response) {
  res.clearCookie(env.COOKIE_NAME, {
    ...COOKIE_OPTIONS,
    maxAge: undefined,
  });
}

export function decodeSession(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
    };

    return { userId: payload.sub };
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return null;
    }
    throw err;
  }
}
