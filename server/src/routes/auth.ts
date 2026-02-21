// Authentication endpoints for login, logout, and current-session identity.
import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_DAYS } from "../config/constants.js";
import { generateToken } from "../utils/crypto.js";
import { requireAuth } from "../middleware/auth.js";
import { loginRateLimit } from "../middleware/rateLimit.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const createSession = async (userId: string) => {
  // Session rows let us revoke server-side tokens independently from cookies.
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return { token, expiresAt };
};

export const authRoutes = async (app: FastifyInstance) => {
  app.post(
    "/login",
    { config: { rateLimit: loginRateLimit } },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        reply.code(400).send({ error: "Invalid credentials" });
        return;
      }

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Keep response text consistent to avoid account enumeration hints.
        reply.code(401).send({ error: "Invalid credentials" });
        return;
      }

      const matches = await bcrypt.compare(password, user.passwordHash);
      if (!matches) {
        reply.code(401).send({ error: "Invalid credentials" });
        return;
      }

      const session = await createSession(user.id);
      // Cookie stores only the opaque token; server keeps session metadata.
      reply.setCookie(SESSION_COOKIE_NAME, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.COOKIE_SECURE,
        path: "/",
        maxAge: SESSION_EXPIRES_DAYS * 24 * 60 * 60
      });

      reply.send({ id: user.id, email: user.email, role: user.role });
    }
  );

  app.post("/logout", async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE_NAME];
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    reply.code(204).send();
  });

  app.get("/me", { preHandler: [requireAuth] }, async (request) => {
    // `requireAuth` attaches the hydrated user object onto the request.
    return request.user;
  });
};
