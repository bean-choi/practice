import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export async function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: "Invalid input",
      details: z.prettifyError(err),
    });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
