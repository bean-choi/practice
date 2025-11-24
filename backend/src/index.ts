import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config.ts";
import { attachUser } from "./middlewares/auth.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";
import authRouter from "./routes/auth.ts";
import photosRouter from "./routes/photos.ts";

const app = express();

// Middlewares
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS.length === 0 ? true : env.ALLOWED_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(attachUser);

// Routers
app.use("/api/auth", authRouter);
app.use("/api/photos", photosRouter);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
