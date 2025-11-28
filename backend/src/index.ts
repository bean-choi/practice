import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config.ts";
import { attachUser } from "./middlewares/auth.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";
import authRouter from "./routes/auth.ts";
import placesRouter from "./routes/places.ts";
import feedsRouter from "./routes/feeds.ts";
import friendshipsRouter from "./routes/friendships.ts";
import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development",
});

const app = express();

// Middlewares
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.length === 0 ? true : env.ALLOWED_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json({ limit: `${env.MAX_UPLOAD_SIZE_MB}mb` }));
app.use(cookieParser());
app.use(attachUser);

// Routers
app.use("/api/auth", authRouter);
app.use("/api/places", placesRouter);
app.use("/api/feeds", feedsRouter);
app.use("/api/friendships", friendshipsRouter);

// Error handler
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
