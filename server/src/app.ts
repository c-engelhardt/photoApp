// Bootstraps Fastify plugins, routes, and network listener.
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.js";
import { inviteRoutes } from "./routes/invites.js";
import { photoRoutes } from "./routes/photos.js";
import { albumRoutes } from "./routes/albums.js";
import { shareRoutes } from "./routes/share.js";
import { tagRoutes } from "./routes/tags.js";

const app = Fastify({
  logger: true,
  trustProxy: true
});

const start = async () => {
  try {
    // Register shared infrastructure before mounting application routes.
    await app.register(cors, {
      origin: env.CORS_ORIGIN,
      credentials: true
    });

    await app.register(cookie);
    await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
    await app.register(multipart, { limits: { fileSize: env.MAX_UPLOAD_BYTES } });

    // Lightweight probe for orchestration and uptime checks.
    app.get("/health", async () => ({ ok: true }));

    // Routes are mounted under a common API prefix for the frontend.
    await app.register(authRoutes, { prefix: "/api" });
    await app.register(inviteRoutes, { prefix: "/api" });
    await app.register(photoRoutes, { prefix: "/api" });
    await app.register(albumRoutes, { prefix: "/api" });
    await app.register(shareRoutes, { prefix: "/api" });
    await app.register(tagRoutes, { prefix: "/api" });

    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
